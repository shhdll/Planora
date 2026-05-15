const express = require('express');
const mongoose = require('mongoose');
const { protect } = require('./auth');

const router = express.Router();

const StudyPlanSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    date: { type: String, required: true }, // "2024-01-15"
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: { type: String, enum: ['pending', 'completed', 'missed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const StudyPlan = mongoose.model('StudyPlan', StudyPlanSchema);

router.get('/', protect, async (req, res) => {
    try {
        const studyPlan = await StudyPlan.find({ user: req.user.id }).populate('course', 'name');
        res.json({ success: true, studyPlan });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/', protect, async (req, res) => {
    try {
        const studyPlan = await StudyPlan.create({ ...req.body, user: req.user.id });
        res.status(201).json({ success: true, studyPlan });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put('/:id', protect, async (req, res) => {
    try {
        const studyPlan = await StudyPlan.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            req.body,
            { new: true }
        );
        res.json({ success: true, studyPlan });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete('/:id', protect, async (req, res) => {
    try {
        await StudyPlan.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        res.json({ success: true, message: 'Study session deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;