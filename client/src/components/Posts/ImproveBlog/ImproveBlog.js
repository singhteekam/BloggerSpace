import React, { useState, useEffect } from 'react'
import { useParams, Link } from "react-router-dom";
import { Helmet } from 'react-helmet'

const ImproveBlog = () => {
    const { id } = useParams();
    
    useEffect(()=>{

    }, []);

  return (
    <>
      <Helmet>
        <title>Improve Blog</title>
      </Helmet>
      <div className='improveblog-page'>

      </div>
    </>
  )
}

export default ImproveBlog
