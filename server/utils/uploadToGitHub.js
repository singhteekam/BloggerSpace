const fs = require("fs");
const axios = require("axios");
const path = require('path');

// GitHub repository details
const owner = process.env.GITHUBOWNER;
const repo = process.env.GITHUBREPO;
const branch = process.env.GITHUBBRANCH; //the branch we want to upload to

// GitHub personal access token (generate one in your GitHub account settings)
const accessToken = process.env.GITHUBACCESSTOKEN;

// The path to the file we want to upload
const filePath = path.join(__dirname, "/Logging/", "logs.log");
// const filePath = "./utils/Logging/logs.log";

// Read the file content
const fileContent = fs.readFileSync(filePath, "utf8");

const currentDate = new Date(new Date().getTime() + 330 * 60000).toISOString();
const fileName= `./LOGS/${currentDate.slice(0,7)}/logs${currentDate.slice(8,10)}.log`;

// GitHub API endpoint for creating or updating a file
const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${fileName}`;

// Configure the HTTP headers with the access token
const headers = {
  Authorization: `Bearer ${accessToken}`,
  "Content-Type": "application/json",
};

// Create or update the file on GitHub
const uploadLogsToGitHub=async ()=> {
  // Check if the file content is empty
  if (fileContent.trim() === "") {
    console.log("File content is empty. Skipping upload to GitHub.");
    return;
  }

  try {
    // Check if the file already exists by fetching its current SHA
    const response = await axios.get(apiUrl, { headers });
    const sha = response.data.sha;

    const existingContent = Buffer.from(response.data.content, 'base64').toString('utf8');
      const combinedContent = existingContent + fileContent;

    // Update the file
    await axios.put(
      apiUrl,
      {
        message: "Update file via API",
        content: Buffer.from(combinedContent).toString("base64"),
        sha: sha,
        branch: branch,
      },
      { headers }
    );

    console.log("File updated on GitHub.");
    // Optionally, you can update the local file with empty content
    fs.writeFileSync(filePath, "");
    console.log("File content removed locally.");
  } catch (error) {
    // If the file doesn't exist, create a new file
    if (error.response.status === 404) {
      await axios.put(
        apiUrl,
        {
          message: "Create file via API",
          content: Buffer.from(fileContent).toString("base64"),
          branch: branch,
        },
        { headers }
      );

      console.log("File created on GitHub.");
      // Optionally, you can update the local file with empty content
      fs.writeFileSync(filePath, "");
      console.log("File content removed locally.");
    } else {
      console.error("Error uploading file to GitHub:", error.message);
    }
  }
}

const fetchLogsFile= async ()=>{
  try {

    // Replace 'your-github-username', 'your-repository-name', 'path/to/your/file.xml', and 'your-access-token'
    const apiViewLogsURL = `https://raw.githubusercontent.com/${owner}/${repo}/main/${fileName}`;

    const response = await axios.get(apiViewLogsURL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log("View Logs fetching status:"+response.status);

    return response.data;
  } catch (error) {
    console.error('Error fetching logs:', error.message);
    return "";
  }
}

// uploadToGitHub();

// Create or update the sitemap file on GitHub
const uploadSitemapToGitHub=async ()=> {

  // const sitemapFilepath= "./../sitemap.xml";
  const sitemapFilepath= path.join('/tmp', 'sitemap.xml'); // Firebase production
  const sitemapFileContent = fs.readFileSync(sitemapFilepath, "utf8");

  const apiUrl2 = `https://api.github.com/repos/${owner}/${repo}/contents/sitemap.xml`;

  try {
    // Check if the file already exists by fetching its current SHA
    const response = await axios.get(apiUrl2, { headers });
    const sha = response.data.sha;

    // Update the file
    await axios.put(
      apiUrl2,
      {
        message: "Update sitemap file via API",
        content: Buffer.from(sitemapFileContent).toString("base64"),
        sha: sha,
        branch: branch,
      },
      { headers }
    );

    console.log("Sitemap File updated on GitHub.");
  } catch (error) {
    // If the file doesn't exist, create a new file
    if (error.response.status === 404) {
      await axios.put(
        apiUrl2,
        {
          message: "Create sitemap file via API",
          content: Buffer.from(sitemapFileContent).toString("base64"),
          branch: branch,
        },
        { headers }
      );

      console.log("sitemap File created on GitHub.");
    } else {
      console.error("Error uploading sitemap file to GitHub:", error.message);
    }
  }
}

const fetchSitemapFile= async ()=>{
  try {

    // Replace 'your-github-username', 'your-repository-name', 'path/to/your/file.xml', and 'your-access-token'
    const apiUrl3 = `https://raw.githubusercontent.com/${owner}/${repo}/main/sitemap.xml`;

    const response = await axios.get(apiUrl3, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log("Sitemap fetching status:"+response.status);

    return response.data;
  } catch (error) {
    console.error('Error fetching XML:', error.message);
    return "";
  }
}

// module.exports = uploadToGitHub;
module.exports = {uploadLogsToGitHub, fetchLogsFile, uploadSitemapToGitHub, fetchSitemapFile};