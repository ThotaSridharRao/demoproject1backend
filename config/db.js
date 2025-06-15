// config/db.js

const mongoose = require('mongoose');

// The function to connect to the MongoDB database
const connectDB = async () => {
    try {
        // Attempt to connect to MongoDB using the URI from environment variables
        // The URI is expected to be in your .env file
        await mongoose.connect(process.env.MONGO_URI, {
            // useNewUrlParser and useUnifiedTopology are recommended options
            // for compatibility with the new MongoDB driver parsing and connection management
            useNewUrlParser: true,
            useUnifiedTopology: true,
            // useCreateIndex and useFindAndModify are no longer needed in Mongoose 6+
            // If you are using an older version of Mongoose, you might need to uncomment them.
            // useCreateIndex: true,
            // useFindAndModify: false
        });

        console.log('MongoDB Connected...'); // Log success message
    } catch (err) {
        // If connection fails, log the error message
        console.error(err.message);
        // Exit process with failure (1) if the connection is not established
        process.exit(1);
    }
};

// Export the connectDB function so it can be imported and called in server.js
module.exports = connectDB;
