const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');

// GET all activities (latest first, limit to 50)
router.get('/', async (req, res) => {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 }).limit(50);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
