// sitemap.js
const express = require('express');
const router = express.Router();
const { generateSitemapXML } = require('../utils/generateSitemap');

// Serve sitemap.xml on-the-fly — no disk writes, no GitHub dependency.
// Works correctly on Firebase Functions (ephemeral filesystem).
router.get('/sitemap.xml', async (req, res) => {
  try {
    const xml = await generateSitemapXML();
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Error serving sitemap:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Kept for backward compat — now just regenerates and returns stats.
router.get("/updatesitemap", async (req, res) => {
  try {
    const xml = await generateSitemapXML();
    const urlCount = (xml.toString().match(/<url>/g) || []).length;
    res.json({ message: `Sitemap OK — ${urlCount} URLs indexed.` });
  } catch (error) {
    console.error('Error updating sitemap:', error);
    res.status(500).json({ error: 'Error generating sitemap' });
  }
});

module.exports = router;
