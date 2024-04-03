import React, {useRef, useState } from 'react';
import { Helmet } from "react-helmet";
import './Community.css';
import 'tinymce/skins/content/default/content.css';
import 'tinymce/skins/ui/oxide/skin.min.css';
import 'tinymce/skins/ui/oxide/content.min.css'; // Main content styles
import 'tinymce/skins/ui/oxide/content.inline.min.css'; // Inline content styles
import 'tinymce/skins/ui/oxide/skin.shadowdom.min.css';

import TinymceEditor from './../../utils/TinymceEditor';
import {
    Form,
  } from "react-bootstrap";

const Community = () => {


  const [topic, setTopic]= useState("");
  const [content, setContent]= useState("");

  return (
    <div>
      <Helmet>
        <title>Login - BloggerSpace</title>
        
      </Helmet>

      <div className='community-page'>
        <h4>Community Page</h4>

        <Form>
            <Form.Group controlId="topic" className="topicfield">
                <Form.Label><b>Title:</b> </Form.Label>
                <Form.Control
                type="text"
                value={topic}
                onChange={(e) => {
                    setTopic(e.target.value);
                }}
                placeholder="Enter topic"
                />
            </Form.Group>
        </Form> <br />

        <b>Content:</b>
        {/* <TinymceEditor content={content} onContentChange={(e)=>setContent(e.target.value)} /> */}
        <TinymceEditor content={content} onContentChange={setContent} />

        <h5>View Content:</h5>
        <div dangerouslySetInnerHTML={{ __html: content }} />
        
      </div>
    </div>
  )
}

export default Community
