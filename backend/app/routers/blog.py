import io
import re
import uuid
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from docx import Document
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from lxml import etree
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_admin
from app.models import BlogPost, User
from app.schemas import BlogPostCreate, BlogPostListResponse, BlogPostResponse
from app.config import settings

router = APIRouter(prefix="/api", tags=["blog"])

UPLOAD_DIR = Path(settings.upload_dir)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024


def save_upload(file: UploadFile) -> str:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid image type. Use jpg, png, or webp.")

    content = file.file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB.")

    filename = f"{uuid.uuid4().hex}{suffix}"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    target = UPLOAD_DIR / filename
    target.write_bytes(content)
    return f"/uploads/{filename}"


def _extract_docx_images(docx_bytes: bytes) -> dict[str, str]:
    """
    Extract images from a docx zip and save them to disk, returning a mapping
    of 'embed:rId' URIs (matching what the XML parser produces) to saved URLs.
    """
    image_map: dict[str, str] = {}
    try:
        with zipfile.ZipFile(io.BytesIO(docx_bytes)) as zf:
            # Read the relationships file to map rId -> filename
            # word/_rels/document.xml.rels maps rIdN -> word/media/imageN.png
            rel_map: dict[str, str] = {}  # rId -> filename in zip (e.g. "image1.png")
            try:
                rel_xml = zf.read("word/_rels/document.xml.rels")
                rel_root = etree.fromstring(rel_xml)
                for rel in rel_root:
                    rid = rel.get("Id")
                    target = rel.get("Target", "")
                    if rid and target:
                        # Target may be "media/image1.png" or "../media/image1.png"
                        # Normalize to just the filename part
                        filename = target.split("/")[-1]
                        rel_map[rid] = filename
            except Exception:
                pass

            for name in zf.namelist():
                if name.startswith("word/media/"):
                    img_data = zf.read(name)
                    ext = Path(name).suffix.lower()
                    if ext not in {".png", ".jpg", ".jpeg", ".gif", ".webp"}:
                        ext = ".png"
                    filename = f"{uuid.uuid4().hex}{ext}"
                    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
                    (UPLOAD_DIR / filename).write_bytes(img_data)
                    url = f"/uploads/{filename}"

                    # Key by the media filename (what rel_map values look like)
                    media_basename = name.split("/")[-1]
                    image_map[f"embed:{media_basename}"] = url

                    # Also key by rId if we can find it
                    for rid, media_name in rel_map.items():
                        if media_name == media_basename:
                            image_map[f"embed:{rid}"] = url
    except Exception:
        pass
    return image_map


def _xml_to_html(docx_bytes: bytes, image_map: dict[str, str]) -> tuple[str, str, str]:
    """Parse document.xml from docx using raw XML to capture inline images. Returns (html, first_image_url, title)."""
    ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

    try:
        with zipfile.ZipFile(io.BytesIO(docx_bytes)) as zf:
            xml_bytes = zf.read("word/document.xml")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Không thể đọc nội dung DOCX: {e}")

    root = etree.fromstring(xml_bytes)
    body = root.find(f"{{{ns}}}body")
    if body is None:
        raise HTTPException(status_code=400, detail="File DOCX không hợp lệ")

    html_parts = []
    first_img = ""
    title = ""

    for elem in body:
        tag = elem.tag.split("}")[-1]

        # ── Extract title from first Heading 1 ──────────────────────────
        if tag == "p":
            p_style = elem.get(f"{{{ns}}}pStyle")
            if p_style and p_style.startswith("Heading") and "1" in p_style:
                texts = elem.findall(f".//{{{ns}}}t")
                candidate = "".join(t.text or "" for t in texts).strip()
                if candidate:
                    title = candidate

            # Always process paragraphs
            para_html = _xml_para_to_html(elem, ns, image_map)
            if para_html:
                html_parts.append(para_html)
                # First image seen anywhere in content becomes cover
                imgs_in_para = re.findall(r'<img[^>]+src="([^"]+)"', para_html)
                if imgs_in_para and not first_img:
                    first_img = imgs_in_para[0]

        elif tag == "tbl":
            html_parts.append(_xml_table_to_html(elem, ns, image_map))

    html = "<div class='docx-content'>" + "".join(html_parts) + "</div>"
    return html, first_img, title


def _xml_para_to_html(para_elem, ns: str, image_map: dict[str, str]) -> str:
    """Convert a <w:p> element to HTML, including inline images via <w:drawing>."""
    texts: list[str] = []
    images_in_para: list[str] = []

    for child in para_elem.iter():
        child_tag = child.tag.split("}")[-1] if "}" in child.tag else child.tag

        if child_tag == "t" and child.text:
            texts.append(child.text)

        # Inline image via drawing
        if child_tag == "drawing":
            blip_el = child.find(".//{http://schemas.openxmlformats.org/drawingml/2006/main}blip")
            if blip_el is not None:
                embed = blip_el.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed")
                if embed:
                    images_in_para.append(f"embed:{embed}")

        # Inline image via pic (alternative image format)
        if child_tag == "pic":
            blip_el = child.find(".//{http://schemas.openxmlformats.org/drawingml/2006/main}blip")
            if blip_el is not None:
                embed = blip_el.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed")
                if embed:
                    images_in_para.append(f"embed:{embed}")

    p_style = para_elem.get(f"{{{ns}}}pStyle")
    combined_text = "".join(texts).strip()

    # Skip empty paragraphs
    if not combined_text and not images_in_para:
        return ""

    # Build HTML
    img_tags = "".join(
        f'<img src="{image_map.get(uri, uri)}" alt="docx-image" style="max-width:100%;border-radius:8px;margin:1em 0;display:block;" />'
        for uri in images_in_para
    )

    if p_style and p_style.startswith("Heading"):
        level = 1
        for lvl in [6, 5, 4, 3, 2, 1]:
            if f"Heading {lvl}" in p_style:
                level = min(lvl, 3)
                break
        return f"<h{level}>{combined_text}</h{level}>{img_tags}"

    if combined_text.startswith(("- ", "* ", "+ ")):
        return f"<ul><li>{combined_text[2:]}</li></ul>{img_tags}"
    if re.match(r"^\d+[\.\)]\s", combined_text):
        return f"<p>{combined_text}</p>{img_tags}"
    if combined_text:
        return f"<p>{combined_text}</p>{img_tags}"
    if images_in_para:
        return img_tags

    return ""


def _xml_table_to_html(tbl_elem, ns: str, image_map: dict[str, str]) -> str:
    rows = tbl_elem.findall(f"{{{ns}}}tr")
    if not rows:
        return ""
    html = "<table style='width:100%;border-collapse:collapse;margin:1em 0;'>"
    for row in rows:
        html += "<tr>"
        for cell in row.findall(f"{{{ns}}}tc"):
            cell_paras = cell.findall(f".//{{{ns}}}p")
            cell_content = "".join(_xml_para_to_html(p, ns, image_map) for p in cell_paras)
            html += f"<td style='border:1px solid #444;padding:8px;vertical-align:top;'>{cell_content}</td>"
        html += "</tr>"
    html += "</table>"
    return html


def _docx_to_html(docx_bytes: bytes) -> tuple[str, str, str]:
    """Convert docx bytes to HTML with full inline image support. Returns (html, first_image_url, title)."""
    image_map = _extract_docx_images(docx_bytes)
    return _xml_to_html(docx_bytes, image_map)


def make_slug(title: str) -> str:
    slug = title.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = slug.strip("-")
    return slug


# ── Public ──────────────────────────────────────────────────────────────────

@router.get("/blog", response_model=list[BlogPostListResponse])
def list_posts(db: Session = Depends(get_db)):
    posts = db.query(BlogPost).order_by(BlogPost.id.desc()).all()
    return [
        BlogPostListResponse(
            id=p.id,
            title=p.title,
            slug=p.slug,
            image_url=p.image_url,
            created_at=p.created_at,
        )
        for p in posts
    ]


@router.get("/blog/{slug}", response_model=BlogPostResponse)
def get_post(slug: str, db: Session = Depends(get_db)):
    post = db.query(BlogPost).filter(BlogPost.slug == slug).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return BlogPostResponse(
        id=post.id,
        title=post.title,
        slug=post.slug,
        content=post.content,
        image_url=post.image_url,
        author_name=post.author.name,
        created_at=post.created_at,
    )


# ── Admin ────────────────────────────────────────────────────────────────────

@router.post("/admin/blog", response_model=BlogPostResponse)
def create_post(
    title: str = Form(...),
    content: str = Form(...),
    image: UploadFile | None = File(default=None),
    cover_image_url: str | None = Form(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    base_slug = make_slug(title)
    slug = base_slug
    counter = 1
    while db.query(BlogPost).filter(BlogPost.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    image_url = ""
    if image and image.filename:
        image_url = save_upload(image)
    elif cover_image_url:
        image_url = cover_image_url

    post = BlogPost(
        title=title,
        slug=slug,
        content=content,
        image_url=image_url,
        author_id=current_user.id,
        created_at=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return BlogPostResponse(
        id=post.id,
        title=post.title,
        slug=post.slug,
        content=post.content,
        image_url=post.image_url,
        author_name=current_user.name,
        created_at=post.created_at,
    )


@router.put("/admin/blog/{post_id}", response_model=BlogPostResponse)
def update_post(
    post_id: int,
    title: str = Form(...),
    content: str = Form(...),
    image: UploadFile | None = File(default=None),
    cover_image_url: str | None = Form(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    post = db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.title = title
    post.content = content

    if image and image.filename:
        post.image_url = save_upload(image)
    elif cover_image_url:
        post.image_url = cover_image_url

    db.commit()
    db.refresh(post)
    return BlogPostResponse(
        id=post.id,
        title=post.title,
        slug=post.slug,
        content=post.content,
        image_url=post.image_url,
        author_name=post.author.name,
        created_at=post.created_at,
    )


@router.delete("/admin/blog/{post_id}")
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    post = db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(post)
    db.commit()
    return {"ok": True}


# ── Blog content image upload ─────────────────────────────────────────────────

@router.post("/admin/blog/image")
def upload_blog_image(
    image: UploadFile = File(...),
    _: User = Depends(require_admin),
):
    """Upload an image embedded in a blog post and return its URL."""
    return {"url": save_upload(image)}


# ── DOCX import ──────────────────────────────────────────────────────────────

@router.post("/admin/blog/import")
async def import_blog_docx(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Parse a .docx file, extract images and formatting, return HTML and cover image."""
    if not (file.filename or "").lower().endswith(".docx"):
        raise HTTPException(status_code=400, detail="File must be a .docx document")

    docx_bytes = await file.read()
    if len(docx_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File must be under 20 MB")

    html, first_img, title = _docx_to_html(docx_bytes)
    return {"html": html, "cover_image_url": first_img, "title": title}
