// models/Service.js

const mongoose = require('mongoose');

// Define the Service Schema
const ServiceSchema = new mongoose.Schema({
    // Reference to the User who booked this service
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Reference to the Vehicle that is being serviced
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle', // Specifies that it refers to the 'Vehicle' model
        required: true
    },
    // Date of the service appointment
    date: {
        type: Date,
        required: true
    },
    // Type of service (e.g., "Oil Change", "Brake Inspection", "Pending", "In Progress", "Completed")
    type: {
        type: String,
        required: true,
        enum: [
            'Oil Change',
            'Tire Rotation',
            'Brake Inspection',
            'Engine Diagnostic',
            'Fluid Check',
            'Other',
            'Pending',           // Status when booked by user
            'In Progress',       // Status when service is ongoing
            'Completed',         // Status after service is done, before pickup
            'Ready for Pickup',  // Status when vehicle is ready
            'Picked Up',         // Status when customer has taken the vehicle
            'Cancelled'          // Status if service is cancelled
        ],
        default: 'Pending', // Default status for a newly booked service
        trim: true
    },
    // Detailed description of the service issue or work performed
    description: {
        type: String,
        trim: true,
        default: '' // Can be empty if not provided
    },
    // Estimated cost of the service (can be updated by admin)
    cost: {
        type: Number,
        default: 0,
        min: 0
    },
    // Total bill after service and parts (updated by admin)
    totalBill: {
        type: Number,
        default: 0,
        min: 0
    },
    // Array of parts used for the service
    partsUsed: [
        {
            partName: {
                type: String,
                required: true,
                trim: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            unitCost: {
                type: Number,
                required: true,
                min: 0
            }
        }
    ],
    // Customer name (can be pre-filled from user profile or manually entered by admin)
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    // Customer phone number (can be pre-filled from user profile or manually entered by admin)
    customerPhone: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true // Automatically adds `createdAt` and `updatedAt` fields
});

// Export the Service model based on the schema
// 'Service' will be the name of the collection in MongoDB (it will be pluralized to 'services')
module.exports = mongoose.model('Service', ServiceSchema);
