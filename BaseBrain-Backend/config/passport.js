const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback' // URL complète après montage
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findByEmail(profile.emails[0].value);
    if (!user) {
      user = await User.create(
        profile.emails[0].value,
        null,
        'student',
        'google',
        profile.id,
        profile.name.familyName,
        profile.name.givenName
      );
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;