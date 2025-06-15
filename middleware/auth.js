// middleware/auth.js

const jwt = require('jsonwebtoken');

// Load JWT Secret from environment variables
// This MUST match the JWT_SECRET in your .env file
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in auth middleware. Please set it in your .env file.');
    // In a real application, you might want a more graceful error handling or logging
    // For now, we'll just exit the process as the app cannot function without it securely.
    process.exit(1);
}

// Middleware function to protect routes
module.exports = function(req, res, next) {
    // Get token from header
    // The token is expected in a header like: x-auth-token: <token>
    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
        // 401 Unauthorized status
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        // Verify token
        // jwt.verify takes the token and the secret
        const decoded = jwt.verify(token, jwtSecret);

        // Attach the decoded user payload to the request object
        // This makes user data (like id, name, isAdmin) available in route handlers
        req.user = decoded.user; // 'user' is the key we used in the JWT payload in auth.js route
        next(); // Move to the next middleware/route handler

    } catch (err) {
        // If token is not valid (e.g., expired, malformed)
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
