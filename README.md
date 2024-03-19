# BloggerSpace
Tech Stack: MERN stack
 - A blogging website where users can write a blog on any topic. 
 - There are two panels: Writing and Reviewing panel. In
 writing panel, anyone can signup and start writing blogs.
 - The reviewer requests would be sent to admin for approval and then user can start reviewing the assigned blogs. The admin can delete any user, revoke/grant reviewer access.

 - Used nodemailer API to send emails. Ex: Email will be sent when the blog is under review, discarded, published.
 - Review stages: Pending for Review-Under review-In Review-Awaiting author (if need modification)-Publish
Please try and give me the feedback. Your valuable feedback will help me to improve this website.

### Link: [https://bloggerspace.singhteekam.in](https://bloggerspace.singhteekam.in/)

### BloggerSpace Reviewer Panel: [https://reviewbloggerspace.singhteekam.in](https://reviewbloggerspace.singhteekam.in/)

## Features
- View all published blogs
- Create new blog
- save as draft the blog
- Real time blog views count
- Comments and Reply on the comments
- Follow and Unfollow users
- Share blog on most famous social media platforms
- Count number of visitor who visited the website.
- Forgot password page
- Change password
- Delete Account
- Change username
- View public profile of any user
- Email verification for new users
- Review stages:
    - Pending for Review
    - Under review
    - In Review
    - Awaiting author (if need modification)
    - Publish
- Mail sent when:
    - blog is submitted for review
    - blog status is moved to awaiting author
    - blog is published
- Like any blog (user should be loggged in and verified account)
- Save any blog for read later
- Search any published blog
- Writing Guidelines for writing the blog
- Preview the blog before submitting for review
- Sitemap
- Responsive
- SEO friendly


#### Folder structure:
```
├── client
│   ├── public
│   ├── src
│   │   ├── components
│   │   ├── utils
│   ├── App.css
│   ├── App.js
│   ├── index.css
│   ├── index.js
│   ├── package.json
│   ├── package-lock.json
│   ├── .gitignore
├── server
│   ├── controllers
│   │   ├── Admin
│   │   ├── Reviewer
│   │   ├── blogController.js
│   │   └── userscontroller.js
│   ├── db
│   │   └── db.js
│   ├── middlewares
│   ├── models
│   ├── routes
│   ├── services
│   ├── utils
│   ├── .env
│   ├── node_modules
│   ├── package.json
│   └── package-lock.json
├── package.json
├── package-lock.json  
├── .gitignore  
└── README.md
```
#### BloggerSpace Homepage
![alt text](image.png)

## Contributing

Contributions are always welcome!