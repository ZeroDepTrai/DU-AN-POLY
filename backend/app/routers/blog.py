import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
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


def make_slug(title: str) -> str:
    slug = title.lower().strip()
    import re
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
