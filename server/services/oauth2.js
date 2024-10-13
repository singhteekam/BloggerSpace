const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const User = require("./../models/User");
const bcrypt = require("bcrypt");
const axios = require("axios");
const sendEmail = require("./mailer");

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

      let user = await User.findOne({ email: profile.emails[0].value });
      console.log("oauth2:", profile.emails[0].value);

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

        const response = await axios.get(profile.photos[0].value, {
          responseType: "arraybuffer",
        });

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
        });
        await user.save();


      const receiver = profile.emails[0].value;
      const receiver2 = process.env.EMAIL;
      const subject = "Sign up success";
      const html = `<div>
      <b>Hi ${profile.displayName},</b>
      <p>Sign in with Google success!!.</p>
      <p>Sign in with Google or you can use your Email and default password to sign in.</p>
      <p><b>Note: </b>Please change your default password to sign in with Email & password.\n\nDefault password: ${password}</p>
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

      return done(null, user);
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      // callbackURL: `/api/users/auth/google/callback`,
      callbackURL: `${process.env.BACKEND_URL}/api/users/auth/facebook/callback`,
      profileFields: ['user_birthday', 'user_gender','user_hometown', 'user_link'],
      // profileFields: ['id', 'displayName', 'email', 'name', 'picture.type(large)'],
    },
    async function (accessToken, refreshToken, profile, done) {
      // In a production app, you would want to associate the Google account with a user record in your database
      // In a production app, you'd save the profile information to the database
      // For now, we'll just return the profile object

      console.log("Profile fb: ", profile);

      let user = await User.findOne({ email: profile.emails[0].value });
      console.log("facebook:", profile.emails[0].value);

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

        const response = await axios.get(profile.photos[0].value, {
          responseType: "arraybuffer",
        });

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
          isVerified: "true",
          authType: "Facebook",
        });
        await user.save();


      const receiver = profile.emails[0].value;
      const receiver2 = process.env.EMAIL;
      const subject = "Sign up success";
      const html = `<div>
      <b>Hi ${profile.displayName},</b>
      <p>Sign in with Facebook success!!.</p>
      <p>Sign in with Facebook or you can use your Email and default password to sign in.</p>
      <p><b>Note: </b>Please change your default password to sign in with Email & password.\n\nDefault password: ${password}</p>
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
      return done(null, user);
    }
  )
);

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

        const response = await axios.get(profile.photos[0].value, {
          responseType: "arraybuffer",
        });

        user = new User({
          // googleId: profile.id,
          fullName: profile.displayName,
          userName: emailResponse.data[0].email
            .substring(0, profile.emails[0].value.indexOf("@"))
            .replace(/[^a-zA-Z0-9 ]/g, ""),
          email: emailResponse.data[0].email,
          profilePicture: Buffer.from(response.data, "binary").toString(
            "base64"
          ),
          password: await bcrypt.hash(password, 10),
          isVerified: "true",
          authType: "Github",
        });
        await user.save();


      const receiver = emailResponse.data[0].email;
      const receiver2 = process.env.EMAIL;
      const subject = "Sign up success";
      const html = `<div>
      <b>Hi ${profile.displayName},</b>
      <p>Sign in with Github success!!.</p>
      <p>Sign in with Github or you can use your Email and default password to sign in.</p>
      <p><b>Note: </b>Please change your default password to sign in with Email & password.\n\nDefault password: ${password}</p>
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
      return done(null, user);
    }
  )
);

// Linkedin
passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/users/auth/linkedin/callback`,
      scope: ['openid','profile', 'email'],
      state: true,
    },
    async function (accessToken, refreshToken, profile, done) {
      
      console.log("Profile linkedin: ", profile);

      let user = await User.findOne({ email: profile.emails[0].value });
      console.log("oauth2:", profile.emails[0].value);

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

        const response = await axios.get(profile.photos[0].value, {
          responseType: "arraybuffer",
        });

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
        });
        await user.save();


      const receiver = profile.emails[0].value;
      const receiver2 = process.env.EMAIL;
      const subject = "Sign up success";
      const html = `<div>
      <b>Hi ${profile.displayName},</b>
      <p>Sign in with Google success!!.</p>
      <p>Sign in with Google or you can use your Email and default password to sign in.</p>
      <p><b>Note: </b>Please change your default password to sign in with Email & password.\n\nDefault password: ${password}</p>
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

      return done(null, user);
    }
  )
);

passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.X_CLIENT_ID,
      consumerSecret: process.env.X_CLIENT_SECRET,
      // callbackURL: `/api/users/auth/google/callback`,
      callbackURL: `${process.env.BACKEND_URL}/api/users/auth/twitter/callback`,
    },
    async function (token, tokenSecret, profile, done) {
      // In a production app, you would want to associate the Google account with a user record in your database
      // In a production app, you'd save the profile information to the database
      // For now, we'll just return the profile object

      console.log("X profiile: ", profile);

      let user = await User.findOne({ email: profile.emails[0].value });
      console.log("oauth2:", profile.emails[0].value);

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

        const response = await axios.get(profile.photos[0].value, {
          responseType: "arraybuffer",
        });

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
        });
        await user.save();


      const receiver = profile.emails[0].value;
      const receiver2 = process.env.EMAIL;
      const subject = "Sign up success";
      const html = `<div>
      <b>Hi ${profile.displayName},</b>
      <p>Sign in with Google success!!.</p>
      <p>Sign in with Google or you can use your Email and default password to sign in.</p>
      <p><b>Note: </b>Please change your default password to sign in with Email & password.\n\nDefault password: ${password}</p>
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

      return done(null, user);
    }
  )
);


// Serialize user to session
passport.serializeUser((user, done) => {
  // done(null, user._id);
  console.log("In serialize: ", user);
  done(null, user);
});

// Deserialize user from session
passport.deserializeUser((user, done) => {
  console.log("In deserialize : ", user);
  done(null, user);
//   try{
//     // const user = await User.findById(id);
// }
// catch(err) {
//     done(err, null);
// }
  // done(null, obj); 
});

module.exports = passport;
