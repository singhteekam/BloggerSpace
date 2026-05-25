const axios = require("axios");

const owner = process.env.GITHUBOWNER;
const repo  = process.env.GITHUBREPO;
const branch = process.env.GITHUBBRANCH;
const accessToken = process.env.GITHUBACCESSTOKEN;

/**
 * Upload an image buffer to GitHub and return the raw CDN URL.
 * @param {Buffer} buffer  - raw image bytes
 * @param {string} filePath - path inside the repo, e.g. "profile-pictures/userId.jpg"
 * @returns {Promise<string>} raw CDN URL
 */
async function uploadImageToGitHub(buffer, filePath) {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
  const content = buffer.toString("base64");

  let sha;
  try {
    const existing = await axios.get(apiUrl, { headers });
    sha = existing.data.sha;
  } catch (err) {
    if (err.response?.status !== 404) throw err;
  }

  await axios.put(
    apiUrl,
    { message: `Upload profile picture: ${filePath}`, content, branch, ...(sha ? { sha } : {}) },
    { headers },
  );

  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
}

module.exports = { uploadImageToGitHub };
