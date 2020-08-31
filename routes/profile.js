const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { body, validationResult } = require('express-validator');

// Bring in the user model
const User = require('../models/user');
// Bring in the reptile model
const Reptile = require('../models/reptile');


// Bookmarking
router.get('*', (req, res, next) => {
	res.locals.bookmark = "home";
	next();
})

// User Creation Get Request
router.get('/new_account', (req, res) => {
	res.render('ddnewuser', { errors: req.session.errors });
});

// User Creation Post Request
router.post('/new_account',
  [
    body('username').notEmpty(),
    body('password').notEmpty(),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) throw new Error('Password confirmation does not match password');
      return true;
    })
  ],
  (req, res, next) => {
    // Check that the username is not taken
    User.findOne({username: req.body.username}, (err, user) => {
       if(err) { req.session.errors = err; res.redirect('/dinodata/profile/new_account') }
       if(user) { res.redirect('/dinodata/profile/new_account') }
     })
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
    // Create a new user if no errors were found
    else {
      let newUser = new User({
        username: req.body.username,
        password: req.body.password
      });
      // Encrypt the password before saving the user
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) { console.log(err); }
          newUser.password = hash;
          // Finally save the user if they did everything right
          // TODO: alert the user if it fails, like res.render + errors
          newUser.save( err => {
            if (err) {
              console.log(err);
              return;
            }
            else {
              req.flash('success', "Registration Successful!");
              passport.authenticate('local', {
            		successRedirect: '/dinodata/cage',
            		failureRedirect: '/dinodata/profile/login',
            		failureFlash: true
            	})(req, res, next);;
            }
          })
        });
      });
    };
  }
)



// Login Get Request
router.get('/login', (req, res) => {
	res.render('ddlogin', {	errors: req.session.errors })
});

// Login Post Request
router.post('/login',
  passport.authenticate('local', {
		successRedirect: '/dinodata/cage',
		failureRedirect: '/dinodata/profile/login',
		failureFlash: true
	})
);

// Logout Request
router.get('/logout', (req, res) => {
	req.logout();
	req.flash('success', "You're now logged out.");
	res.redirect('/dinodata');
})

module.exports = router;
