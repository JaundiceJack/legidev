const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');
const config = require('./database');
const bcrypt = require('bcryptjs');

module.exports = (passport) => {
  passport.use(new LocalStrategy(

    (username, password, done) => {
      console.log('*** in passport.use')
      User.findOne({ username: username }, (err, user) => {
        console.log('*** in User.findOne callback')
        if (err) { console.log('*** err', err); return done(err); }
        if (!user) { console.log('*** no username'); return done(null, false, {message: 'User not found.'}); }
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) console.log('*** bad password', err);
          if (isMatch) {console.log('*** found?');return done(null, user);}
          else return done(null, false, {message: 'Incorrect password.'});      
        });
      });
    }
  ));

  /*
  // Local Strategy
  passport.use(new LocalStrategy( (username, password, done) => {
    // Match username
    let query = {username: username};
    User.findOne(query, (err, user) => {
      // Handle Errors
      if (err) console.log(err);
      // Handle user not found
      if (!user) return done(null, false, {message: 'User not found.'});
      // Match Password
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) console.log(err);
        if (isMatch) return done(null, user);
        else return done(null, false, {message: 'Incorrect password.'});      
      });
    });
  }));
*/
  // Use a cookie to maintain user sessions
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
};

/*
passport.use(
  'local',
  new LocalStrategy( {username: 'username'},
    (username, password, done) => {
      User.findOne( {username: username} ).then( user => {
        if (!user)
          return done(null, false, {message: 'Incorrect username and password. '});        
        return user.validPassword(password) ?
          done(null, user) :
          done(null, false, {message: 'Incorrect username and password. '});
      }).catch(() => 
        done(null, false, {message: 'Incorrect username and password. '}))
      }
  )
)

passport.use(new LocalStrategy(
  (username, password, done) => {
    User.findOne({ username: username }, (err, user) => {
      if (err) { return done(err); }
      if (!user) { return done(null, false, {message: 'User not found.'}); }
      if (!user.verifyPassword(password)) { return done(null, false); }
      return done(null, user);
    });
  }
));



*/