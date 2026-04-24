const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require user authentication
router.use(authMiddleware);

// Rating & Feedback
router.post('/', ratingController.submitRating);
router.get('/booking/:bookingId', ratingController.getBookingRating);

// Report a user/vendor
router.post('/report', ratingController.submitReport);

module.exports = router;
