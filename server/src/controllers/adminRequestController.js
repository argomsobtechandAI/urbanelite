const supabase = require('../config/database');
const { sendAdminRequestEmail } = require('../utils/mailer');

// ─── USER: Submit a new admin service request (Others category) ────────────────
exports.createAdminRequest = async (req, res) => {
    try {
        const {
            categoryId,
            categoryName,
            subcategoryId,
            subcategoryName,
            serviceItemId,
            serviceName,
            description,
            preferredDate,
            preferredTime,
            location,
            attachmentUrl,
        } = req.body;

        const userId = req.user.id;

        // Fetch user details for denormalization
        const { data: user } = await supabase
            .from('users')
            .select('name, email, phone')
            .eq('id', userId)
            .single();

        const requestData = {
            user_id: userId,
            user_name: user?.name || '',
            user_email: user?.email || '',
            user_phone: user?.phone || '',
            category_id: categoryId || null,
            category_name: categoryName || 'Others',
            subcategory_id: subcategoryId || null,
            subcategory_name: subcategoryName || '',
            service_item_id: serviceItemId || null,
            service_name: serviceName,
            description: description || '',
            preferred_date: preferredDate || '',
            preferred_time: preferredTime || '',
            location_type: location?.type || 'Home',
            location_address: location?.address || '',
            status: 'PENDING',
        };

        if (attachmentUrl) {
            requestData.attachment_url = attachmentUrl;
        }

        const { data: request, error } = await supabase
            .from('admin_service_requests')
            .insert(requestData)
            .select()
            .single();

        if (error) {
            console.error('Admin Request DB Insert Error:', error);
            throw error;
        }

        // Send email notification asynchronously (doesn't block the response)
        sendAdminRequestEmail(requestData).catch(err => {
            console.error('Failed to send admin request email:', err);
        });

        res.status(201).json({
            success: true,
            requestId: request.id,
            status: request.status,
            message: 'Your request has been submitted successfully! Our team will contact you shortly.',
        });
    } catch (error) {
        console.error('Error creating admin request:', error);
        res.status(500).json({ success: false, error: 'Failed to submit request' });
    }
};

// ─── USER: Get all requests for the logged-in user ────────────────────────────
exports.getUserAdminRequests = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data: requests, error } = await supabase
            .from('admin_service_requests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            requests: requests.map(r => ({
                id: r.id,
                serviceName: r.service_name,
                categoryName: r.category_name,
                subcategoryName: r.subcategory_name,
                description: r.description,
                preferredDate: r.preferred_date,
                preferredTime: r.preferred_time,
                status: r.status,
                adminNotes: r.admin_notes,
                createdAt: r.created_at,
            })),
        });
    } catch (error) {
        console.error('Error fetching user admin requests:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch requests' });
    }
};

// ─── ADMIN: Get all admin service requests ────────────────────────────────────
exports.getAllAdminRequests = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;
        const from = (parseInt(page) - 1) * parseInt(limit);
        const to = from + parseInt(limit) - 1;

        let query = supabase
            .from('admin_service_requests')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (status) query = query.eq('status', status);
        if (search) {
            query = query.or(
                `service_name.ilike.%${search}%,user_name.ilike.%${search}%,user_email.ilike.%${search}%,description.ilike.%${search}%`
            );
        }

        const { data: requests, count: total, error } = await query;

        if (error) throw error;

        res.json({
            success: true,
            requests: requests.map(r => ({
                id: r.id,
                userId: r.user_id,
                userName: r.user_name,
                userEmail: r.user_email,
                userPhone: r.user_phone,
                categoryName: r.category_name,
                subcategoryName: r.subcategory_name,
                serviceName: r.service_name,
                description: r.description,
                preferredDate: r.preferred_date,
                preferredTime: r.preferred_time,
                locationAddress: r.location_address,
                attachmentUrl: r.attachment_url,
                status: r.status,
                adminNotes: r.admin_notes,
                createdAt: r.created_at,
            })),
            pagination: {
                total: total || 0,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil((total || 0) / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('Error fetching admin requests:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch requests' });
    }
};

// ─── ADMIN: Get single admin service request ──────────────────────────────────
exports.getAdminRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: request, error } = await supabase
            .from('admin_service_requests')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !request) {
            return res.status(404).json({ success: false, error: 'Request not found' });
        }

        res.json({ success: true, request });
    } catch (error) {
        console.error('Error fetching admin request:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch request' });
    }
};

// ─── ADMIN: Update admin service request status / notes ───────────────────────
exports.updateAdminRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;

        const updates = { updated_at: new Date().toISOString() };
        if (status) updates.status = status;
        if (adminNotes !== undefined) updates.admin_notes = adminNotes;

        const { data: request, error } = await supabase
            .from('admin_service_requests')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Request updated successfully',
            request,
        });
    } catch (error) {
        console.error('Error updating admin request:', error);
        res.status(500).json({ success: false, error: 'Failed to update request' });
    }
};

// ─── ADMIN: Get dashboard count for others requests ───────────────────────────
exports.getOthersRequestsCount = async (req, res) => {
    try {
        const { count: pendingCount } = await supabase
            .from('admin_service_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'PENDING');

        const { count: totalCount } = await supabase
            .from('admin_service_requests')
            .select('*', { count: 'exact', head: true });

        res.json({
            success: true,
            pendingCount: pendingCount || 0,
            totalCount: totalCount || 0,
        });
    } catch (error) {
        console.error('Error fetching others request count:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch counts' });
    }
};
