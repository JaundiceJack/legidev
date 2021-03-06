const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const config = require('../config/database');
const bodyParser = require('body-parser');
const session = require('express-session');
const expressValidator = require('express-validator');
const passport = require('passport');

// Connect to MongoDB
mongoose.connect(config.database);
let db = mongoose.connection;
// Check connection
db.once('open', () => {	console.log('Connected to MongoDB'); });
db.on('error', (err) => { console.log(err); });
// Load in database models
let User = require('../models/user');

// Connect body-parser
// parse application/x-www-form-urlencoded
router.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
router.use(bodyParser.json());

// Express Session Middleware (keeps users logged in etc.)
router.use(session({
	secret: "dreadLooking",
	resave: true,
	saveUninitialized: true
}));

// Passport Configuration
require('../config/passport')(passport);
// Passport Middleware
router.use(passport.initialize());
router.use(passport.session());

// Express Messages Middleware (in-window alerts)
router.use(require('connect-flash')());
router.use( (req, res, next) => {
	res.locals.messages = require('express-messages')(req, res);
	next();
});



// User Authentication Route
router.get('*', (req, res, next) => {
	res.locals.user = req.user || null;
	next();
})


// Route to the cage page(s)
const cage = require('./cage');
router.use('/cage', cage);
// Route to the readings handler
const reading = require('./reading');
router.use('/reading', reading);
// Route to the profile page(s)
const profile = require('./profile');
router.use('/profile', profile);
// Route to the home page(s)
const home = require('./home');
router.use('/', home);

router.get('/donate', (req, res) => {
	res.render('dddonate', {});
});

module.exports = router;
