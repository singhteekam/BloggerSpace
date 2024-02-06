// sitemap.js
const express = require('express');
const router = express.Router();
const path = require('path');
const generateSitemap = require('../utils/generateSitemap');
const {fetchSitemapFile}= require('./../utils/uploadToGitHub');

router.get('/sitemap.xml', async (req, res) => {
    try {
    // await generateSitemap();

    // You may choose to serve the generated sitemap.xml directly in the response
    // or you can save it to a file and then send the file as a response

    // console.log("Sitemap file updated at: "+ new Date(new Date().getTime()));

    // res.header('Content-Type', 'application/xml');
    // res.sendFile('/opt/render/project/src/sitemap.xml');
    // res.sendFile(path.join(__dirname, '../../', 'sitemap.xml'));
    const sitemapContent = await fetchSitemapFile();

    // Send the sitemap content in the response
    res.header('Content-Type', 'application/xml');
    // console.log("Displayingg.....")
    res.send(sitemapContent);
  } catch (error) {
    console.error('Error serving sitemap:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get("/updatesitemap", async (req, res)=>{
  try {
    await generateSitemap();
    res.send("Sitemap file is updated at: "+ new Date(new Date().getTime()));
  } catch (error) {
    console.error('Error updating sitemap:', error);
    res.status(500).send('Error updating sitemap file');
  }
});


module.exports = router;
