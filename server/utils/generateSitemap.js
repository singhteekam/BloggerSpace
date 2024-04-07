// generateSitemap.js
const { SitemapStream, streamToPromise } = require('sitemap');
const fs = require('fs').promises; // Import the 'fs' module for file operations
const path = require('path');
const Blog = require('../models/Blog');
const {fetchSitemapFile, uploadSitemapToGitHub}= require('./../utils/uploadToGitHub');
const axios = require("axios");

async function generateSitemap() {
  const Links=[
    "https://bloggerspace.singhteekam.in/login",
    "https://bloggerspace.singhteekam.in/signup",
    "https://bloggerspace.singhteekam.in/sitemap",
    "https://bloggerspace.singhteekam.in/guidelines",
    "https://bloggerspace.singhteekam.in/aboutdeveloper",
    "https://bloggerspace.singhteekam.in/forgotpassword"
  ];

  try {
    const blogs = await Blog.find({ status: "PUBLISHED" }); // Fetch your published blogs from the database

    console.log("Saving sitemap...")

    const sitemapStream = new SitemapStream({ hostname: process.env.BLOGGERSPACE1 });  // link

    sitemapStream.write({
      url: process.env.BLOGGERSPACE1, // Adjust the URL based on your blog URL structure
      // changefreq: 'weekly',
      // lastmod:1,
      priority: 1.00,
    });
    Links.forEach((link)=>{
      sitemapStream.write({url: link, priority: 0.80,});
    });

    // console.log("Sitemap file content starts:");
    blogs.forEach((blog) => {
      sitemapStream.write({
        url: `/${blog.slug}`, // Adjust the URL based on your blog URL structure
        // changefreq: 'weekly',
        priority: 0.80,
      });
    });
    // console.log("Sitemap content end");

    sitemapStream.end();
    const sitemapXML = await streamToPromise(sitemapStream);

    // Save the sitemap to the root of the project
    const sitemapFilePath = path.join(__dirname, '../../', 'sitemap.xml');
    await fs.writeFile(sitemapFilePath, sitemapXML, 'utf-8');

    await uploadSitemapToGitHub();

    console.log('Sitemap saved to:', sitemapFilePath);
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }
}

// async function generateSitemap2(){
//   const apiUrl4 = await axios.get(`https://api.github.com/repos/${process.env.GITHUBOWNER}/${process.env.GITHUBREPO}/contents/sitemap.xml`);
//   console.log(apiUrl4.data.name);
  // const sitemapPath= 'sitemap.xml';
  // fs.readFile(sitemapPath,'utf8', (err, data)=>{
  //   if(err){
  //     console.log("Error");
  //     return;
  //   }
  //   const newRecord= `<url><loc>new1</loc></url>`;
  //   const updateSitemap= data.replace('</urlset>', `${newRecord}</urlset>`);
  //   fs.writeFile(sitemapPath, updateSitemap, 'utf8', (err)=>{
  //     if(err){
  //       console.log("Error...");
  //       return;
  //     }
  //     console.log("updated sitemap done...");
  //   })
  // })
// }

module.exports = generateSitemap;
