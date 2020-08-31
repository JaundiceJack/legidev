const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Bring in the reading model
const Reading = require('../models/reading');
// Bring in the reptile model
const Reptile = require('../models/reptile');

// Cage Graph Data Requests
router.get('/:reptile_id', ensureAuthenticated, (req, res) => {
	Reading.find({reptile_id: req.params.reptile_id})
	.sort('date')
	.exec( (err, readings) => {
		if (err) console.log(err);
		res.json(readings);
	});
});

// Cage Data Post Route
router.post('/:reptile_id', ensureAuthenticated,
  [
    body('date').isISO8601(),
    body('coldest').notEmpty(),
    body('coldest').isFloat(),
    body('warmest').notEmpty(),
    body('warmest').isFloat(),
    body('humidity').notEmpty(),
    body('humidity').isFloat({min: 0, max: 100}),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
    // Create a new reading if no errors were found
    else {
      const query = {_id: req.params.reptile_id, owner_id: req.user._id};
    	let reptile = await Reptile.findOne(query).exec();
      if (!reptile) {
    		req.flash('error', "The reptile you're attempting to update was not found.");
    		res.redirect(req.header('Referer'));
    	}
      let reading = new Reading({
          reptile_id: reptile._id,
        	date: req.body.date,
        	warmest: req.body.warmest,
        	coldest: req.body.coldest,
        	humidity: req.body.humidity,
          grossness: req.body.hygiene
      });
    	createReading(req, res, reading);
    }
  }
);


async function createReading(req, res, reading) {
	// Look for duplicate readings for the date and time
  const query = { reptile_id: reading.reptile_id, date: reading.date };
	let duplicate = await Reading.findOne(query).exec();
	// If the entry already exists, update the entry with the new readings
	if (duplicate) updateEntry(req, res, reading, duplicate);
	// Otherwise, create a new reading and save it
	else saveEntry(req, res, reading);
};

// Take an existing reading (entry) and update it with the given data
function updateEntry(req, res, reading, duplicate) {
	duplicate.warmest = reading.warmest;
	duplicate.coldest = reading.coldest;
	duplicate.humidity = reading.humidity;
  duplicate.grossness = reading.grossness;
	duplicate.save( err => {
		if (err) {
			console.log(err);
			req.flash('error', 'Errors encountered while overwriting entry...');
			res.redirect('/dinodata/cage/'+reading.reptile_id);
			return;
		}
		else {
			req.flash('success', "Reading charted.");
			res.redirect('/dinodata/cage/'+reading.reptile_id);
		}
	});
}
// Create a new reading from the data
function saveEntry (req, res, reading) {
	// Save the reading, inform of failure or success
	reading.save( err => {
		if (err) {
			console.log(err);
			req.flash('error', 'Errors encountered while saving entries...');
			res.redirect('/dinodata/cage/'+reading.reptile_id);
			return;
			}
		else {
			req.flash('success', "Reading charted.");
			res.redirect('/dinodata/cage/'+reading.reptile_id);
		}
	});
}

// Prevent users from accessing the monitoring pages until they've logged in
function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) return next();
	else{
		req.flash('danger', "Please log in to view reptile information.");
		res.redirect('/dinodata/profile/login');
	}
}

module.exports = router;
