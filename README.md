# BloggerSpace
Blogging website using MERN

### Link: [https://bloggerspace.singhteekam.in](https://bloggerspace.singhteekam.in/)

## Features
- View all published blogs
- Create new blog
- save as draft the blog
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
- Responsive


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

## Contributing

Contributions are always welcome!