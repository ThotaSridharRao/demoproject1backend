// server.js

// 1. Load environment variables from .env file
// This line should always be at the very top of your main application file
require('dotenv').config();

// Import necessary modules
const express = require('express');
const connectDB = require('./config/db'); // Assuming db.js is in a 'config' folder
const cors = require('cors'); // For handling Cross-Origin Resource Sharing

// Initialize the Express application
const app = express();

// 2. Connect Database
// Call the function to establish connection to MongoDB
connectDB();

// 3. Initialize Middleware
// express.json() allows us to accept JSON data in the request body
app.use(express.json({ extended: false }));

// Enable CORS for all routes
// This is crucial for your frontend (running on a different port/domain)
// to make requests to your backend without security errors.
app.use(cors());

// 4. Define a simple test route
// This is a basic GET endpoint to confirm your API is running
app.get('/', (req, res) => {
    res.send('Maosaji Honda Backend API is Running!');
});

// 5. Define Routes
// These lines import and use the route files you've created.
// The first argument is the base path for these routes.
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/vehicles', require('./routes/api/vehicles'));
app.use('/api/services', require('./routes/api/services'));

// Set the port for the server to listen on
// It will use the PORT environment variable if available (e.g., on Render),
// otherwise, it will default to 5000.
const PORT = process.env.PORT || 5000;

// 6. Start the server
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    console.log('--- Backend ready for requests ---');
});
