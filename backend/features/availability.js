const express = require('express');
const mongoose = require('mongoose');
const { protect } = require('./auth');

const router = express.Router();

const AvailabilitySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Availability = mongoose.model('Availability', AvailabilitySchema);

router.get('/', protect, async (req, res) => {
    try {
        const availability = await Availability.find({ user: req.user.id });
        res.json({ success: true, availability });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/', protect, async (req, res) => {
    try {
        const availability = await Availability.create({ ...req.body, user: req.user.id });
        res.status(201).json({ success: true, availability });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete('/:id', protect, async (req, res) => {
    try {
        const availability = await Availability.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!availability) {
            return res.status(404).json({ success: false, message: 'Availability not found' });
        }
        res.json({ success: true, message: 'Availability deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;