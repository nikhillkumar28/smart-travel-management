const express = require('express');
const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user.id })
      .select('destination days budget interests createdAt updatedAt')
      .sort({ createdAt: -1 });
    return res.json({ trips });
  } catch (err) {
    return res.status(500).json({ message: 'Unable to load trips' });
  }
});

router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid trip id' });
  }

  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    return res.json({ trip });
  } catch (err) {
    return res.status(500).json({ message: 'Unable to load trip' });
  }
});

router.delete('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid trip id' });
  }

  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ message: 'Unable to delete trip' });
  }
});

module.exports = router;
