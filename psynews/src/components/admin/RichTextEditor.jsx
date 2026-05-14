import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import CharacterCount from "@tiptap/extension-character-count";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { useCallback, useRef } from "react";
import { uploadArticleImage } from "../../lib/storage";
import "./RichTextEditor.css";

const lowlight = createLowlight(common);

export default function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [2, 3, 4] },
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } }),
      Image.configure({ HTMLAttributes: { class: "article-body-img" } }),
      CodeBlockLowlight.configure({ lowlight }),
      CharacterCount,
      Placeholder.configure({
        placeholder: "Start writing your article… Use the toolbar above to format text, add images, code blocks, and more.",
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "rich-editor__content",
        "aria-label": "Article body editor",
        role: "textbox",
        "aria-multiline": "true",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="rich-editor">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      <div className="rich-editor__footer">
        <span className="rich-editor__count">
          {editor.storage.characterCount.words()} words &bull;{" "}
          {editor.storage.characterCount.characters()} characters
        </span>
      </div>
    </div>
  );
}

/* ── Toolbar ──────────────────────────────────────────────────── */
function Toolbar({ editor }) {
  const imageInputRef = useRef(null);

  const setLink = useCallback(() => {
    const prev = editor.getAttributes("link").href;
    const url  = window.prompt("URL", prev);
    if (url === null) return;
    if (url === "") { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const handleImageFile = async (file) => {
    if (!file) return;
    const { url, error } = await uploadArticleImage(file, () => {});
    if (error) { alert(`Image upload failed: ${error}`); return; }
    editor.chain().focus().setImage({ src: url, alt: file.name.replace(/\.[^.]+$/, "") }).run();
  };

  const groups = [
    {
      label: "Text style",
      buttons: [
        { icon: "B",  title: "Bold",      action: () => editor.chain().focus().toggleBold().run(),      active: () => editor.isActive("bold"),       keys: "Ctrl+B" },
        { icon: "I",  title: "Italic",    action: () => editor.chain().focus().toggleItalic().run(),    active: () => editor.isActive("italic"),     keys: "Ctrl+I" },
        { icon: "U",  title: "Underline", action: () => editor.chain().focus().toggleUnderline().run(), active: () => editor.isActive("underline"),  keys: "Ctrl+U" },
        { icon: "S",  title: "Strike",    action: () => editor.chain().focus().toggleStrike().run(),    active: () => editor.isActive("strike") },
        { icon: "✦",  title: "Highlight", action: () => editor.chain().focus().toggleHighlight().run(), active: () => editor.isActive("highlight") },
      ],
    },
    {
      label: "Headings",
      buttons: [
        { icon: "H2", title: "Heading 2", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: () => editor.isActive("heading", { level: 2 }) },
        { icon: "H3", title: "Heading 3", action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: () => editor.isActive("heading", { level: 3 }) },
        { icon: "H4", title: "Heading 4", action: () => editor.chain().focus().toggleHeading({ level: 4 }).run(), active: () => editor.isActive("heading", { level: 4 }) },
      ],
    },
    {
      label: "Lists",
      buttons: [
        { icon: "≡",  title: "Bullet list",  action: () => editor.chain().focus().toggleBulletList().run(),  active: () => editor.isActive("bulletList") },
        { icon: "1.", title: "Ordered list", action: () => editor.chain().focus().toggleOrderedList().run(), active: () => editor.isActive("orderedList") },
      ],
    },
    {
      label: "Blocks",
      buttons: [
        { icon: "❝",  title: "Blockquote", action: () => editor.chain().focus().toggleBlockquote().run(),  active: () => editor.isActive("blockquote") },
        { icon: "</>" , title: "Code block", action: () => editor.chain().focus().toggleCodeBlock().run(),   active: () => editor.isActive("codeBlock") },
        { icon: "—",  title: "Divider",    action: () => editor.chain().focus().setHorizontalRule().run(), active: () => false },
      ],
    },
    {
      label: "Insert",
      buttons: [
        { icon: "⌘", title: "Link",  action: setLink,                              active: () => editor.isActive("link") },
        { icon: "🖼", title: "Image", action: () => imageInputRef.current?.click(), active: () => false },
      ],
    },
    {
      label: "History",
      buttons: [
        { icon: "↩", title: "Undo", action: () => editor.chain().focus().undo().run(), active: () => false, disabled: () => !editor.can().undo() },
        { icon: "↪", title: "Redo", action: () => editor.chain().focus().redo().run(), active: () => false, disabled: () => !editor.can().redo() },
      ],
    },
  ];

  return (
    <div className="rich-editor__toolbar" role="toolbar" aria-label="Text formatting">
      {groups.map((group) => (
        <div key={group.label} className="rich-editor__toolbar-group" role="group" aria-label={group.label}>
          {group.buttons.map((btn) => (
            <button
              key={btn.title}
              type="button"
              title={btn.keys ? `${btn.title} (${btn.keys})` : btn.title}
              aria-label={btn.title}
              aria-pressed={btn.active()}
              disabled={btn.disabled?.()}
              className={`rich-editor__btn ${btn.active() ? "rich-editor__btn--active" : ""}`}
              onClick={btn.action}
            >
              {btn.icon}
            </button>
          ))}
        </div>
      ))}

      {/* Hidden image input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={(e) => handleImageFile(e.target.files[0])}
        aria-hidden="true"
      />
    </div>
  );
}
