const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
// const FacebookStrategy = require('passport-facebook').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
// const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
// const TwitterStrategy = require('@superfaceai/passport-twitter-oauth2').Strategy;
// const { OIDCStrategy } = require('passport-azure-ad');
const User = require("../models/User");
const bcrypt = require("bcrypt");
const axios = require("axios");
const sendEmail = require("./mailer");

// Google
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      // callbackURL: `/api/users/auth/google/callback`,
      callbackURL: `${process.env.BACKEND_URL}/api/users/auth/google/callback`,
    },
    async function (accessToken, refreshToken, profile, done) {
      // In a production app, you would want to associate the Google account with a user record in your database
      // In a production app, you'd save the profile information to the database
      // For now, we'll just return the profile object

      console.log("Google oauth2: ", profile);

      let user = await User.findOne({ email: profile.emails[0].value });
      console.log("oauth2:", profile.emails[0].value);

      const response = await axios.get(profile.photos[0].value, {
        responseType: "arraybuffer",
      });

      if (!user) {
        // If user does not exist, create a new user

        var chars =
          "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var passwordLength = 8;
        var password = "";
        for (var i = 0; i < passwordLength; i++) {
          var randomNumber = Math.floor(Math.random() * chars.length);
          password += chars.substring(randomNumber, randomNumber + 1);
        }
        console.log(password);

        user = new User({
          // googleId: profile.id,
          fullName: profile.displayName,
          userName: profile.emails[0].value
            .substring(0, profile.emails[0].value.indexOf("@"))
            .replace(/[^a-zA-Z0-9 ]/g, ""),
          email: profile.emails[0].value,
          profilePicture: Buffer.from(response.data, "binary").toString(
            "base64"
          ),
          password: await bcrypt.hash(password, 10),
          isVerified: profile.emails[0].verified,
          authType: "Google",
          status: "ACTIVE",
        });
        await user.save();


      const receiver = profile.emails[0].value;
      const receiver2 = process.env.EMAIL;
      const subject = "Sign up success";
      const html = `<div class="content">
      <b>Hi ${profile.displayName},</b>
      <p>Sign in with Google success!!.</p>
      <p>Sign in with Google or you can use your Email and default password to sign in.</p>
      <p><b>Note: </b>Please use your default password to sign in with Email & password.</p>
      <p>Email: <span class="teal-green">${receiver}</span></p>
      <p>Default password: <span class="teal-green">${password}</span></p>
      </div>`;
      sendEmail(receiver, subject, html)
        .then((response) => {
          console.log(`Email sent to ${receiver}:`, response);
          // Handle success
        })
        .catch((error) => {
          console.error("Error sending email:", error);
          // Handle error
        });
      sendEmail(receiver2, subject, html)
        .then((response) => {
          console.log(`Email sent to ${receiver2}:`, response);
          // Handle success
        })
        .catch((error) => {
          console.error("Error sending email:", error);
          // Handle error
        });

      }

      if(user && user.authType!=="Google"){
          user.fullName= profile.displayName;
          user.userName= profile.emails[0].value
            .substring(0, profile.emails[0].value.indexOf("@"))
            .replace(/[^a-zA-Z0-9 ]/g, "");
          user.profilePicture= Buffer.from(response.data, "binary").toString(
            "base64"
          );
          user.isVerified= profile.emails[0].verified;
          user.authType= "Google";
        await user.save();

      const receiver = profile.emails[0].value;
      const subject = "Sign in with Google success";
      const html = `<div class="content">
      <b>Hi ${profile.displayName},</b>
      <p>You have signed in with Google!!.</p>
       <p>Your primary auth type is now: <span class="teal-green">Google</span></p>
      </div>`;
      sendEmail(receiver, subject, html)
        .then((response) => {
          console.log(`Email sent to ${receiver}:`, response);
        })
        .catch((error) => {
          console.error("Error sending email:", error);
        });
      }

      return done(null, user);
    }
  )
);

// Github
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_APP_CLIENT_ID,
      clientSecret: process.env.GITHUB_APP_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/users/auth/github/callback`,
    },
    async function (accessToken, refreshToken, profile, done) {

      const emailResponse = await axios('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'BloggerSpace',
          },
        });
        console.log("Email res: ", emailResponse.data[0].email);
 
      console.log("Profile github: ", profile);

      let user = await User.findOne({ email: emailResponse.data[0].email });

      const response = await axios.get(profile.photos[0].value, {
        responseType: "arraybuffer",
      });

      if (!user) {
        // If user does not exist, create a new user

        var chars =
          "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var passwordLength = 8;
        var password = "";
        for (var i = 0; i < passwordLength; i++) {
          var randomNumber = Math.floor(Math.random() * chars.length);
          password += chars.substring(randomNumber, randomNumber + 1);
        }
        console.log(password);

        user = new User({
          // googleId: profile.id,
          fullName: profile.displayName,
          userName: emailResponse.data[0].email
            .substring(0, emailResponse.data[0].email.indexOf("@"))
            .replace(/[^a-zA-Z0-9 ]/g, ""),
          email: emailResponse.data[0].email,
          profilePicture: Buffer.from(response.data, "binary").toString(
            "base64"
          ),
          password: await bcrypt.hash(password, 10),
          isVerified: "true",
          authType: "Github",
          status: "ACTIVE",
        });
        await user.save();


      const receiver = emailResponse.data[0].email;
      const receiver2 = process.env.EMAIL;
      const subject = "Sign up success";
      const html = `<div class="content">
      <b>Hi ${profile.displayName},</b>
      <p>Sign in with Github success!!.</p>
      <p>Sign in with Github or you can use your Email and default password to sign in.</p>
      <p><b>Note: </b>Please use your default password to sign in with Email & password.</p>
      <p>Email: <span class="teal-green">${receiver}</span></p>
      <p>Default password: <span class="teal-green">${password}</span></p>
      </div>`;
      sendEmail(receiver, subject, html)
        .then((response) => {
          console.log(`Email sent to ${receiver}:`, response);
          // Handle success
        })
        .catch((error) => {
          console.error("Error sending email:", error);
          // Handle error
        });
      sendEmail(receiver2, subject, html)
        .then((response) => {
          console.log(`Email sent to ${receiver2}:`, response);
          // Handle success
        })
        .catch((error) => {
          console.error("Error sending email:", error);
          // Handle error
        });

      }

      if(user && user.authType!=="Github"){
        user.fullName= profile.displayName;
        user.userName= emailResponse.data[0].email
          .substring(0, emailResponse.data[0].email.indexOf("@"))
          .replace(/[^a-zA-Z0-9 ]/g, "");
        user.profilePicture= Buffer.from(response.data, "binary").toString(
          "base64"
        );
        user.isVerified= "true";
        user.authType= "Github";
      await user.save();

    const receiver = emailResponse.data[0].email;
    const subject = "Sign in with Github success";
    const html = `<div class="content">
    <b>Hi ${profile.displayName},</b>
    <p>You have signed in with Github!!.</p>
    <p>Your primary auth type is now: <span class="teal-green">Github</span></p>
    </div>`;
    sendEmail(receiver, subject, html)
      .then((response) => {
        console.log(`Email sent to ${receiver}:`, response);
      })
      .catch((error) => {
        console.error("Error sending email:", error);
      });
    }

      return done(null, user);
    }
  )
);

// // Microsoft
// passport.use( new OIDCStrategy({
//   identityMetadata: `${process.env.MICROSOFT_CLOUD_INSTANCE}${process.env.MICROSOFT_AZURE_TENANT_ID}/.well-known/openid-configuration`,
//   clientID: process.env.MICROSOFT_CLIENT_ID,
//   clientSecret: process.env.MICROSOFT_CLIENT_SECRET, 
//   responseType: process.env.MICROSOFT_RESPONSE_TYPE,
//   responseMode: process.env.MICROSOFT_RESPONSE_MODE,
//   redirectUrl: `${process.env.BACKEND_URL}/api/users/auth/microsoft/callback`, 
//   allowHttpForRedirectUrl: true, // Set to true for local development
//   isB2C: false, // Set to true if using Azure AD B2C
//   validateIssuer: false,  // Set to true if you want to validate the issuer
//   passReqToCallback: true,
//   useCookieInsteadOfSession: false, // Use cookies for session management
//   scope: ['openid', 'profile', 'email'], // Specify the required scopes
//   loggingLevel: 'info', // Adjust logging level as needed
// }, async(req,iss, sub, profile, accessToken, refreshToken, done) => {
//   if ( accessToken ) {
//       console.log( 'Received accessToken - ' + accessToken );
//   }
//   if ( refreshToken ) {
//       console.log( 'Received refreshToken - ' + refreshToken );
//   }
//   if ( !profile.oid ) {
//       //console.log( 'Received accessToken - ' + accessToken );
//       return done( new Error( "No oid found" ), null );
//   }
//   console.log("profileeeee: ", profile);
//   //Saving user to db
//   let user = await User.findOne({ email: profile._json.upn });
//       console.log("email microsoft:", profile._json.upn);

//       if (!user) {
//         // If user does not exist, create a new user

//         var chars =
//           "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
//         var passwordLength = 8;
//         var password = "";
//         for (var i = 0; i < passwordLength; i++) {
//           var randomNumber = Math.floor(Math.random() * chars.length);
//           password += chars.substring(randomNumber, randomNumber + 1);
//         }
//         console.log(password);

//         // const response = await axios.get(profile.photos[0].value, {
//         //   responseType: "arraybuffer",
//         // });

//         user = new User({
//           // googleId: profile.id,
//           fullName: profile.displayName,
//           userName: profile._json.upn
//             .substring(0, profile._json.upn.indexOf("@"))
//             .replace(/[^a-zA-Z0-9 ]/g, ""),
//           email: profile._json.upn,
//           // profilePicture: Buffer.from(response.data, "binary").toString(
//           //   "base64"
//           // ),
//           password: await bcrypt.hash(password, 10),
//           isVerified: "true",
//           authType: "Microsoft",
//         });
//         console.log("User MS: ", user);
//         await user.save();


//       const receiver = profile._json.upn;
//       const receiver2 = process.env.EMAIL;
//       const subject = "Sign up success";
//       const html = `<div>
//       <b>Hi ${profile.displayName},</b>
//       <p>Sign in with Google success!!.</p>
//       <p>Sign in with Google or you can use your Email and default password to sign in.</p>
//       <p><b>Note: </b>Please change your default password to sign in with Email & password.\n\nDefault password: ${password}</p>
//       </div>`;
//       sendEmail(receiver, subject, html)
//         .then((response) => {
//           console.log(`Email sent to ${receiver}:`, response);
//           // Handle success
//         })
//         .catch((error) => {
//           console.error("Error sending email:", error);
//           // Handle error
//         });
//       sendEmail(receiver2, subject, html)
//         .then((response) => {
//           console.log(`Email sent to ${receiver2}:`, response);
//           // Handle success
//         })
//         .catch((error) => {
//           console.error("Error sending email:", error);
//           // Handle error
//         });

//       }

//   return done(null, user);
// }));



// passport.use(
//   new FacebookStrategy(
//     {
//       clientID: process.env.FACEBOOK_APP_ID,
//       clientSecret: process.env.FACEBOOK_APP_SECRET,
//       // callbackURL: `/api/users/auth/google/callback`,
//       callbackURL: `${process.env.BACKEND_URL}/api/users/auth/facebook/callback`,
//       profileFields: ['user_birthday', 'user_gender','user_hometown', 'user_link'],
//       // profileFields: ['id', 'displayName', 'email', 'name', 'picture.type(large)'],
//     },
//     async function (accessToken, refreshToken, profile, done) {
//       // In a production app, you would want to associate the Google account with a user record in your database
//       // In a production app, you'd save the profile information to the database
//       // For now, we'll just return the profile object

//       console.log("Profile fb: ", profile);

//       let user = await User.findOne({ email: profile.emails[0].value });
//       console.log("facebook:", profile.emails[0].value);

//       if (!user) {
//         // If user does not exist, create a new user

//         var chars =
//           "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
//         var passwordLength = 8;
//         var password = "";
//         for (var i = 0; i < passwordLength; i++) {
//           var randomNumber = Math.floor(Math.random() * chars.length);
//           password += chars.substring(randomNumber, randomNumber + 1);
//         }
//         console.log(password);

//         const response = await axios.get(profile.photos[0].value, {
//           responseType: "arraybuffer",
//         });

//         user = new User({
//           // googleId: profile.id,
//           fullName: profile.displayName,
//           userName: profile.emails[0].value
//             .substring(0, profile.emails[0].value.indexOf("@"))
//             .replace(/[^a-zA-Z0-9 ]/g, ""),
//           email: profile.emails[0].value,
//           profilePicture: Buffer.from(response.data, "binary").toString(
//             "base64"
//           ),
//           password: await bcrypt.hash(password, 10),
//           isVerified: "true",
//           authType: "Facebook",
//         });
//         await user.save();


//       const receiver = profile.emails[0].value;
//       const receiver2 = process.env.EMAIL;
//       const subject = "Sign up success";
//       const html = `<div>
//       <b>Hi ${profile.displayName},</b>
//       <p>Sign in with Facebook success!!.</p>
//       <p>Sign in with Facebook or you can use your Email and default password to sign in.</p>
//       <p><b>Note: </b>Please change your default password to sign in with Email & password.\n\nDefault password: ${password}</p>
//       </div>`;
//       sendEmail(receiver, subject, html)
//         .then((response) => {
//           console.log(`Email sent to ${receiver}:`, response);
//           // Handle success
//         })
//         .catch((error) => {
//           console.error("Error sending email:", error);
//           // Handle error
//         });
//       sendEmail(receiver2, subject, html)
//         .then((response) => {
//           console.log(`Email sent to ${receiver2}:`, response);
//           // Handle success
//         })
//         .catch((error) => {
//           console.error("Error sending email:", error);
//           // Handle error
//         });

//       }
//       return done(null, user);
//     }
//   )
// );



// // Linkedin
// passport.use(
//   new LinkedInStrategy(
//     {
//       clientID: process.env.LINKEDIN_CLIENT_ID,
//       clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
//       callbackURL: `${process.env.BACKEND_URL}/api/users/auth/linkedin/callback`,
//       scope: ['openid','profile', 'email'],
//       state: true,
//     },
//     async function (accessToken, refreshToken, profile, done) {
      
//       console.log("Profile linkedin: ", profile);

//       let user = await User.findOne({ email: profile.emails[0].value });
//       console.log("oauth2:", profile.emails[0].value);

//       if (!user) {
//         // If user does not exist, create a new user

//         var chars =
//           "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
//         var passwordLength = 8;
//         var password = "";
//         for (var i = 0; i < passwordLength; i++) {
//           var randomNumber = Math.floor(Math.random() * chars.length);
//           password += chars.substring(randomNumber, randomNumber + 1);
//         }
//         console.log(password);

//         const response = await axios.get(profile.photos[0].value, {
//           responseType: "arraybuffer",
//         });

//         user = new User({
//           // googleId: profile.id,
//           fullName: profile.displayName,
//           userName: profile.emails[0].value
//             .substring(0, profile.emails[0].value.indexOf("@"))
//             .replace(/[^a-zA-Z0-9 ]/g, ""),
//           email: profile.emails[0].value,
//           profilePicture: Buffer.from(response.data, "binary").toString(
//             "base64"
//           ),
//           password: await bcrypt.hash(password, 10),
//           isVerified: profile.emails[0].verified,
//           authType: "Google",
//         });
//         await user.save();


//       const receiver = profile.emails[0].value;
//       const receiver2 = process.env.EMAIL;
//       const subject = "Sign up success";
//       const html = `<div>
//       <b>Hi ${profile.displayName},</b>
//       <p>Sign in with Google success!!.</p>
//       <p>Sign in with Google or you can use your Email and default password to sign in.</p>
//       <p><b>Note: </b>Please change your default password to sign in with Email & password.\n\nDefault password: ${password}</p>
//       </div>`;
//       sendEmail(receiver, subject, html)
//         .then((response) => {
//           console.log(`Email sent to ${receiver}:`, response);
//           // Handle success
//         })
//         .catch((error) => {
//           console.error("Error sending email:", error);
//           // Handle error
//         });
//       sendEmail(receiver2, subject, html)
//         .then((response) => {
//           console.log(`Email sent to ${receiver2}:`, response);
//           // Handle success
//         })
//         .catch((error) => {
//           console.error("Error sending email:", error);
//           // Handle error
//         });

//       }

//       return done(null, user);
//     }
//   )
// );

// passport.use(
//   new TwitterStrategy(
//     {
//       clientID: process.env.X_CLIENT_ID,
//       clientSecret: process.env.X_CLIENT_SECRET,
//       clientType:'confidential',
//       // callbackURL: `/api/users/auth/google/callback`,
//       callbackURL: `${process.env.BACKEND_URL}/api/users/auth/twitter/callback`,
//     },
//     async function (accessToken, refreshToken, profile, done) {
//       // In a production app, you would want to associate the Google account with a user record in your database
//       // In a production app, you'd save the profile information to the database
//       // For now, we'll just return the profile object

//       console.log("X profiile: ", profile);

//       let user = await User.findOne({ email: profile.emails[0].value });
//       console.log("oauth2:", profile.emails[0].value);

//       if (!user) {
//         // If user does not exist, create a new user

//         var chars =
//           "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
//         var passwordLength = 8;
//         var password = "";
//         for (var i = 0; i < passwordLength; i++) {
//           var randomNumber = Math.floor(Math.random() * chars.length);
//           password += chars.substring(randomNumber, randomNumber + 1);
//         }
//         console.log(password);

//         const response = await axios.get(profile.photos[0].value, {
//           responseType: "arraybuffer",
//         });

//         user = new User({
//           // googleId: profile.id,
//           fullName: profile.displayName,
//           userName: profile.emails[0].value
//             .substring(0, profile.emails[0].value.indexOf("@"))
//             .replace(/[^a-zA-Z0-9 ]/g, ""),
//           email: profile.emails[0].value,
//           profilePicture: Buffer.from(response.data, "binary").toString(
//             "base64"
//           ),
//           password: await bcrypt.hash(password, 10),
//           isVerified: profile.emails[0].verified,
//           authType: "Google",
//         });
//         await user.save();


//       const receiver = profile.emails[0].value;
//       const receiver2 = process.env.EMAIL;
//       const subject = "Sign up success";
//       const html = `<div>
//       <b>Hi ${profile.displayName},</b>
//       <p>Sign in with Google success!!.</p>
//       <p>Sign in with Google or you can use your Email and default password to sign in.</p>
//       <p><b>Note: </b>Please change your default password to sign in with Email & password.\n\nDefault password: ${password}</p>
//       </div>`;
//       sendEmail(receiver, subject, html)
//         .then((response) => {
//           console.log(`Email sent to ${receiver}:`, response);
//           // Handle success
//         })
//         .catch((error) => {
//           console.error("Error sending email:", error);
//           // Handle error
//         });
//       sendEmail(receiver2, subject, html)
//         .then((response) => {
//           console.log(`Email sent to ${receiver2}:`, response);
//           // Handle success
//         })
//         .catch((error) => {
//           console.error("Error sending email:", error);
//           // Handle error
//         });

//       }

//       return done(null, user);
//     }
//   )
// );


// // Serialize user to session
// passport.serializeUser((user, done) => {
//   // done(null, user._id);
//   console.log("In serialize: ", user);
//   done(null, user);
// });

// // Deserialize user from session
// passport.deserializeUser((user, done) => {
//   console.log("In deserialize : ", user);
//   done(null, user);
// //   try{
// //     // const user = await User.findById(id);
// // }
// // catch(err) {
// //     done(err, null);
// // }
//   // done(null, obj); 
// });

module.exports = passport;
