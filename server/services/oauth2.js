const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("./../models/User");
const bcrypt = require("bcrypt");
const axios = require("axios");
const sendEmail = require("./mailer");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      callbackURL: `/api/users/auth/google/callback`,
      // callbackURL: `${process.env.BACKEND_URL}/api/users/auth/google/callback`,
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

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user._id);
  // done(null, user);
});

// Deserialize user from session
passport.deserializeUser(async(id, done) => {
  try{
    const user = await User.findById(id);
    done(null, user);
}
catch(err) {
    done(err, null);
}
  // done(null, obj); 
});

module.exports = passport;
