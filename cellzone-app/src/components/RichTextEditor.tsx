import { useEffect, useRef } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const execCommand = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    onChange(editorRef.current?.innerHTML ?? "");
  };

  const handleInput = () => {
    onChange(editorRef.current?.innerHTML ?? "");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertText", false, "    ");
    }
  };

  return (
    <div className="rounded-lg border border-white/10 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-white/5 border-b border-white/10">
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand("bold"); }}
          className="w-8 h-8 rounded text-sm font-bold text-[#8b8b9a] hover:bg-white/10 hover:text-[#f0f0f5] transition-colors"
          title="In đậm"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand("italic"); }}
          className="w-8 h-8 rounded text-sm italic text-[#8b8b9a] hover:bg-white/10 hover:text-[#f0f0f5] transition-colors"
          title="In nghiêng"
        >
          I
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand("underline"); }}
          className="w-8 h-8 rounded text-sm underline text-[#8b8b9a] hover:bg-white/10 hover:text-[#f0f0f5] transition-colors"
          title="Gạch chân"
        >
          U
        </button>

        <div className="w-px h-6 bg-white/10 self-center mx-1" />

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand("insertUnorderedList"); }}
          className="w-8 h-8 rounded text-sm text-[#8b8b9a] hover:bg-white/10 hover:text-[#f0f0f5] transition-colors"
          title="Danh sách"
        >
          •
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand("insertOrderedList"); }}
          className="w-8 h-8 rounded text-sm text-[#8b8b9a] hover:bg-white/10 hover:text-[#f0f0f5] transition-colors"
          title="Danh sách số"
        >
          1.
        </button>

        <div className="w-px h-6 bg-white/10 self-center mx-1" />

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand("formatBlock", "h2"); }}
          className="w-8 h-8 rounded text-xs font-bold text-[#8b8b9a] hover:bg-white/10 hover:text-[#f0f0f5] transition-colors"
          title="Tiêu đề 2"
        >
          H2
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand("formatBlock", "h3"); }}
          className="w-8 h-8 rounded text-xs font-bold text-[#8b8b9a] hover:bg-white/10 hover:text-[#f0f0f5] transition-colors"
          title="Tiêu đề 3"
        >
          H3
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand("formatBlock", "p"); }}
          className="w-8 h-8 rounded text-xs text-[#8b8b9a] hover:bg-white/10 hover:text-[#f0f0f5] transition-colors"
          title="Đoạn văn"
        >
          P
        </button>
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className="min-h-[200px] p-4 text-sm text-[#f0f0f5] bg-[#0a0a12] outline-none prose prose-invert prose-sm max-w-none
          [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[#f0f0f5] [&_h2]:mt-4 [&_h2]:mb-2
          [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[#f0f0f5] [&_h3]:mt-3 [&_h3]:mb-1
          [&_p]:my-2 [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5
          [&_li]:my-1
          [&_strong]:font-bold [&_em]:italic [&_u]:underline
          [&_img]:max-w-full [&_img]:rounded-lg
          [&_a]:text-indigo-400 [&_a]:underline
          empty:before:content-[attr(data-placeholder)] empty:before:text-[#5a5a6a] empty:before:pointer-events-none"
      />
    </div>
  );
}
