const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGO_URI = 'mongodb+srv://planoraDB:%26123456@planora.w12us6l.mongodb.net/planora?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Atlas connected successfully'))
    .catch(err => console.error('❌ MongoDB Atlas connection error:', err));

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});