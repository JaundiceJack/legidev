// Load in dependancies
const express = require('express');
const path = require('path');

// Instance the app/page and show it where to find the css/html/js
const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));

// Display the home page when requested
app.get('/', (req, res) => {
	res.render('index', {});
});

// Route to Dino-Data
let dinodata = require('./routes/dinodata');
app.use('/dinodata', dinodata);

// Start the app on port 80
const port = 8080;
app.listen(port, () => {
	console.log("Express started on port:"+port);
})
