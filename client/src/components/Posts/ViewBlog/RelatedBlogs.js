import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { FaEye, FaHeart } from 'react-icons/fa';
import { Link, Navigate } from 'react-router-dom';
import { BsBoxArrowUpRight } from "react-icons/bs";
import PreLoader from 'utils/PreLoader';

const RelatedBlogs = (props) => {

    const [relatedBlogs, setRelatedBlogs]= useState(null);

    const fetchRelatedBlogs = async ()=>{
        try {
            const response= await axios.get(`/api/blogs/relatedblogs/${props.blogId}`);
            setRelatedBlogs(response.data);
        } catch (error) {
            console.log("Error fetching related blogs: ", error);
        }
    }
    
    useEffect(()=>{
        fetchRelatedBlogs();
    },[props.blogId]);

  return (
    <div>
        <h5 className='color-teal-green' >Related Blogs:</h5>
        <div className='view-blog-most-viewed'>
            {relatedBlogs===null? <PreLoader isLoading={true} />:
                <ul>
                {relatedBlogs && relatedBlogs.map((blog)=>(
                    <li key={blog.blogId}>
                        <Link to={`/${blog.slug}`} >{blog.title} <BsBoxArrowUpRight /></Link> <br />
                        <FaEye className="color-teal-green" /> <span className="color-teal-green">{blog.blogViews}{"  "}</span>
                        {/* <FaHeart className="color-teal-green" /> <span className="color-teal-green">{blog.blogLikes.length}</span> */}
                    </li>
                ))}
            </ul>
            }
            
        </div>
    </div>
  )
}

export default RelatedBlogs;
