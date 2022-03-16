const jwt = require('jsonwebtoken');
const trycatch = require('express-async-handler')
const User = require('../models/User.js');

// Enable protected routes that must be logged in to access
const private = trycatch( async (req, res, next) => {
  let token;
  // Check for the token header
  if (req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')) {
    // Put the user info in the protected route if they have the token
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    }
    // Kick the user out if the token expires/clears
    catch (e) {
      res.status(401);
      throw new Error("Authorization failed.")
    }
  }
  if (!token) {
    res.status(401);
    throw new Error("Session has expired.");
  }
})

module.exports = private;
