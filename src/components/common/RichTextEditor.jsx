import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";

export default function RichTextEditor({ value, onChange }) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkBox, setShowLinkBox] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
          class: "text-[#FF008C] underline font-semibold",
        },
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-36 px-4 py-3 text-sm leading-7 outline-none prose prose-sm max-w-none",
      },
    },
  });

  if (!editor) return null;

  const buttonClass = (active = false) =>
    `px-3 py-1.5 rounded-lg border text-sm font-semibold transition ${
      active
        ? "bg-[var(--ann-pink)] text-white border-[var(--ann-pink)]"
        : "bg-white text-gray-700 border-gray-300 hover:border-[var(--ann-pink)] hover:text-[var(--ann-pink)]"
    }`;

  const applyLink = () => {
    if (!linkUrl.trim()) return;

    let finalUrl = linkUrl.trim();

    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = `https://${finalUrl}`;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: finalUrl })
      .run();

    setLinkUrl("");
    setShowLinkBox(false);
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
    setLinkUrl("");
    setShowLinkBox(false);
  };

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden bg-white">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 bg-gray-50 p-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={buttonClass(editor.isActive("bold"))}
        >
          B
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${buttonClass(editor.isActive("italic"))} italic`}
        >
          I
        </button>

        <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={buttonClass(editor.isActive("underline"))}
            >
            U
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={buttonClass(editor.isActive("bulletList"))}
        >
          • List
        </button>

        <button
          type="button"
          onClick={() => {
            setShowLinkBox((prev) => !prev);
            const previousUrl = editor.getAttributes("link").href;
            setLinkUrl(previousUrl || "");
          }}
          className={buttonClass(editor.isActive("link"))}
        >
          Link
        </button>

        <button
          type="button"
          onClick={removeLink}
          className={buttonClass(false)}
        >
          Unlink
        </button>
      </div>

      {showLinkBox && (
        <div className="border-b border-gray-200 bg-pink-50/40 p-3">
          <label className="block text-xs font-semibold text-gray-600 mb-2">
            Link URL
          </label>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[var(--ann-pink)]"
            />

            <button
              type="button"
              onClick={applyLink}
              className="bg-[var(--ann-pink)] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90"
            >
              Apply Link
            </button>
          </div>
        </div>
      )}

      <EditorContent editor={editor} />

      <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
        Tip: select text first, then click Link.
      </div>
    </div>
  );
}