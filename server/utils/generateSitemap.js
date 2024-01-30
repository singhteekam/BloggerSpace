// generateSitemap.js
const { SitemapStream, streamToPromise } = require('sitemap');
const fs = require('fs').promises; // Import the 'fs' module for file operations
const path = require('path');
const Blog = require('../models/Blog');

async function generateSitemap() {
  try {
    const blogs = await Blog.find({ status: "PUBLISHED" }); // Fetch your published blogs from the database

    console.log("Saving sitemap...")

    const sitemapStream = new SitemapStream({ hostname: 'https://bloggerspace.singhteekam.in' });

    // console.log("Sitemap file content starts:");
    blogs.forEach((blog) => {
      sitemapStream.write({
        url: `/${blog.slug}`, // Adjust the URL based on your blog URL structure
        // changefreq: 'weekly',
        // priority: 0.8,
      });
      // console.log( `https://bloggerspace.singhteekam.in/${blog.slug}`);
    });
    // console.log("Sitemap content end");

    sitemapStream.end();
    const sitemapXML = await streamToPromise(sitemapStream);

    // Save the sitemap to the root of the project
    const sitemapFilePath = path.join(__dirname, '../../', 'sitemap.xml');
    // const sitemapFilePath = path.join(__dirname,'sitemap.xml');
    await fs.writeFile(sitemapFilePath, sitemapXML, 'utf-8');

    console.log('Sitemap saved to:', sitemapFilePath);
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }
}

module.exports = generateSitemap;