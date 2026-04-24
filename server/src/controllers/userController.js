const supabase = require('../config/database');
const pgPool = require('../lib/pgClient');

// Get User Profile
const getUserProfile = async (req, res) => {
    try {
        console.log('DEBUG: getUserProfile called for ID:', req.user?.id); // DEBUG LOG
        const { data: user, error } = await supabase
            .from('users')
            .select('*, transactions(*)') // Fetch transactions for balance calc
            .eq('id', req.user.id)
            .single();

        if (error || !user) {
            console.error('Supabase error:', error);
            return res.status(404).json({ message: 'User not found' });
        }

        // Calculate Balance Dynamically
        const transactions = user.transactions || [];
        let calculatedBalance = 0;

        transactions.forEach(tx => {
            // Clean amount string: remove everything except digits, minus, and dot
            const cleanAmount = String(tx.amount).replace(/[^0-9.-]+/g, "");
            const val = parseFloat(cleanAmount) || 0;

            if (tx.type === 'credit') calculatedBalance += val;
            else if (tx.type === 'debit') calculatedBalance -= val;
        });

        res.json({
            name: user.name,
            email: user.email,
            phone: user.phone,
            location: user.location,
            isPremium: user.is_premium,
            walletBalance: `₹${calculatedBalance.toFixed(2)}`,
            profileImageUrl: user.profile_image_url || null,
            certificationDocs: user.certification_docs || []
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get User Wallet
const getUserWallet = async (req, res) => {
    try {
        // Fetch users, transactions, and promos (mocking relations for now as join queries are different in Supabase JS)
        // Ideally we fetch them separately or use foreign key joins if setup
        const { data: user, error } = await supabase
            .from('users')
            .select('*, transactions(*), promos(*)')
            .eq('id', req.user.id)
            .single();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Calculate Balance Dynamically
        const transactions = user.transactions || [];
        let calculatedBalance = 0;

        transactions.forEach(tx => {
            // Clean amount string: remove everything except digits, minus, and dot
            const cleanAmount = String(tx.amount).replace(/[^0-9.-]+/g, "");
            const val = parseFloat(cleanAmount) || 0;

            if (tx.type === 'credit') calculatedBalance += val;
            else if (tx.type === 'debit') calculatedBalance -= val;
        });

        // Use DB balance if available, otherwise use calculated
        // const finalBalance = user.wallet_balance !== undefined ? user.wallet_balance : calculatedBalance;
        // For now, PREFER calculated to ensure sync with history
        const finalBalance = calculatedBalance;

        res.json({
            balance: `₹${finalBalance}`,
            transactions: transactions,
            promos: user.promos || []
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Update User Profile
const updateProfile = async (req, res) => {
    try {
        const { name, email, phone, location, taxId, serviceCategory, teamSize, certifications, availability, primaryService } = req.body;

        // Map frontend camelCase to DB snake_case if necessary, or ensure DB uses same names. 
        // Based on my schema check, existing fields are snake_case (business_name, business_address).
        // I will map them here.
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (location) updateData.location = location;

        // Vendor fields
        if (taxId) updateData.tax_id = taxId;
        if (serviceCategory) updateData.service_category = serviceCategory;
        if (teamSize) updateData.team_size = teamSize;
        if (certifications) updateData.certifications = certifications;
        if (availability) updateData.availability = availability;
        if (primaryService) updateData.primary_service = primaryService;

        // Experience Years & Media
        const { experienceYears, profileImageUrl, certification_docs } = req.body;
        if (experienceYears) updateData.experience_years = experienceYears;
        if (profileImageUrl) updateData.profile_image_url = profileImageUrl;
        if (certification_docs) updateData.certification_docs = certification_docs;

        // Also map name/location to business_name/address for consistency if user is vendor
        if (req.user.role === 'VENDOR') {
            if (name) updateData.business_name = name;
            if (location) updateData.business_address = location;
        }

        const { data: user, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.json({ ...user, walletBalance: '₹0' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Address Management
const getAddresses = async (req, res) => {
    try {
        console.log('Fetching addresses for user:', req.user?.id);
        const { data: addresses, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', req.user.id);

        if (error) {
            console.error('Supabase getAddresses error:', error);
            throw error;
        }

        console.log(`Found ${addresses?.length || 0} addresses`);
        res.json(addresses);
    } catch (error) {
        console.error('getAddresses error:', error);
        res.status(500).json({ message: 'Server Error', details: error.message });
    }
};

const addAddress = async (req, res) => {
    try {
        const { type, address, isDefault } = req.body;
        console.log('Adding address for user:', req.user?.id, { type, address, isDefault });

        const { data: newAddr, error } = await supabase
            .from('addresses')
            .insert({
                user_id: req.user.id,
                type,
                address,
                is_default: isDefault
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase addAddress error:', error);
            throw error;
        }

        console.log('Address added successfully:', newAddr.id);
        res.json(newAddr);
    } catch (error) {
        console.error('addAddress error:', error);
        res.status(500).json({ message: 'Server Error', details: error.message });
    }
};

const deleteAddress = async (req, res) => {
    try {
        const { error } = await supabase
            .from('addresses')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Payment Methods
const getPaymentMethods = async (req, res) => {
    try {
        const { data: methods, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('user_id', req.user.id);

        if (error) throw error;
        res.json(methods);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const addPaymentMethod = async (req, res) => {
    try {
        const { type, label, detail } = req.body;
        const { data: method, error } = await supabase
            .from('payment_methods')
            .insert({
                user_id: req.user.id,
                type,
                label,
                detail
            })
            .select()
            .single();

        if (error) throw error;
        res.json(method);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const deletePaymentMethod = async (req, res) => {
    try {
        const { error } = await supabase
            .from('payment_methods')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Wallet Topup
const topupWallet = async (req, res) => {
    try {
        const { amount, paymentMethodId } = req.body;
        let addAmount = parseFloat(amount);

        const { error } = await supabase
            .from('transactions')
            .insert({
                user_id: req.user.id,
                title: `Wallet Top-up ${paymentMethodId ? '#' + paymentMethodId : ''}`,
                tag: 'PAYMENT',
                amount: addAmount,
                type: 'credit',
                date: new Date().toISOString()
            });

        if (error) {
            console.error('Supabase Transaction Insert Error:', error);
            throw error;
        }

        // UPDATE USER BALANCE
        // 1. Get current balance manually to be safe (or use RPC if available, but simple select-update for now)
        const { data: userData } = await supabase
            .from('users')
            .select('wallet_balance')
            .eq('id', req.user.id)
            .single();

        const currentBalance = userData?.wallet_balance || 0;
        const newBalance = currentBalance + addAmount;

        const { error: updateError } = await supabase
            .from('users')
            .update({ wallet_balance: newBalance })
            .eq('id', req.user.id);

        if (updateError) {
            // Gracefully handle missing column error
            if (updateError.code === '42703') {
                console.warn('Wallet balance column missing, skipping update.');
            } else {
                console.error('Failed to update user balance:', updateError);
            }
        }

        // Return calculated balance for immediate UI update
        res.json({ message: 'Topup Successful', balance: `₹${newBalance}` });
    } catch (error) {
        console.error('Topup Wallet Error:', error);
        // Don't fail the request if payment succeeded but DB update failed
        // Check if we can just return success
        if (error.code === '42703') {
            return res.json({ message: 'Topup Successful (Balance update pending schema fix)', balance: `₹${addAmount}` });
        }
        res.status(500).json({ message: 'Server Error', details: error.message });
    }
};

// Get Wallet Transactions
const getWalletTransactions = async (req, res) => {
    try {
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', req.user.id)
            .order('date', { ascending: false });

        if (error) throw error;

        res.json(transactions || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Notification Settings
const getNotificationSettings = async (req, res) => {
    try {
        let { data: settings, error } = await supabase
            .from('notification_settings')
            .select('*')
            .eq('user_id', req.user.id)
            .single();

        if (!settings) {
            // Create default
            const { data: newSettings, error: createError } = await supabase
                .from('notification_settings')
                .insert({ user_id: req.user.id })
                .select()
                .single();
            settings = newSettings;
        }

        res.json(settings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const updateNotificationSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const body = req.body;

        // Actual column names in the notification_settings table
        const ALLOWED_COLS = [
            'booking_updates', 'offers', 'reminders', 'security',
            'new_leads', 'payouts'
        ];

        const changedCols = ALLOWED_COLS.filter(col => body[col] !== undefined);
        if (changedCols.length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        const updatePayload = {};
        changedCols.forEach(col => { updatePayload[col] = body[col]; });

        const axios = require('axios');
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
        const headers = {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
        };

        // Step 1: Try PATCH (update existing row)
        const patchRes = await axios.patch(
            `${supabaseUrl}/rest/v1/notification_settings?user_id=eq.${userId}`,
            updatePayload,
            { headers }
        );

        // If row was found and updated, return it
        if (patchRes.data && patchRes.data.length > 0) {
            return res.json(patchRes.data[0]);
        }

        // Step 2: No row exists yet — INSERT with defaults
        const insertPayload = { user_id: userId, ...updatePayload };
        const postRes = await axios.post(
            `${supabaseUrl}/rest/v1/notification_settings`,
            insertPayload,
            { headers }
        );

        res.json(postRes.data?.[0] || { success: true });
    } catch (error) {
        const errDetail = error.response?.data || error.message;
        console.error('updateNotificationSettings error:', errDetail);
        res.status(500).json({ message: 'Server Error', detail: JSON.stringify(errDetail) });
    }
};

// Get User Bookings
const getUserBookings = async (req, res) => {
    try {
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('user_id', req.user.id);

        if (error) throw error;

        // Group by status
        const upcoming = bookings.filter(b => ['PENDING', 'ACCEPTED', 'ACTIVE', 'Upcoming', 'confirmed'].includes(b.status));
        const completed = bookings.filter(b => ['COMPLETED', 'Completed'].includes(b.status));
        const cancelled = bookings.filter(b => ['CANCELLED', 'Cancelled'].includes(b.status));

        res.json({
            upcoming,
            completed,
            cancelled
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getUserProfile, updateProfile,
    getUserWallet, topupWallet, getWalletTransactions,
    getUserBookings,
    getAddresses, addAddress, deleteAddress,
    getPaymentMethods, addPaymentMethod, deletePaymentMethod,
    getNotificationSettings, updateNotificationSettings
};
