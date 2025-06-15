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

const allowedOrigins = [
    'https://demoproject-snz9.onrender.com', // Your deployed frontend URL
    // You can add other origins here if needed, e.g., 'http://localhost:3000' for local frontend development
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl requests, or same-origin requests)
        // This is important for some server-to-server or direct requests.
        if (!origin) return callback(null, true);

        // Check if the requesting origin is in our allowed list
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Explicitly allow necessary methods
    credentials: true, // Allow cookies, authorization headers, etc. (if your app uses them)
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
