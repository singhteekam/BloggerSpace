
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Import Quill's CSS
import './QuillEditor.css'; // Import custom CSS file for styling

export const QuillEditor = ({ content, onContentChange }) => {

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, false] }],
      ["bold", "italic", "underline", "strike"],
      ["blockquote", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image", "video"],
      [{ script: "sub" }, { script: "super" }],
      [{ color: [] }, { background: [] }],
      [{ font: [] }],
      [{ align: [] }],
      [{ direction: "rtl" }],
      [{ indent: "-1" }, { indent: "+1" }],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "code-block",
    "list",
    "link",
    "image",
    "video",
    "script",
    "color",
    "background",
    "font",
    "align",
    "direction",
    "indent",
    "clean"
  ];

  return (
    <div className="quill-editor-container">
      <style>
        {`.ql-editor img {
          max-width: 100%;
          max-height: 250px; /* Adjust the desired height here */
        }
        .ql-video {
          width: 100%;
          height: 480px;
        }`}
      </style>
      <ReactQuill
        value={content}
        onChange={onContentChange}
        modules={modules}
        formats={formats}
      />
    </div>
  );
};
