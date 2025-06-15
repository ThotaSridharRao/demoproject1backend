// routes/api/services.js

const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const auth = require('../../middleware/auth'); // Middleware for user authentication
const adminAuth = require('../../middleware/adminAuth'); // Middleware for admin authorization
const Service = require('../../models/Service'); // Import the Service model
const Vehicle = require('../../models/Vehicle'); // Import the Vehicle model (to check existence)
const User = require('../../models/User'); // Import the User model (to get customer name/phone if needed)


/**
 * @route   POST /api/services
 * @desc    Book a new service for the authenticated user
 * @access  Private (User)
 */
router.post(
    '/',
    [
        auth, // User must be authenticated
        [
            check('vehicleId', 'Vehicle ID is required').not().isEmpty(),
            check('date', 'Service date is required').isISO8601().toDate(), // YYYY-MM-DD format
            check('type', 'Service type is required').not().isEmpty(),
            // Cost, totalBill, partsUsed are initially 0 or empty for user booking
            check('cost', 'Cost must be a number').optional().isFloat({ min: 0 }),
            check('totalBill', 'Total Bill must be a number').optional().isFloat({ min: 0 })
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { vehicleId, date, type, description, cost = 0, totalBill = 0, partsUsed = [] } = req.body;

        try {
            // Verify that the vehicleId belongs to the authenticated user
            const vehicle = await Vehicle.findOne({ _id: vehicleId, userId: req.user.id });
            if (!vehicle) {
                return res.status(404).json({ msg: 'Vehicle not found or does not belong to user' });
            }

            // Get user's name and email for service record (customer info)
            const user = await User.findById(req.user.id).select('name email');
            if (!user) {
                return res.status(404).json({ msg: 'User not found' });
            }

            const newService = new Service({
                userId: req.user.id,
                vehicleId,
                date,
                type,
                description,
                cost,
                totalBill,
                partsUsed,
                customerName: user.name, // Pre-fill customer name from user profile
                customerPhone: '' // This will be updated by admin via admin panel, or user can add later if a profile update feature is built
            });

            const service = await newService.save();
            res.json({ msg: 'Service booked successfully!', service });

        } catch (err) {
            console.error(err.message);
            if (err.kind === 'ObjectId') {
                return res.status(400).json({ msg: 'Invalid Vehicle ID' });
            }
            res.status(500).send('Server Error');
        }
    }
);

/**
 * @route   GET /api/services
 * @desc    Get services (for user or admin)
 * If user: get only their services.
 * If admin: get all services.
 * Includes 'includePickedUp' query param for filtering by status.
 * @access  Private (User/Admin)
 */
router.get(
    '/',
    auth, // User must be authenticated
    async (req, res) => {
        try {
            let services;
            const includePickedUp = req.query.includePickedUp === 'true'; // Check query parameter

            if (req.user.isAdmin) {
                // Admin gets all services, with optional filtering for picked-up status
                let query = {};
                if (!includePickedUp) {
                    // If includePickedUp is false, filter out 'picked-up' services
                    query.type = { $ne: 'Picked Up' }; // Use $ne (not equal) operator
                }
                // Populate vehicleId to get make, model, licensePlate
                services = await Service.find(query).populate('vehicleId', ['make', 'model', 'licensePlate']).sort({ date: -1 });

            } else {
                // Regular user gets only their services
                services = await Service.find({ userId: req.user.id })
                    .populate('vehicleId', ['make', 'model', 'licensePlate']) // Populate vehicleId
                    .sort({ date: -1 }); // Sort by most recent first
            }

            // Manually add customerName/customerPhone to the response for user services
            // (Only for historical service entries where it might not have been stored initially in the service document)
            // In the POST route, we now store customerName and customerPhone directly in Service model.
            // This loop ensures older entries or direct updates are consistent.
            const formattedServices = await Promise.all(services.map(async service => {
                let customerName = service.customerName;
                let customerPhone = service.customerPhone;

                // Fallback: If customerName/customerPhone not directly on service, try to get from user
                // This is less efficient but covers cases where the service might not have this data initially
                if (!customerName || !customerPhone) {
                    const user = await User.findById(service.userId).select('name phone'); // Assuming 'phone' field exists on User
                    if (user) {
                        customerName = user.name || customerName;
                        // Assuming a 'phone' field on User model for user's primary contact
                        // If phone is not on User, it remains 'N/A' from the client.
                        // For the purpose of this demo, we'll assume a 'phone' field might exist on User
                        // For a real app, you'd likely have a dedicated customer profile.
                        customerPhone = user.phone || customerPhone; // Placeholder for now
                    }
                }

                // Return a new object with populated customer details
                return {
                    ...service.toObject(), // Convert Mongoose document to plain object
                    customerName,
                    customerPhone
                };
            }));

            res.json(formattedServices);

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

/**
 * @route   PATCH /api/services/:id/status
 * @desc    Update service status (Admin only)
 * @access  Private (Admin)
 */
router.patch(
    '/:id/status',
    [
        auth, // Authenticate user
        adminAuth, // Check if user is admin
        [
            check('status', 'Status is required').not().isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { status } = req.body;

        try {
            let service = await Service.findById(req.params.id);

            if (!service) {
                return res.status(404).json({ msg: 'Service not found' });
            }

            service.type = status; // Update the status field

            await service.save();
            res.json({ msg: 'Service status updated successfully!', service });

        } catch (err) {
            console.error(err.message);
            if (err.kind === 'ObjectId') {
                return res.status(404).json({ msg: 'Service not found' });
            }
            res.status(500).send('Server Error');
        }
    }
);

/**
 * @route   PUT /api/services/:id
 * @desc    Update full service details (Admin only)
 * @access  Private (Admin)
 */
router.put(
    '/:id',
    [
        auth, // Authenticate user
        adminAuth, // Check if user is admin
        [
            check('date', 'Service date is required').isISO8601().toDate(),
            check('type', 'Service type is required').not().isEmpty(),
            check('customerName', 'Customer Name is required').not().isEmpty(),
            check('customerPhone', 'Customer Phone is required').not().isEmpty(),
            check('cost', 'Cost must be a number').optional().isFloat({ min: 0 }),
            check('totalBill', 'Total Bill must be a number').optional().isFloat({ min: 0 })
            // partsUsed is optional and can be an empty array
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { date, type, description, cost, totalBill, partsUsed, customerName, customerPhone } = req.body;

        // Build serviceFields object based on provided data
        const serviceFields = {};
        if (date) serviceFields.date = date;
        if (type) serviceFields.type = type;
        if (description !== undefined) serviceFields.description = description; // Allow empty description
        if (cost !== undefined) serviceFields.cost = cost;
        if (totalBill !== undefined) serviceFields.totalBill = totalBill;
        if (partsUsed !== undefined) serviceFields.partsUsed = partsUsed; // partsUsed can be an empty array
        if (customerName) serviceFields.customerName = customerName;
        if (customerPhone) serviceFields.customerPhone = customerPhone;


        try {
            let service = await Service.findById(req.params.id);

            if (!service) {
                return res.status(404).json({ msg: 'Service not found' });
            }

            // Update and save the service
            service = await Service.findByIdAndUpdate(
                req.params.id,
                { $set: serviceFields },
                { new: true } // Return the updated document
            );

            res.json({ msg: 'Service details updated successfully!', service });

        } catch (err) {
            console.error(err.message);
            if (err.kind === 'ObjectId') {
                return res.status(404).json({ msg: 'Service not found' });
            }
            res.status(500).send('Server Error');
        }
    }
);


/**
 * @route   DELETE /api/services/:id
 * @desc    Delete a service (Admin only)
 * @access  Private (Admin)
 */
router.delete(
    '/:id',
    [auth, adminAuth], // Authenticate and check for admin role
    async (req, res) => {
        try {
            const service = await Service.findByIdAndDelete(req.params.id);

            if (!service) {
                return res.status(404).json({ msg: 'Service not found' });
            }

            res.json({ msg: 'Service removed successfully!' });

        } catch (err) {
            console.error(err.message);
            if (err.kind === 'ObjectId') {
                return res.status(404).json({ msg: 'Service not found' });
            }
            res.status(500).send('Server Error');
        }
    }
);


module.exports = router;
