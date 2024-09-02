import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { FaEye, FaHeart } from 'react-icons/fa';
import { Link, Navigate } from 'react-router-dom';
import { BsBoxArrowUpRight } from "react-icons/bs";

const ViewBlogRightSection = () => {

    const [mostViewed, setMostViewed]= useState(null);

    const mostViewedBlogs = async ()=>{
        try {
            const response= await axios.get("/api/blogs/mostviewedblogs");
            setMostViewed(response.data);
        } catch (error) {
            console.log("Error fetching most viewed blogs: ", error);
        }
    }
    
    useEffect(()=>{
        mostViewedBlogs();
    },[]);

  return (
    <div>
        <h4 className='page-title'>Most Viewed Blogs:</h4>
        <div className='view-blog-most-viewed'>
            <ul>
                {mostViewed && mostViewed.map((blog)=>(
                    <li key={blog}>
                        <Link to={`/${blog.slug}`} target='_blank'>{blog.title} <BsBoxArrowUpRight /></Link> <br />
                        <FaEye className="color-teal-green" /> <span className="color-teal-green">{blog.blogViews}{"  "}</span>
                        {/* <FaHeart className="color-teal-green" /> <span className="color-teal-green">{blog.blogLikes.length}</span> */}
                    </li>
                ))}
            </ul>
        </div>
    </div>
  )
}

export default ViewBlogRightSection
