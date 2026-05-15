const express = require('express');
const mongoose = require('mongoose');
const { protect } = require('./auth');

const router = express.Router();

const CourseSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    instructor: { type: String, trim: true },
    color: { type: String, default: '#3498db' },
    createdAt: { type: Date, default: Date.now }
});

const Course = mongoose.model('Course', CourseSchema);

router.get('/', protect, async (req, res) => {
    try {
        const courses = await Course.find({ user: req.user.id });
        res.json({ success: true, courses });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/', protect, async (req, res) => {
    try {
        const course = await Course.create({ ...req.body, user: req.user.id });
        res.status(201).json({ success: true, course });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put('/:id', protect, async (req, res) => {
    try {
        const course = await Course.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        res.json({ success: true, course });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete('/:id', protect, async (req, res) => {
    try {
        const course = await Course.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        res.json({ success: true, message: 'Course deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;