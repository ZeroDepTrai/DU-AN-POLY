import { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent, NodeViewWrapper } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageResize from "tiptap-extension-resize-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { adminApi } from "../api/client";

// ── YouTube Extension ───────────────────────────────────────────────────────────
const YouTube = Node.create({
  name: "youtube",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: null },
      width: { default: "100%" },
      height: { default: "400" },
    };
  },

  parseHTML() {
    return [{ tag: "iframe[src*='youtube.com'], iframe[src*='youtu.be']" }];
  },

  renderHTML({ HTMLAttributes }) {
    const src = HTMLAttributes.src as string;
    return [
      "div",
      { class: "video-wrapper" },
      [
        "iframe",
        mergeAttributes(HTMLAttributes, {
          src: src,
          frameborder: "0",
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
          allowfullscreen: "",
          loading: "lazy",
        }),
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(
      ({ node }) => (
        <NodeViewWrapper>
          <div className="video-wrapper" style={{ margin: "1.5em 0" }}>
            <iframe
              src={node.attrs.src}
              title={node.attrs.title || "Video"}
              width={node.attrs.width}
              height={node.attrs.height}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              style={{ width: "100%", borderRadius: "12px", display: "block" }}
            />
          </div>
        </NodeViewWrapper>
      ),
    );
  },
});

// ── LocalVideo Extension ───────────────────────────────────────────────────────
const LocalVideo = Node.create({
  name: "localVideo",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      poster: { default: null },
      width: { default: "100%" },
      height: { default: "auto" },
    };
  },

  parseHTML() {
    return [{ tag: "video[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { class: "video-wrapper" },
      ["video", mergeAttributes(HTMLAttributes, { controls: "", style: "width:100%;border-radius:12px;display:block;margin:1.5em 0;" })],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(
      ({ node }) => (
        <NodeViewWrapper>
          <div className="video-wrapper" style={{ margin: "1.5em 0" }}>
            <video
              src={node.attrs.src}
              poster={node.attrs.poster}
              controls
              style={{ width: "100%", borderRadius: "12px", display: "block" }}
            />
          </div>
        </NodeViewWrapper>
      ),
    );
  },
});

// ── Video Insert Modal ────────────────────────────────────────────────────────
interface VideoModalProps {
  onInsert: (embedUrl: string) => void;
  onUpload: (file: File) => Promise<string>;
  onClose: () => void;
}

function VideoModal({ onInsert, onUpload, onClose }: VideoModalProps) {
  const [tab, setTab] = useState<"youtube" | "upload">("youtube");
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  };

  const handleEmbed = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUrlError("Vui lòng nhập URL YouTube hoặc Vimeo.");
      return;
    }
    const ytId = extractYouTubeId(trimmed);
    if (ytId) {
      onInsert(`https://www.youtube.com/embed/${ytId}`);
      return;
    }
    if (trimmed.includes("vimeo.com")) {
      const m = trimmed.match(/vimeo\.com\/(\d+)/);
      if (m) {
        onInsert(`https://player.vimeo.com/video/${m[1]}`);
        return;
      }
    }
    setUrlError("URL không hỗ trợ. Chỉ hỗ trợ YouTube và Vimeo.");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const url = await onUpload(file);
      onInsert(url);
    } catch {
      setUploadError("Tải video thất bại. Dung lượng tối đa 100MB.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-gunmetal/60 bg-graphite p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-warmwhite">Chèn Video</h3>
          <button onClick={onClose} className="text-steelgray hover:text-warmwhite transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-1 rounded-xl bg-charcoal p-1 border border-gunmetal/40 w-fit">
          <button
            onClick={() => setTab("youtube")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === "youtube" ? "bg-crimson text-white" : "text-steelgray hover:text-warmwhite"
            }`}
          >
            YouTube / Vimeo
          </button>
          <button
            onClick={() => setTab("upload")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === "upload" ? "bg-crimson text-white" : "text-steelgray hover:text-warmwhite"
            }`}
          >
            Tải video lên
          </button>
        </div>

        {/* YouTube / Vimeo tab */}
        {tab === "youtube" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-steelgray">URL video</label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => { setUrlInput(e.target.value); setUrlError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleEmbed(); }}
                placeholder="https://www.youtube.com/watch?v=... hoặc https://vimeo.com/..."
                className="input-field w-full"
                autoFocus
              />
              {urlError && <p className="mt-1.5 text-sm text-rose">{urlError}</p>}
            </div>
            {urlInput && (
              <div className="rounded-lg border border-gunmetal/40 bg-charcoal p-3">
                <p className="mb-2 text-xs text-steelgray">Xem trước:</p>
                <iframe
                  src={extractYouTubeId(urlInput) ? `https://www.youtube.com/embed/${extractYouTubeId(urlInput)}` : undefined}
                  title="preview"
                  className="h-40 w-full rounded-lg"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            )}
            <button onClick={handleEmbed} className="btn-primary w-full">
              Nhúng video
            </button>
          </div>
        )}

        {/* Upload tab */}
        {tab === "upload" && (
          <div className="space-y-4">
            <div
              onClick={() => !uploading && fileRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
                uploading
                  ? "border-gunmetal/40 bg-charcoal/50 cursor-not-allowed"
                  : "border-gunmetal/60 hover:border-silvergray bg-charcoal/40"
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
              {uploading ? (
                <>
                  <svg className="h-10 w-10 animate-pulse text-crimson mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.9L15 14M3 6a3 3 0 013-3h10a3 3 0 013 3v8a3 3 0 01-3 3H6a3 3 0 01-3-3V6z" />
                  </svg>
                  <p className="text-sm text-steelgray">Đang tải lên...</p>
                  <p className="mt-1 text-xs text-steelgray/60">(MP4, WebM, MOV — tối đa 100MB)</p>
                </>
              ) : (
                <>
                  <svg className="h-10 w-10 text-steelgray mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.9L15 14M3 6a3 3 0 013-3h10a3 3 0 013 3v8a3 3 0 01-3 3H6a3 3 0 01-3-3V6z" />
                  </svg>
                  <p className="text-sm text-warmwhite font-medium">Nhấn để chọn video</p>
                  <p className="mt-1 text-xs text-steelgray">MP4, WebM, MOV — tối đa 100MB</p>
                </>
              )}
            </div>
            {uploadError && <p className="text-sm text-rose text-center">{uploadError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── RichTextEditor ─────────────────────────────────────────────────────────────
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Nhập nội dung bài viết...",
}: RichTextEditorProps) {
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageResize.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: { class: "blog-img" },
      }),
      Placeholder.configure({ placeholder }),
      YouTube,
      LocalVideo,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none min-h-[300px] px-4 py-3 focus:outline-none text-warmwhite text-sm leading-relaxed",
      },
    },
  });

  editorRef.current = editor;

  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    if (ed.getHTML() !== value) {
      ed.commands.setContent(value, false);
    }
  }, [value]);

  const handleImageUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !editor) return;
      setUploadingImage(true);
      try {
        const { data } = await adminApi.uploadMedia(file);
        editor.chain().focus().setImage({ src: data.url }).run();
      } catch {
        alert("Tải ảnh lên thất bại.");
      } finally {
        setUploadingImage(false);
      }
    };
    input.click();
  }, [editor]);

  const handleVideoInsert = useCallback(
    (embedUrl: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent({
        type: "youtube",
        attrs: { src: embedUrl, title: "Video" },
      }).run();
      setShowVideoModal(false);
    },
    [editor],
  );

  const handleVideoUpload = useCallback(async (file: File): Promise<string> => {
    const { data } = await adminApi.uploadMedia(file);
    return data.url;
  }, []);

  if (!editor) return null;

  return (
    <>
      <div className="rounded-xl border border-gunmetal/60 bg-charcoal overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 border-b border-gunmetal/60 bg-graphite px-2 py-2">
          {/* Bold */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Đậm (B)"
          >
            <span className="font-bold text-sm">B</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Nghiêng (I)"
          >
            <span className="italic text-sm">I</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            title="Gạch ngang"
          >
            <span className="line-through text-sm">S</span>
          </ToolbarButton>

          <ToolbarDivider />

          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="Tiêu đề 2 (H2)"
          >
            <span className="text-sm font-bold">H2</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="Tiêu đề 3 (H3)"
          >
            <span className="text-sm font-bold">H3</span>
          </ToolbarButton>

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Danh sách"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Danh sách số"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 20h14M7 12h14M7 4h14M3 20h.01M3 12h.01M3 4h.01" />
            </svg>
          </ToolbarButton>

          <ToolbarDivider />

          {/* Quote */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="Trích dẫn"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </ToolbarButton>

          {/* Code */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive("codeBlock")}
            title="Mã nguồn"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </ToolbarButton>

          <ToolbarDivider />

          {/* Images */}
          <ToolbarButton onClick={handleImageUpload} title="Chèn ảnh" disabled={uploadingImage}>
            {uploadingImage ? (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </ToolbarButton>

          {/* Video */}
          <ToolbarButton
            onClick={() => setShowVideoModal(true)}
            title="Chèn video (YouTube, Vimeo, hoặc tệp)"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.9L15 14M3 6a3 3 0 013-3h10a3 3 0 013 3v8a3 3 0 01-3 3H6a3 3 0 01-3-3V6z" />
            </svg>
          </ToolbarButton>

          <ToolbarDivider />

          {/* Undo/Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Hoàn tác"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Làm lại"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </ToolbarButton>
        </div>

        {/* Editor content */}
        <EditorContent editor={editor} />

        {/* Styles */}
        <style>{`
          .tiptap p { margin: 0.75em 0; }
          .tiptap h2 { font-size: 1.25rem; font-weight: 700; color: #EEE7E8; margin: 1em 0 0.5em; }
          .tiptap h3 { font-size: 1.1rem; font-weight: 600; color: #EEE7E8; margin: 1em 0 0.5em; }
          .tiptap ul { list-style-type: disc; padding-left: 1.5em; margin: 0.75em 0; }
          .tiptap ol { list-style-type: decimal; padding-left: 1.5em; margin: 0.75em 0; }
          .tiptap li { margin: 0.25em 0; }
          .tiptap blockquote {
            border-left: 3px solid #D94A63;
            padding-left: 1em;
            color: #C9C4C6;
            margin: 1em 0;
            font-style: italic;
          }
          .tiptap code {
            background: #353039;
            padding: 0.15em 0.4em;
            border-radius: 4px;
            font-size: 0.875em;
            font-family: monospace;
          }
          .tiptap pre {
            background: #353039;
            padding: 1em;
            border-radius: 8px;
            overflow-x: auto;
            margin: 1em 0;
          }
          .tiptap pre code { background: none; padding: 0; }
          .tiptap img.blog-img {
            max-width: 100%;
            border-radius: 8px;
            margin: 1em auto;
            display: block;
          }
          .tiptap .image-resizer {
            display: block;
            border-radius: 8px;
            margin: 1em auto;
          }
          .tiptap p.is-editor-empty:first-child::before {
            color: #8A858A;
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
          }
          .ProseMirror { min-height: 300px; }
          .video-wrapper iframe,
          .video-wrapper video {
            width: 100%;
            border-radius: 12px;
            display: block;
          }
        `}</style>
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <VideoModal
          onInsert={handleVideoInsert}
          onUpload={handleVideoUpload}
          onClose={() => setShowVideoModal(false)}
        />
      )}
    </>
  );
}

// ── Toolbar primitives ────────────────────────────────────────────────────────
function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors ${
        active
          ? "bg-crimson/20 text-crimson"
          : disabled
          ? "text-gunmetal cursor-not-allowed"
          : "text-steelgray hover:bg-gunmetal/60 hover:text-warmwhite"
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-6 w-px bg-gunmetal/60" />;
}
