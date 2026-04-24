const supabase = require('../config/database');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
    try {
        // Total counts
        const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'USER');
        const { count: totalBookings } = await supabase.from('bookings').select('*', { count: 'exact', head: true });
        const { count: totalProfessionals } = await supabase.from('professionals').select('*', { count: 'exact', head: true });

        // Booking stats by status
        // Supabase OR filter syntax is different. .or('status.eq.confirmed,status.eq.Upcoming')
        const { count: upcomingBookings } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).or('status.eq.confirmed,status.eq.Upcoming');
        const { count: completedBookings } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'Completed');

        // Recent bookings
        const { data: recentBookings } = await supabase
            .from('bookings')
            .select('*, users!bookings_user_id_fkey(name, email)') // Join user explicitly using FK
            .order('created_at', { ascending: false })
            .limit(10);

        // Revenue calculation 
        // We can't do sum easily without RPC. Fetch prices.
        const { data: allBookings } = await supabase.from('bookings').select('price');
        const totalRevenue = (allBookings || []).reduce((sum, booking) => {
            const price = parseInt((booking.price || '0').replace(/[^0-9]/g, '')) || 0;
            return sum + price;
        }, 0);

        // Service category breakdown
        // Fetch service_name and aggregate in JS
        const { data: bookingCategories } = await supabase.from('bookings').select('service_name');
        const categoryMap = {};
        (bookingCategories || []).forEach(b => {
            const name = b.service_name || 'Unknown';
            categoryMap[name] = (categoryMap[name] || 0) + 1;
        });
        const bookingsByCategory = Object.keys(categoryMap).map(k => ({
            serviceName: k, // match old structure
            _count: { serviceName: categoryMap[k] }
        }));

        res.json({
            success: true,
            stats: {
                totalUsers: totalUsers || 0,
                totalBookings: totalBookings || 0,
                totalProfessionals: totalProfessionals || 0,
                upcomingBookings: upcomingBookings || 0,
                completedBookings: completedBookings || 0,
                totalRevenue: `₹${totalRevenue}`,
                recentBookings: (recentBookings || []).map(b => ({
                    ...b,
                    user: b.users // Map users -> user to match expected output
                })),
                bookingsByCategory
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard statistics'
        });
    }
};

// Get all users with pagination
exports.getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const from = (parseInt(page) - 1) * parseInt(limit);
        const to = from + parseInt(limit) - 1;

        let query = supabase
            .from('users')
            .select('*', { count: 'exact' })
            .eq('role', 'USER')
            .order('name', { ascending: true })
            .range(from, to);

        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        const { data: users, count: total, error } = await query;

        if (error) throw error;

        // Fetch booking counts for each user separately
        const usersWithCounts = await Promise.all(
            (users || []).map(async (user) => {
                const { count: bookingCount } = await supabase
                    .from('bookings')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                return {
                    ...user,
                    isPremium: user.is_premium,
                    _count: { bookings: bookingCount || 0 }
                };
            })
        );

        res.json({
            success: true,
            users: usersWithCounts,
            pagination: {
                total: total || 0,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil((total || 0) / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
};

// Get user details
exports.getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: user, error } = await supabase
            .from('users')
            .select('*, bookings(*), transactions(*), addresses(*), payment_methods(*)')
            .eq('id', id)
            .single();

        if (error || !user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        delete user.password;

        res.json({
            success: true,
            user: {
                ...user,
                paymentMethods: user.payment_methods // Map snake_case to camelCase
            }
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user details'
        });
    }
};

// Update user
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, location, isPremium } = req.body;

        const updates = {};
        if (name) updates.name = name;
        if (phone) updates.phone = phone;
        if (location) updates.location = location;
        if (isPremium !== undefined) updates.is_premium = isPremium;

        const { data: user, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        delete user.password;

        res.json({
            success: true,
            message: 'User updated successfully',
            user
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user'
        });
    }
};

// Get all bookings with filters
exports.getAllBookings = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const from = (parseInt(page) - 1) * parseInt(limit);
        const to = from + parseInt(limit) - 1;

        let query = supabase
            .from('bookings')
            .select('*, users!bookings_user_id_fkey(name, email, phone)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (status) query = query.eq('status', status);
        if (search) query = query.or(`service_name.ilike.%${search}%,professional_name.ilike.%${search}%`);

        const { data: bookings, count: total, error } = await query;

        if (error) throw error;

        res.json({
            success: true,
            bookings: bookings.map(b => ({
                ...b,
                serviceName: b.service_name,
                professionalName: b.professional_name,
                user: b.users // map key
            })),
            pagination: {
                total: total || 0,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil((total || 0) / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch bookings'
        });
    }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, professionalId, professionalName } = req.body;

        const updates = {};
        if (status) updates.status = status;
        if (professionalId) updates.professional_id = professionalId;
        if (professionalName) updates.professional_name = professionalName;

        const { data: booking, error } = await supabase
            .from('bookings')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Booking updated successfully',
            booking
        });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update booking'
        });
    }
};

// Get all professionals
exports.getAllProfessionals = async (req, res) => {
    try {
        const { data: professionals, error } = await supabase
            .from('professionals')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            professionals
        });
    } catch (error) {
        console.error('Error fetching professionals:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch professionals'
        });
    }
};

// Create professional
exports.createProfessional = async (req, res) => {
    try {
        const { name, phone, email, specialty } = req.body;

        const { data: professional, error } = await supabase
            .from('professionals')
            .insert({ name, phone, email, specialty })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Professional created successfully',
            professional
        });
    } catch (error) {
        console.error('Error creating professional:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create professional'
        });
    }
};

// Update professional
exports.updateProfessional = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, specialty, isAvailable, rating } = req.body;

        const updates = {};
        if (name) updates.name = name;
        if (phone) updates.phone = phone;
        if (email) updates.email = email;
        if (specialty) updates.specialty = specialty;
        if (isAvailable !== undefined) updates.is_available = isAvailable;
        if (rating) updates.rating = rating;

        const { data: professional, error } = await supabase
            .from('professionals')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Professional updated successfully',
            professional
        });
    } catch (error) {
        console.error('Error updating professional:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update professional'
        });
    }
};

// Delete professional
exports.deleteProfessional = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('professionals')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Professional deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting professional:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete professional'
        });
    }
};

// Get all service categories
exports.getAllServiceCategories = async (req, res) => {
    try {
        // We can't do _count include easily.
        // Option: Fetch categories, then fetch counts? Or just leave count out for now?
        // Let's rely on standard fields.
        const { data: categories, error } = await supabase
            .from('service_categories')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            categories: categories.map(c => ({
                ...c,
                _count: { services: 0 } // Placeholder
            }))
        });
    } catch (error) {
        console.error('Error fetching service categories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch service categories'
        });
    }
};

// Create a new service category
exports.createServiceCategory = async (req, res) => {
    try {
        const { name, image } = req.body;
        const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        const { data: category, error } = await supabase
            .from('service_categories')
            .insert({ name, slug, image })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            category
        });
    } catch (error) {
        console.error('Error creating service category:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create service category'
        });
    }
};

// Update service category
exports.updateServiceCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, image, is_active } = req.body;

        const updates = {};
        if (name) {
            updates.name = name;
            updates.slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        }
        if (image !== undefined) updates.image = image;
        if (is_active !== undefined) updates.is_active = is_active;

        const { data: category, error } = await supabase
            .from('service_categories')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Category updated successfully',
            category
        });
    } catch (error) {
        console.error('Error updating service category:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update service category'
        });
    }
};

// Delete service category
exports.deleteServiceCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('service_categories').delete().eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting service category:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete service category'
        });
    }
};

// Get all service items for a category
exports.getServiceItems = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const { data: items, error } = await supabase
            .from('service_items')
            .select('*')
            .eq('category_id', categoryId)
            .order('title', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            items: items.map(i => ({
                ...i,
                categoryId: i.category_id,
                titleFull: i.title_full,
                isImage: i.is_image
            }))
        });
    } catch (error) {
        console.error('Error fetching service items:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch service items'
        });
    }
};

// Create service item
exports.createServiceItem = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { title, titleFull, duration, price, rating, image, color, isImage } = req.body;

        const { data: item, error } = await supabase
            .from('service_items')
            .insert({
                category_id: categoryId,
                title,
                title_full: titleFull,
                duration,
                price,
                rating,
                image,
                color,
                is_image: isImage || false
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Service item created successfully',
            item
        });
    } catch (error) {
        console.error('Error creating service item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create service item'
        });
    }
};

// Update service item
exports.updateServiceItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, titleFull, duration, price, rating, image, color, isImage } = req.body;

        const updates = {};
        if (title) updates.title = title;
        if (titleFull) updates.title_full = titleFull;
        if (duration) updates.duration = duration;
        if (price) updates.price = price;
        if (rating) updates.rating = rating;
        if (image !== undefined) updates.image = image;
        if (color !== undefined) updates.color = color;
        if (isImage !== undefined) updates.is_image = isImage;

        const { data: item, error } = await supabase
            .from('service_items')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Service item updated successfully',
            item
        });
    } catch (error) {
        console.error('Error updating service item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update service item'
        });
    }
};

// Delete service item
exports.deleteServiceItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('service_items').delete().eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Service item deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting service item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete service item'
        });
    }
};

// Get all pending vendors
exports.getPendingVendors = async (req, res) => {
    try {
        const { data: vendors, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'VENDOR')
            .eq('approval_status', 'PENDING')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            vendors: vendors.map(v => {
                delete v.password;
                return {
                    ...v,
                    serviceCategory: v.service_category,
                    businessName: v.business_name,
                    businessAddress: v.business_address,
                    experienceYears: v.experience_years,
                    aadhaar_url: v.aadhaar_url,
                    pan_url: v.pan_url,
                    approvalStatus: v.approval_status
                };
            })
        });
    } catch (error) {
        console.error('Error fetching pending vendors:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch pending vendors'
        });
    }
};

// Get all vendors with optional status filter
exports.getAllVendors = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const from = (parseInt(page) - 1) * parseInt(limit);
        const to = from + parseInt(limit) - 1;

        let query = supabase
            .from('users')
            .select('*', { count: 'exact' })
            .eq('role', 'VENDOR')
            .order('created_at', { ascending: false })
            .range(from, to);

        if (status) {
            query = query.eq('approval_status', status.toUpperCase());
        }

        const { data: vendors, count: total, error } = await query;

        if (error) throw error;

        res.json({
            success: true,
            vendors: vendors.map(v => {
                delete v.password;
                return {
                    ...v,
                    serviceCategory: v.service_category,
                    businessName: v.business_name,
                    businessAddress: v.business_address,
                    experienceYears: v.experience_years,
                    aadhaar_url: v.aadhaar_url,
                    pan_url: v.pan_url,
                    approvalStatus: v.approval_status,
                    approvedAt: v.approved_at,
                    approvedBy: v.approved_by
                };
            }),
            pagination: {
                total: total || 0,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil((total || 0) / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch vendors'
        });
    }
};

// Approve vendor
exports.approveVendor = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id; // From auth middleware

        const { data: vendor, error } = await supabase
            .from('users')
            .update({
                approval_status: 'APPROVED',
                approved_at: new Date().toISOString(),
                approved_by: adminId
            })
            .eq('id', id)
            .eq('role', 'VENDOR')
            .select()
            .single();

        if (error) throw error;

        if (!vendor) {
            return res.status(404).json({
                success: false,
                error: 'Vendor not found'
            });
        }

        delete vendor.password;

        res.json({
            success: true,
            message: 'Vendor approved successfully',
            vendor: {
                ...vendor,
                approvalStatus: vendor.approval_status
            }
        });
    } catch (error) {
        console.error('Error approving vendor:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to approve vendor'
        });
    }
};

// Reject vendor
exports.rejectVendor = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id; // From auth middleware

        const { data: vendor, error } = await supabase
            .from('users')
            .update({
                approval_status: 'REJECTED',
                approved_at: new Date().toISOString(),
                approved_by: adminId
            })
            .eq('id', id)
            .eq('role', 'VENDOR')
            .select()
            .single();

        if (error) throw error;

        if (!vendor) {
            return res.status(404).json({
                success: false,
                error: 'Vendor not found'
            });
        }

        delete vendor.password;

        res.json({
            success: true,
            message: 'Vendor rejected successfully',
            vendor: {
                ...vendor,
                approvalStatus: vendor.approval_status
            }
        });
    } catch (error) {
        console.error('Error rejecting vendor:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reject vendor'
        });
    }
};


// Get all payments/transactions
exports.getAllPayments = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const from = (parseInt(page) - 1) * parseInt(limit);
        const to = from + parseInt(limit) - 1;

        let query = supabase
            .from('transactions')
            .select('*, users!user_id(name, email)', { count: 'exact' })
            .order('date', { ascending: false })
            .range(from, to);

        if (search) {
            query = query.or(`title.ilike.%${search}%,tag.ilike.%${search}%`);
        }

        const { data: payments, count: total, error } = await query;

        if (error) throw error;

        res.json({
            success: true,
            payments: (payments || []).map(p => ({
                id: p.id,
                amount: p.amount,
                status: 'Success',
                date: p.date,
                customer: p.users?.name || 'Unknown',
                method: p.title || 'Payment',
                transactionId: p.payment_method_id || `TXN-${p.id.substring(0, 8)}`
            })),
            pagination: {
                total: total || 0,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil((total || 0) / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch payments'
        });
    }
};
// Assign Service to Vendor (Vendor Specialization)
exports.assignServiceToVendor = async (req, res) => {
    const { vendorId, serviceItemId, customPrice } = req.body;
    try {
        const { data, error } = await supabase
            .from('vendor_services')
            .upsert([{
                vendor_id: vendorId,
                service_item_id: serviceItemId,
                custom_price: customPrice
            }])
            .select();

        if (error) throw error;
        res.json({ success: true, message: 'Vendor specialization updated', data });
    } catch (error) {
        console.error('Assign Vendor Service Error:', error);
        res.status(500).json({ success: false, error: 'Failed to assign service to vendor' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR SERVICE PRICING MANAGEMENT (ADMIN)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /admin/vendors/:id/service-pricing
 * Returns all service offerings for a given vendor with their custom price & duration.
 * Admin can view and edit these.
 */
exports.getVendorServicePricing = async (req, res) => {
    try {
        const { id: vendorId } = req.params;

        const { data: services, error } = await supabase
            .from('vendor_services')
            .select(`
                id,
                service_item_id,
                custom_price,
                custom_duration,
                is_enabled,
                price_updated_by,
                duration_updated_by,
                service_items (
                    id,
                    title,
                    price,
                    duration,
                    image,
                    subcategory_id
                )
            `)
            .eq('vendor_id', vendorId);

        if (error) throw error;

        const formatted = (services || []).map(s => ({
            id: s.service_item_id,
            vendorServiceId: s.id,
            name: s.service_items?.title || 'Unknown',
            basePrice: s.service_items?.price,
            baseDuration: s.service_items?.duration,
            customPrice: s.custom_price,
            customDuration: s.custom_duration,
            isEnabled: s.is_enabled,
            priceUpdatedBy: s.price_updated_by || 'VENDOR',
            durationUpdatedBy: s.duration_updated_by || 'VENDOR',
            image: s.service_items?.image,
        }));

        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error('Error fetching vendor service pricing:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch vendor service pricing' });
    }
};

/**
 * PUT /admin/vendors/:id/service-pricing
 * Admin overrides the price and/or duration for a specific service of a vendor.
 * Body: { serviceItemId, customPrice, customDuration }
 */
exports.updateVendorServicePricing = async (req, res) => {
    try {
        const { id: vendorId } = req.params;
        const { serviceItemId, customPrice, customDuration, isEnabled } = req.body;

        if (!serviceItemId) {
            return res.status(400).json({ success: false, error: 'serviceItemId is required' });
        }

        const updates = {};
        if (customPrice !== undefined) {
            updates.custom_price = customPrice;
            updates.price_updated_by = 'ADMIN';
        }
        if (customDuration !== undefined) {
            updates.custom_duration = customDuration !== null && customDuration !== '' ? parseInt(customDuration) : null;
            updates.duration_updated_by = 'ADMIN';
        }
        if (isEnabled !== undefined) updates.is_enabled = isEnabled;

        const { data, error } = await supabase
            .from('vendor_services')
            .update(updates)
            .eq('vendor_id', vendorId)
            .eq('service_item_id', serviceItemId)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ success: false, error: 'Vendor service entry not found' });
        }

        res.json({
            success: true,
            message: 'Vendor service pricing updated by admin',
            data
        });
    } catch (error) {
        console.error('Error updating vendor service pricing (admin):', error);
        res.status(500).json({ success: false, error: 'Failed to update vendor service pricing' });
    }
};

// Toggle user account status (enable/disable fraud users)
exports.toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        if (is_active === undefined) {
            return res.status(400).json({ success: false, error: 'is_active is required' });
        }

        const { data: user, error } = await supabase
            .from('users')
            .update({ is_active })
            .eq('id', id)
            .eq('role', 'USER')
            .select('id, name, email, is_active')
            .single();

        if (error) throw error;
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        res.json({
            success: true,
            message: `User ${is_active ? 'enabled' : 'disabled'} successfully`,
            user
        });
    } catch (error) {
        console.error('Error toggling user status:', error);
        res.status(500).json({ success: false, error: 'Failed to update user status' });
    }
};

// Toggle vendor account status (enable/disable fraud vendors)
exports.toggleVendorStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        if (is_active === undefined) {
            return res.status(400).json({ success: false, error: 'is_active is required' });
        }

        const { data: vendor, error } = await supabase
            .from('users')
            .update({ is_active })
            .eq('id', id)
            .eq('role', 'VENDOR')
            .select('id, name, email, is_active, approval_status')
            .single();

        if (error) throw error;
        if (!vendor) return res.status(404).json({ success: false, error: 'Vendor not found' });

        res.json({
            success: true,
            message: `Vendor ${is_active ? 'enabled' : 'disabled'} successfully`,
            vendor
        });
    } catch (error) {
        console.error('Error toggling vendor status:', error);
        res.status(500).json({ success: false, error: 'Failed to update vendor status' });
    }
};
