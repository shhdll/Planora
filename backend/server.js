const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Check if MONGO_URI is defined
if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in .env file');
    console.error('Please create a .env file with your MongoDB connection string');
    process.exit(1);
}

// MongoDB connection - Use environment variable, NOT hardcoded!
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Atlas connected successfully'))
    .catch(err => console.error('❌ MongoDB Atlas connection error:', err.message));

// Import routes
const auth = require('./features/auth');
const courses = require('./features/courses');
const deadlines = require('./features/deadlines');
const availability = require('./features/availability');
const studyplan = require('./features/studyplan');

// Use routes
app.use('/api/auth', auth);
app.use('/api/courses', courses);
app.use('/api/deadlines', deadlines);
app.use('/api/availability', availability);
app.use('/api/studyplan', studyplan);

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Planora API is running 🚀' });
});

// 404 handler for undefined routes
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: `Route ${req.method} ${req.url} not found` 
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
});