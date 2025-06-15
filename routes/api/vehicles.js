// routes/api/vehicles.js

const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const auth = require('../../middleware/auth'); // Middleware for user authentication
const User = require('../../models/User'); // User model (for potential lookup, though less direct use here)
const Vehicle = require('../../models/Vehicle'); // Import the Vehicle model

/**
 * @route   POST /api/vehicles
 * @desc    Add a new vehicle for the authenticated user
 * @access  Private
 */
router.post(
    '/',
    [
        auth, // Apply authentication middleware
        [
            // Input validation
            check('make', 'Make is required').not().isEmpty(),
            check('model', 'Model is required').not().isEmpty(),
            check('year', 'Year must be a valid number between 1900 and 2099').isInt({ min: 1900, max: 2099 }),
            check('licensePlate', 'License Plate is required').not().isEmpty()
        ]
    ],
    async (req, res) => {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { make, model, year, licensePlate } = req.body;

        try {
            // Check if a vehicle with the same license plate already exists for this user
            const existingVehicle = await Vehicle.findOne({ userId: req.user.id, licensePlate: licensePlate.toUpperCase() });
            if (existingVehicle) {
                return res.status(400).json({ msg: 'Vehicle with this license plate already added.' });
            }

            // Create a new Vehicle instance
            const newVehicle = new Vehicle({
                userId: req.user.id, // Associate the vehicle with the authenticated user
                make,
                model,
                year,
                licensePlate: licensePlate.toUpperCase() // Store license plate in uppercase for consistency
            });

            // Save the vehicle to the database
            const vehicle = await newVehicle.save();

            res.json({ msg: 'Vehicle added successfully!', vehicle });

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

/**
 * @route   GET /api/vehicles
 * @desc    Get all vehicles for the authenticated user
 * @access  Private
 */
router.get(
    '/',
    auth, // Apply authentication middleware
    async (req, res) => {
        try {
            // Find all vehicles associated with the authenticated user's ID
            const vehicles = await Vehicle.find({ userId: req.user.id }).sort({ date: -1 }); // Sort by most recent first
            res.json(vehicles);

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

/**
 * @route   DELETE /api/vehicles/:id
 * @desc    Delete a vehicle by ID for the authenticated user
 * @access  Private
 */
router.delete(
    '/:id',
    auth, // Apply authentication middleware
    async (req, res) => {
        try {
            // Find the vehicle by ID and ensure it belongs to the authenticated user
            const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

            if (!vehicle) {
                return res.status(404).json({ msg: 'Vehicle not found or user not authorized' });
            }

            res.json({ msg: 'Vehicle removed successfully!' });

        } catch (err) {
            console.error(err.message);
            // Handle CastError if ID is not a valid MongoDB ObjectId
            if (err.kind === 'ObjectId') {
                return res.status(404).json({ msg: 'Vehicle not found' });
            }
            res.status(500).send('Server Error');
        }
    }
);

module.exports = router;
