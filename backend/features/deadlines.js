const express = require('express');
const mongoose = require('mongoose');
const { protect } = require('./auth');

const router = express.Router();

const DeadlineSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    date: { type: Date, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Deadline = mongoose.model('Deadline', DeadlineSchema);

router.get('/', protect, async (req, res) => {
    try {
        const deadlines = await Deadline.find({ user: req.user.id }).populate('course', 'name');
        res.json({ success: true, deadlines });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/', protect, async (req, res) => {
    try {
        const deadline = await Deadline.create({ ...req.body, user: req.user.id });
        res.status(201).json({ success: true, deadline });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put('/:id', protect, async (req, res) => {
    try {
        const deadline = await Deadline.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!deadline) {
            return res.status(404).json({ success: false, message: 'Deadline not found' });
        }
        res.json({ success: true, deadline });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete('/:id', protect, async (req, res) => {
    try {
        const deadline = await Deadline.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!deadline) {
            return res.status(404).json({ success: false, message: 'Deadline not found' });
        }
        res.json({ success: true, message: 'Deadline deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;