const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminServiceController = require('../controllers/adminServiceController');
const adminRequestController = require('../controllers/adminRequestController');
const ratingController = require('../controllers/ratingController');
const adminMiddleware = require('../middleware/adminMiddleware');

// All admin routes require admin authentication
router.use(adminMiddleware);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// User Management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserDetails);
router.put('/users/:id', adminController.updateUser);
router.patch('/users/:id/toggle-status', adminController.toggleUserStatus);

// Booking Management
router.get('/bookings', adminController.getAllBookings);
router.put('/bookings/:id', adminController.updateBookingStatus);

// Professional Management
router.get('/professionals', adminController.getAllProfessionals);
router.post('/professionals', adminController.createProfessional);
router.put('/professionals/:id', adminController.updateProfessional);
router.delete('/professionals/:id', adminController.deleteProfessional);

// Service Category Management
router.get('/services/categories', adminController.getAllServiceCategories);
router.post('/services/categories', adminController.createServiceCategory);
router.put('/services/categories/:id', adminController.updateServiceCategory);
router.delete('/services/categories/:id', adminController.deleteServiceCategory);

// Sub-Category Management (Level 2)
router.get('/services/subcategories/:categoryId', adminServiceController.getSubCategories);
router.post('/services/subcategories', adminServiceController.createSubCategory);
router.put('/services/subcategories/:id', adminServiceController.updateSubCategory);
router.delete('/services/subcategories/:id', adminServiceController.deleteSubCategory);

// Service Item Management
router.get('/services/categories/:categoryId/items', adminController.getServiceItems);
router.get('/services/listing/:subCategoryId', adminServiceController.getServiceListing);
router.post('/services/categories/:categoryId/items', adminController.createServiceItem);
router.post('/services/items', adminServiceController.createServiceItem);
router.put('/services/items/:id', adminController.updateServiceItem);
router.delete('/services/items/:id', adminController.deleteServiceItem);

// Vendor Management Routes
router.get('/vendors/pending', adminController.getPendingVendors);
router.get('/vendors', adminController.getAllVendors);
router.put('/vendors/:id/approve', adminController.approveVendor);
router.put('/vendors/:id/reject', adminController.rejectVendor);
router.patch('/vendors/:id/toggle-status', adminController.toggleVendorStatus);
router.post('/services/assign-vendor', adminController.assignServiceToVendor);

// Vendor Service Pricing Management (Admin)
router.get('/vendors/:id/service-pricing', adminController.getVendorServicePricing);
router.put('/vendors/:id/service-pricing', adminController.updateVendorServicePricing);

// Payment Management
router.get('/payments', adminController.getAllPayments);

// Others Category (Admin Service Requests) Management
router.get('/others-requests', adminRequestController.getAllAdminRequests);
router.get('/others-requests/count', adminRequestController.getOthersRequestsCount);
router.get('/others-requests/:id', adminRequestController.getAdminRequest);
router.put('/others-requests/:id', adminRequestController.updateAdminRequest);

// Offers / Ads / Job Openings Management
const offersController = require('../controllers/offersController');
router.get('/offers', offersController.getAllOffers);
router.post('/offers', offersController.createOffer);
router.put('/offers/:id', offersController.updateOffer);
router.delete('/offers/:id', offersController.deleteOffer);

// Reports Management
router.get('/reports', ratingController.getAllReports);
router.put('/reports/:id', ratingController.updateReportStatus);

module.exports = router;
