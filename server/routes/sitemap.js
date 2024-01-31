// sitemap.js
const express = require('express');
const router = express.Router();
const generateSitemap = require('../utils/generateSitemap');

router.get('/sitemap.xml', async (req, res) => {
    try {
    await generateSitemap();

    // You may choose to serve the generated sitemap.xml directly in the response
    // or you can save it to a file and then send the file as a response

    console.log("Sitemap file updated at: "+ new Date(new Date().getTime()));

    res.header('Content-Type', 'application/xml');
    res.sendFile('/opt/render/project/src/sitemap.xml');
    // res.sendFile('D:/MERN Projects/BlogWebsite/MyBlogWebsite/sitemap.xml');
  } catch (error) {
    console.error('Error serving sitemap:', error);
    res.status(500).send('Internal Server Error');
  }
});


module.exports = router;
