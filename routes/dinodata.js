const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const config = require('../config/database');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
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

// Express Messages Middleware (in-window alerts)
router.use(flash());
router.use( (req, res, next) => {
	res.locals.messages = require('express-messages')(req, res);
	next();
});

// Express Validator Middleware
/* depreciated
router.use(expressValidator({
	errorFormatter: (param, msg, value) => {
		let namespace = param.split('.');
		let root = namespace.shift();
		let formParam = root;

		while(namespace.length) {
			formParam += '['+namespace.shift()+']';
		}
		return {
			param: formParam,
			msg: msg,
			value: value
		}
	}
}));
*/

// Passport Configuration
require('../config/passport')(passport);
// Passport Middleware
router.use(passport.initialize());
router.use(passport.session());

// User Authentication Route
router.get('*', (req, res, next) => {
	res.locals.user = req.user || null;
	next();
})

// Handle a GET request for the home page
router.get('/', (req, res) => {
	res.render('ddindex', {});
});



router.get('/login', (req, res) => {
	res.render('ddlogin', {});
});

// Route to the cage page(s)
const cage = require('./cage');
router.use('/cage', cage);
// Route to the profile page(s)
const profile = require('./profile');
router.use('/profile', profile);


router.get('/donate', (req, res) => {
	res.render('dddonate', {});
});

module.exports = router;
