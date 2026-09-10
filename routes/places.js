const express = require('express');
const { getPlaces } = require('../controllers/placeController');

const router = express.Router();

router.get('/api/places', getPlaces);
router.get('/', getPlaces);

module.exports = router;
