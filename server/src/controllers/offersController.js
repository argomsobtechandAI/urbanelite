const supabase = require('../config/database');
const { createOfferNotification } = require('./notificationsController');

// Get all active offers
exports.getOffers = async (req, res) => {
    try {
        const { data: offers, error } = await supabase
            .from('offers')
            .select('*, vendor:users!offers_vendor_id_fkey(business_name, business_address)') // Join vendor details
            .eq('status', 'ACTIVE')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: offers || []
        });
    } catch (error) {
        console.error('Error fetching offers:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch offers'
        });
    }
};

// Create a new offer
exports.createOffer = async (req, res) => {
    try {
        const { title, description, discountAmount, discountCode, serviceId, validUntil, imageUrl, mediaUrls, type } = req.body;
        const userId = req.user.id;
        const role = req.user.role;

        // Only VENDOR or ADMIN can create offers
        if (role !== 'VENDOR' && role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized'
            });
        }

        const offerType = type || 'PROMOTION';
        const offerData = {
            title,
            description,
            discount_amount: discountAmount,
            discount_code: discountCode || null,
            service_id: serviceId || null,
            vendor_id: role === 'VENDOR' ? userId : null,
            valid_until: validUntil || null,
            image_url: imageUrl || (mediaUrls && mediaUrls[0]) || null,
            media_urls: mediaUrls || [],
            status: 'ACTIVE',
            type: offerType
        };

        const { data: offer, error } = await supabase
            .from('offers')
            .insert(offerData)
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', JSON.stringify(error));
            throw error;
        }

        // Notify users about the new offer/job (non-blocking)
        try {
            createOfferNotification({
                offerId: offer.id,
                vendorId: role === 'VENDOR' ? userId : null,
                type: offerType,
                title,
                description,
                discountAmount,
            });
        } catch (notifErr) {
            console.error('Notification error (non-fatal):', notifErr.message);
        }

        res.status(201).json({
            success: true,
            message: `${offerType === 'JOB' ? 'Job offer' : 'Offer'} created successfully`,
            data: offer
        });

    } catch (error) {
        console.error('Error creating offer:', error);
        const offerType = req.body?.type || 'PROMOTION';
        res.status(500).json({
            success: false,
            error: `Failed to create ${offerType === 'JOB' ? 'job offer' : 'offer'}`,
            detail: error.message
        });
    }
};

// Get Vendor's own offers
exports.getVendorOffers = async (req, res) => {
    try {
        const vendorId = req.user.id;

        const { data: offers, error } = await supabase
            .from('offers')
            .select('*')
            .eq('vendor_id', vendorId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: offers || []
        });
    } catch (error) {
        console.error('Error fetching vendor offers:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch offers'
        });
    }
};

// Admin: Get ALL offers (all statuses, with vendor info)
exports.getAllOffers = async (req, res) => {
    try {
        const { data: offers, error } = await supabase
            .from('offers')
            .select('*, vendor:users!offers_vendor_id_fkey(name, business_name, email)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ success: true, data: offers || [] });
    } catch (error) {
        console.error('Error fetching all offers:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch offers' });
    }
};

// Admin/Vendor: Update an offer (status, title, etc.)
exports.updateOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, discountAmount, discountCode, validUntil, imageUrl, mediaUrls, status } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (discountAmount !== undefined) updateData.discount_amount = discountAmount;
        if (discountCode !== undefined) updateData.discount_code = discountCode;
        if (validUntil !== undefined) updateData.valid_until = validUntil;
        if (imageUrl !== undefined) updateData.image_url = imageUrl;
        if (mediaUrls !== undefined) updateData.media_urls = mediaUrls;
        if (status !== undefined) updateData.status = status;

        const { data: offer, error } = await supabase
            .from('offers')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data: offer });
    } catch (error) {
        console.error('Error updating offer:', error);
        res.status(500).json({ success: false, error: 'Failed to update offer' });
    }
};

// Admin/Vendor: Delete an offer
exports.deleteOffer = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('offers')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true, message: 'Offer deleted successfully' });
    } catch (error) {
        console.error('Error deleting offer:', error);
        res.status(500).json({ success: false, error: 'Failed to delete offer' });
    }
};
