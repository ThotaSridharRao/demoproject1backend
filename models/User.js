// models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Import bcryptjs for password hashing

// Define the User Schema
const UserSchema = new mongoose.Schema({
    // User's name
    name: {
        type: String,
        required: true, // Name is a mandatory field
        trim: true // Remove whitespace from both ends of a string
    },
    // User's email address
    email: {
        type: String,
        required: true, // Email is a mandatory field
        unique: true, // Ensures that each email is unique in the database
        trim: true, // Remove whitespace
        lowercase: true, // Store emails in lowercase to prevent duplicate entries with different casing
        // Basic email validation regex
        match: [/.+\@.+\..+/, 'Please fill a valid email address']
    },
    // User's password (will be hashed before saving)
    password: {
        type: String,
        required: true // Password is a mandatory field
    },
    // Role for access control: true for admin, false for regular user
    isAdmin: {
        type: Boolean,
        default: false // Default to false (not an admin)
    },
    // Timestamp for when the user account was created
    date: {
        type: Date,
        default: Date.now // Sets the default value to the current date/time
    }
}, {
    timestamps: true // Adds `createdAt` and `updatedAt` fields automatically
});

// Mongoose pre-save hook: Hash the password before saving the user document
// 'this' refers to the document being saved
UserSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next(); // If password hasn't changed, move to the next middleware
    }

    // Generate a salt (a random string to make the hash unique)
    const salt = await bcrypt.genSalt(10); // 10 is the number of rounds for hashing, more rounds = more secure but slower

    // Hash the password using the generated salt
    this.password = await bcrypt.hash(this.password, salt);

    next(); // Move to the next middleware (which will be saving the document)
});

// Mongoose method: Compare the entered password with the hashed password in the database
UserSchema.methods.matchPassword = async function(enteredPassword) {
    // Use bcrypt.compare to compare the plain text password with the hashed one
    // 'this.password' refers to the hashed password stored in the database
    return await bcrypt.compare(enteredPassword, this.password);
};

// Export the User model based on the schema
// 'User' will be the name of the collection in MongoDB (it will be pluralized to 'users')
module.exports = mongoose.model('User', UserSchema);
