// server.js

// 1. Load environment variables from .env file
require('dotenv').config();

// Import necessary modules
const express = require('express');
const connectDB = require('./config/db'); // Assuming db.js is in a 'config' folder
const cors = require('cors'); // For handling Cross-Origin Resource Sharing

// Initialize the Express application
const app = express();

// 2. Connect Database
connectDB();

// 3. Initialize Middleware
app.use(express.json({ extended: false }));

// 4. CORS Configuration (IMPORTANT for frontend communication)
// Define the specific origins (frontend URLs) that are allowed to access your backend.
// Replace 'https://demoproject-snz9.onrender.com' with your actual deployed frontend URL.
// If you have multiple frontend URLs (e.g., development, staging), add them to this array.
const allowedOrigins = [
    'https://demoproject-snz9.onrender.com',
    // Add other allowed origins here if you have them, e.g., 'http://localhost:3000' for local frontend dev
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl requests, or same-origin requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Specify allowed HTTP methods
    credentials: true, // Allow cookies to be sent
}));


// 5. Define a simple test route
app.get('/', (req, res) => {
    res.send('Maosaji Honda Backend API is Running!');
});

// 6. Define Routes
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/vehicles', require('./routes/api/vehicles'));
app.use('/api/services', require('./routes/api/services'));

// Set the port for the server to listen on
const PORT = process.env.PORT || 5000;

// 7. Start the server
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    console.log('--- Backend ready for requests ---');
});
