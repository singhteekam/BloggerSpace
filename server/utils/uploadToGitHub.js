const fs = require("fs");
const axios = require("axios");

// GitHub repository details
const owner = process.env.GITHUBOWNER;
const repo = process.env.GITHUBREPO;
const branch = process.env.GITHUBBRANCH; //the branch we want to upload to

// GitHub personal access token (generate one in your GitHub account settings)
const accessToken = process.env.GITHUBACCESSTOKEN;

// The path to the file we want to upload
const filePath = "./utils/Logging/logs.log";

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
const uploadToGitHub=async ()=> {
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

// uploadToGitHub();

module.exports = uploadToGitHub;