// generateSitemap.js
const { SitemapStream, streamToPromise } = require("sitemap");
const Blog = require("../models/Blog");
const Community = require("../models/Community");

const SITE_URL = process.env.BLOGGERSPACE1 || "https://bloggerspace.singhteekam.in";

const STATIC_LINKS = [
  `${SITE_URL}/blogs`,
  `${SITE_URL}/login`,
  `${SITE_URL}/signup`,
  `${SITE_URL}/community`,
  `${SITE_URL}/guidelines`,
  `${SITE_URL}/adminblogs`,
  `${SITE_URL}/aboutdeveloper`,
  `${SITE_URL}/forgotpassword`,
  `${SITE_URL}/sitemap`,
];

/**
 * Builds the sitemap XML from the database and returns it as a Buffer.
 * No disk writes, no external calls — safe for Firebase Functions.
 */
async function generateSitemapXML() {
  const [blogs, communityPosts] = await Promise.all([
    Blog.find({ status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] } }).select("slug").lean(),
    Community.find({ communityPostStatus: "PUBLISHED" }).select("communityPostId communityPostSlug").lean(),
  ]);

  const sitemapStream = new SitemapStream({ hostname: SITE_URL });

  sitemapStream.write({ url: SITE_URL, priority: 1.0 });
  STATIC_LINKS.forEach((url) => sitemapStream.write({ url, priority: 0.8 }));
  blogs.forEach((blog) => sitemapStream.write({ url: `/${blog.slug}`, priority: 0.8 }));
  communityPosts.forEach((post) =>
    sitemapStream.write({
      url: `/community/post/${post.communityPostId}/${post.communityPostSlug}`,
      priority: 0.7,
    })
  );

  sitemapStream.end();
  return streamToPromise(sitemapStream);
}

/**
 * Generates XML and uploads to GitHub as a backup copy.
 * Used by the admin "Update Sitemap" action.
 * GitHub upload failure is non-fatal — the sitemap is always served dynamically.
 */
async function generateSitemap() {
  const xml = await generateSitemapXML();
  try {
    const { uploadSitemapToGitHub } = require("./uploadToGitHub");
    await uploadSitemapToGitHub(xml.toString("utf-8"));
    console.log("Sitemap uploaded to GitHub.");
  } catch (err) {
    console.warn("GitHub sitemap upload skipped:", err.message);
  }
}

module.exports = generateSitemap;
module.exports.generateSitemapXML = generateSitemapXML;
