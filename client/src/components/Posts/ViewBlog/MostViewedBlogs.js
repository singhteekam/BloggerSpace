import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { FaEye, FaHeart } from 'react-icons/fa';
import { Link, Navigate } from 'react-router-dom';
import { BsBoxArrowUpRight } from "react-icons/bs";
import PreLoader from 'utils/PreLoader';

const MostViewedBlogs = () => {

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
        <h5 className='color-teal-green' >Most Viewed Blogs:</h5>
        <div className='view-blog-most-viewed'>
            {mostViewed===null? <PreLoader isLoading={true} />:
                <ul>
                {mostViewed && mostViewed.map((blog)=>(
                    <li key={blog}>
                        <Link to={`/${blog.slug}`} target='_blank'>{blog.title} <BsBoxArrowUpRight /></Link> <br />
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

export default MostViewedBlogs
