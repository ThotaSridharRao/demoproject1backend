// models/Vehicle.js

const mongoose = require('mongoose');

// Define the Vehicle Schema
const VehicleSchema = new mongoose.Schema({
    // Reference to the User who owns this vehicle
    userId: {
        type: mongoose.Schema.Types.ObjectId, // Defines this field as an ObjectId
        ref: 'User', // Specifies that it refers to the 'User' model
        required: true // A vehicle must be associated with a user
    },
    // Vehicle make (e.g., "Honda", "Yamaha")
    make: {
        type: String,
        required: true,
        trim: true
    },
    // Vehicle model (e.g., "Activa 6G", "CB Hornet 160R")
    model: {
        type: String,
        required: true,
        trim: true
    },
    // Manufacturing year of the vehicle
    year: {
        type: Number,
        required: true,
        min: 1900, // Reasonable minimum year
        max: new Date().getFullYear() + 5 // Allows for future models, up to 5 years from current
    },
    // Vehicle's unique license plate number
    licensePlate: {
        type: String,
        required: true,
        unique: true, // Each license plate should be unique across all vehicles
        trim: true,
        uppercase: true // Store license plate in uppercase for consistency
    },
    // Date when the vehicle was added to the system
    dateAdded: {
        type: Date,
        default: Date.now // Defaults to the current date/time
    }
}, {
    timestamps: true // Automatically adds `createdAt` and `updatedAt` fields
});

// Export the Vehicle model based on the schema
// 'Vehicle' will be the name of the collection in MongoDB (it will be pluralized to 'vehicles')
module.exports = mongoose.model('Vehicle', VehicleSchema);
