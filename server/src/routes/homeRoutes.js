const express = require('express');
const router = express.Router();
const {
    getHomeData,
    getSubCategories,
    getServiceListing,
    getServiceDetailById,
    getServiceCategories,
    getSubCategoriesById,
    getServiceListingById,
    search
} = require('../controllers/homeController');
const { getVendorsForService, getVendorProfile } = require('../controllers/vendorListingController');

router.get('/', getHomeData);
router.get('/search', search);
router.get('/services/categories', getServiceCategories);

// Level 2: Get Subcategories for a Category
router.get('/subcategories/:slug', getSubCategories);
router.get('/subcategories/by-id/:categoryId', getSubCategoriesById); // New for registration

// Level 3: Get Service Items (Listing) for a Subcategory
router.get('/listing/:slug', getServiceListing);
router.get('/listing/by-id/:subCategoryId', getServiceListingById); // New for registration

// Specific Item Detail
router.get('/service/:id', getServiceDetailById);

// Vendor Listing (for booking screen) — public route, no auth required
router.get('/vendors', getVendorsForService);
router.get('/vendors/:id', getVendorProfile);

module.exports = router;
