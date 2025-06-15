// routes/api/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // For password hashing and comparison
const jwt = require('jsonwebtoken'); // For generating JSON Web Tokens
const { check, validationResult } = require('express-validator'); // For input validation

const User = require('../../models/User'); // Import the User model

// Load JWT Secret from environment variables
// Ensure you have JWT_SECRET defined in your .env file
// Example: JWT_SECRET=your_super_secret_jwt_key
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    console.error('FATAL ERROR: JWT_SECRET is not defined. Please set it in your .env file.');
    process.exit(1); // Exit if secret is not set, as it's critical for security
}

/**
 * @route   POST /api/auth/register
 * @desc    Register user
 * @access  Public
 */
router.post(
    '/register',
    [
        // Input validation using express-validator
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check(
            'password',
            'Please enter a password with 6 or more characters'
        ).isLength({ min: 6 })
    ],
    async (req, res) => {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        try {
            // Check if user already exists
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ msg: 'User already exists' });
            }

            // Create a new User instance
            user = new User({
                name,
                email,
                password // Password will be hashed automatically by the pre-save hook in User.js
            });

            // Save the user to the database
            await user.save();

            // Create JWT payload
            const payload = {
                user: {
                    id: user.id, // MongoDB's _id is automatically converted to 'id' by Mongoose
                    name: user.name,
                    isAdmin: user.isAdmin
                }
            };

            // Sign the JWT
            jwt.sign(
                payload,
                jwtSecret,
                { expiresIn: '1h' }, // Token expires in 1 hour
                (err, token) => {
                    if (err) throw err;
                    res.json({ msg: 'User registered successfully!', token }); // Send token back to client
                }
            );

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post(
    '/login',
    [
        // Input validation
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ],
    async (req, res) => {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            // Check if user exists
            let user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ msg: 'Invalid Credentials' });
            }

            // Compare password using the method defined in User.js
            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Invalid Credentials' });
            }

            // Create JWT payload
            const payload = {
                user: {
                    id: user.id,
                    name: user.name,
                    isAdmin: user.isAdmin
                }
            };

            // Sign the JWT
            jwt.sign(
                payload,
                jwtSecret,
                { expiresIn: '1h' }, // Token expires in 1 hour
                (err, token) => {
                    if (err) throw err;
                    res.json({ msg: 'Logged in successfully!', token }); // Send token back to client
                }
            );

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

module.exports = router;
