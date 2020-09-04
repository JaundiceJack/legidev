const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { body, validationResult } = require('express-validator');

// Bring in the reptile model
const Reptile = require('../models/reptile');

// Bookmarking
router.get('*', (req, res, next) => {
	res.locals.bookmark = "cage";
	next();
})

// Reptile Creation Page Route
router.get('/create', ensureAuthenticated, (req, res) => {
	res.render('ddnewreptile', { errors: req.session.errors	});
	req.session.errors = null;
});
// Reptile Creation Post Route
router.post('/create', ensureAuthenticated,
	[
		// TODO: Check that type is in the list of approved types
		body('reptiname').notEmpty(),
    body('reptiname').isAlpha(),
	],
 	(req, res) => {
		// Check for input errors
		const errors = validationResult(req);
		if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
		else {
			let newReptile = new Reptile({
				owner_id: req.user._id,
				name: req.body.reptiname.toLowerCase().trim(),
				type: req.body.reptitype
			});
			newReptile.save( err => {
				if (err) {
					console.log(err);
					req.flash('error', 'Errors encountered while saving the new reptile...');
					res.redirect('/dinodata/cage/create');
					return;
				}
				else {
					req.flash('success', capitalize(newReptile.name)+" successfully added.");
					res.redirect('/dinodata/cage/'+newReptile._id);
					return;
				}
			});
		};
	}
);
// Reptile editing routes
router.get('/edit/:reptile_id', ensureAuthenticated, async (req, res) => {
	const reptile = await Reptile.findById(req.params.reptile_id).exec();
	res.render('ddedit', { selected: reptile, errors: req.session.errors });
	req.session.errors = null;
})
router.post('/edit/:reptile_id', ensureAuthenticated,
	[
		// TODO: Check that type is in the list of approved types
		body('reptiname').notEmpty(),
		body('reptiname').isAlpha(),
	],
	(req, res) => {
		let reptile = {};
		// Grab the entered info
		reptile.name = req.body.reptiname.toLowerCase().trim();
		reptile.type = req.body.reptitype;
		const query = {_id: req.params.reptile_id}
		// Check for input errors
		const errors = validationResult(req);
		if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
		else {
			Reptile.update(query, reptile, (err) => {
				if (err) {
					console.log(err);
					req.flash('error', 'Errors encountered while updating the reptile...');
					res.redirect('/dinodata/cage/'+req.params.reptile_id);
					return;
				}
				else {
					req.flash('success', capitalize(reptile.name)+" successfully edited.");
					res.redirect('/dinodata/cage/'+req.params.reptile_id);
					return;
				}
			});
		};
	}
)
router.delete('/edit/:reptile_id', ensureAuthenticated, (req, res) => {
	let query = {_id: req.params.reptile_id};
	Reptile.remove(query, err => {
		if (err) {
			console.log(err);
			req.flash('error', 'Errors encountered while deleting the reptile...');
			res.sendStatus(500);
			res.redirect('/dinodata/cage/'+req.params.reptile_id);
			return;
		}
		else { res.send('Success');	}
	});
})
// Handle get requests to the cage page with no ID supplied
router.get('/', ensureAuthenticated, async (req, res) => {
	let reptiles = await Reptile.find({owner_id: req.user._id}).exec();
	// If no reptile was found, create one, otherwise go to the reptile's page
	if(!reptiles) { createRedir(req, res); }
	else { cageRender(req,res, reptiles, 0); }
})
// Get a user's reptile and render the cage page
router.get('/:reptile_id', ensureAuthenticated, async (req, res) => {
	const reptiles = await Reptile.find({owner_id: req.user._id}).exec();
	// If the user had no reptiles, create one, otherwise render their page
	if (reptiles) renderReptile(req, res, reptiles);
	else createRedir(req, res); 
})


// Redirect the user to the reptile creation page
function createRedir(req, res) {
	req.flash('danger', "Please create a reptile.");
	res.render('ddnewreptile', { errors: req.session.errors });
	req.session.errors = null;
}
// Look through the reptiles for the requested one and render its page
function renderReptile(req, res, reptiles) {
	reptiles.forEach( (reptile, i) => {
		if (reptile._id.toString() === req.params.reptile_id) {
			cageRender(req, res, reptiles, i);
		}
	});
	// If the reptile was not found, render the first
 	cageRender(req, res, reptiles, 0);
}
// Render the cage page for the reptile at the given index
function cageRender(req, res, reptiles, index) {
	// Pass the errors into the page and clear them for the next request
	let errors = req.session.errors;
	req.session.errors = null;
	// Render the page with the selected reptile
	res.render('ddcage', {
		selected: reptiles[index],
		reptiles: reptiles,
		errors: errors
	});
}

// Capitalize first letter (for reptile name mostly)
function capitalize(name) {
	let str = name.split(" ");
	for (let i = 0; i < str.length; i++){
		str[i] = str[i][0].toUpperCase() + str[i].substr(1); }
	return str.join(" ");
};

// Prevent users from accessing the monitoring pages until they've logged in
function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) return next();
	else{
		req.flash('danger', "Please log in to view reptile information.");
		res.redirect('/dinodata/profile/login');
	}
}

module.exports = router;
