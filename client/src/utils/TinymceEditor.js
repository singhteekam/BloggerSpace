import React, {useRef} from 'react'
import { Editor } from '@tinymce/tinymce-react';

const TinymceEditor = ({ content, onContentChange, initialValue="<i>Write your content here</i>" }) => {

  // const editorRef = useRef(null);
  // const log = () => {
  //   if (editorRef.current) {
  //     console.log(editorRef.current.getContent());
  //   }
  // };

  return (
    <div>
      <Editor
        value={content}
        onEditorChange={onContentChange}
        tinymceScriptSrc={process.env.PUBLIC_URL + '/tinymce/tinymce.min.js'}
        // onInit={(evt, editor) => editorRef.current = editor}
        initialValue={initialValue}
        init={{
          height: 300,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'preview', 'wordcount', 'codesample', 'emoticons', 'autosave',
          ],
          toolbar: 'undo redo | blocks | cut copy paste |' +
            'bold italic forecolor | codesample | link | image | media | table | emoticons | searchreplace | anchor | ' +
            'alignleft aligncenter | alignright alignjustify | bullist numlist outdent indent |' +
            'insertdatetime | charmap | restoredraft | visualblocks | removeformat | preview | code | fullscreen',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
          license_key: 'gpl',
        }}
      />
    </div>
  )
}

export default TinymceEditor;
