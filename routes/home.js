const express = require('express');
const router = express.Router();

// Bookmarking
router.get('*', (req, res, next) => {
	res.locals.bookmark = "home";
	next();
})

// Handle a GET request for the home page
router.get('/', (req, res) => {
	res.render('ddindex', {});
});

module.exports = router;
