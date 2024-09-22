// generateSitemap.js
const { SitemapStream, streamToPromise } = require("sitemap");
const fs = require("fs").promises; // Import the 'fs' module for file operations
const path = require("path");
const Blog = require("../models/Blog");
const {
  fetchSitemapFile,
  uploadSitemapToGitHub,
} = require("./../utils/uploadToGitHub");
const axios = require("axios");
const Community = require("../models/Community");

async function generateSitemap() {
  const Links = [
    "https://bloggerspace.singhteekam.in/blogs",
    "https://bloggerspace.singhteekam.in/login",
    "https://bloggerspace.singhteekam.in/signup",
    "https://bloggerspace.singhteekam.in/community",
    "https://bloggerspace.singhteekam.in/guidelines",
    "https://bloggerspace.singhteekam.in/adminblogs",
    "https://bloggerspace.singhteekam.in/aboutdeveloper",
    "https://bloggerspace.singhteekam.in/forgotpassword",
    "https://bloggerspace.singhteekam.in/sitemap",
  ];

  try {
    const blogs = await Blog.find({
      status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] },
    }); // Fetch your published blogs from the database

    console.log("Saving sitemap...");

    const sitemapStream = new SitemapStream({
      hostname: process.env.BLOGGERSPACE1,
    }); // link

    sitemapStream.write({
      url: process.env.BLOGGERSPACE1, // Adjust the URL based on your blog URL structure
      // changefreq: 'weekly',
      // lastmod:1,
      priority: 1.0,
    });
    Links.forEach((link) => {
      sitemapStream.write({ url: link, priority: 0.8 });
    });

    // console.log("Sitemap file content starts:");
    blogs.forEach((blog) => {
      sitemapStream.write({
        url: `/${blog.slug}`, // Adjust the URL based on your blog URL structure
        // changefreq: 'weekly',
        priority: 0.8,
      });
    });
    // console.log("Sitemap content end");

    // For community posts:
    const communityPosts = await Community.find({
      communityPostStatus: "PUBLISHED",
    });
    communityPosts.forEach((post) => {
      sitemapStream.write({
        url: `/community/post/${post.communityPostId}/${post.communityPostSlug}`,
        priority: 0.8,
      });
    });

    sitemapStream.end();
    const sitemapXML = await streamToPromise(sitemapStream);

    // Save the sitemap to the root of the project
    // const sitemapFilePath = path.join(__dirname, '../../', 'sitemap.xml');
    const sitemapFilePath = path.join("/tmp", "sitemap.xml"); // Firebase Production
    await fs.writeFile(sitemapFilePath, sitemapXML, "utf-8");

    await uploadSitemapToGitHub();

    console.log("Sitemap saved to:", sitemapFilePath);
  } catch (error) {
    console.error("Error generating sitemap:", error);
  }
}

// Update the sitemap when new new blog/community postt is published
async function generateSitemap2() {
  const accessToken = process.env.GITHUBACCESSTOKEN;
  const apiUrl3 = `https://raw.githubusercontent.com/${process.env.GITHUBOWNER}/${process.env.GITHUBREPO}/main/sitemap.xml`;

  const response = await axios.get(apiUrl3, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  console.log(response.data);
  const sitemapData = response.data;
  const newRecord = `
    <url>
        <loc>new${Math.floor(Math.random() * 100)}</loc>
        <priority>0.8</priority>
    </url>`;
  const updateSitemap = sitemapData.replace(
    "</urlset>",
    `${newRecord}
</urlset>`
  );
  // Save the sitemap to the root of the project
  const sitemapFilePath = path.join(__dirname, "../../", "sitemap.xml");
  await fs.writeFile(sitemapFilePath, updateSitemap, "utf-8");
  await uploadSitemapToGitHub();

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
}

module.exports = generateSitemap;
