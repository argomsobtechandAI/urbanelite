const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    getUserProfile, updateProfile,
    getUserWallet, topupWallet, getWalletTransactions,
    getUserBookings,
    getAddresses, addAddress, deleteAddress,
    getPaymentMethods, addPaymentMethod, deletePaymentMethod,
    getNotificationSettings, updateNotificationSettings,
    deleteAccount
} = require('../controllers/userController');
const {
    getUserNotifications,
    markNotificationsRead,
    getUnreadCount
} = require('../controllers/notificationsController');

console.log('User Routes loaded'); // DEBUG



// Apply auth middleware to all routes
router.use(authMiddleware);

// Profile
router.get('/profile', getUserProfile);
router.put('/profile', updateProfile);
router.delete('/delete-account', deleteAccount);


// Wallet
router.get('/wallet', getUserWallet);
router.post('/wallet/topup', topupWallet);
router.get('/wallet/transactions', getWalletTransactions);

// Bookings
router.get('/bookings', getUserBookings);

// Addresses
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.delete('/addresses/:id', deleteAddress);

// Payment Methods
router.get('/payment-methods', getPaymentMethods);
router.post('/payment-methods', addPaymentMethod);
router.delete('/payment-methods/:id', deletePaymentMethod);

// Notifications
router.get('/notifications/settings', (req, res, next) => { console.log('Hit /notifications/settings'); next(); }, getNotificationSettings);
router.put('/notifications/settings', updateNotificationSettings);
router.get('/notifications/unread-count', (req, res, next) => { console.log('Hit /notifications/unread-count'); next(); }, getUnreadCount);
router.post('/notifications/mark-read', markNotificationsRead);
router.get('/notifications', getUserNotifications);



module.exports = router;
