const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
//const connect = require('./db/connection.js');
const path = require('path');
const { notFound, errorFound } = require('./middleware/errorMW.js')
dotenv.config();

// Instance the app server and use the internal body parser
const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Instance a mongoDB connection
//connect();

// Define Routes
app.get('/', (req, res) => { res.render('index', {}); });
//app.use('/api/users', require('./routes/paths/users.js'));
// Define a route to ensure the server is functioning
app.get('/ping', (req, res) => { return res.send('pong'); });

// Error handling middleware
app.use(notFound);
app.use(errorFound);

// Start the server on the assigned port
const port = process.env.PORT || 5000;
app.listen(port, () => { console.log(`Server started on port ${port}`); });
