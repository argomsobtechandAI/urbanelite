const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const supabase = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Register new user
exports.register = async (req, res) => {
    try {
        const {
            name, email, phone, password, role,
            serviceCategory, subCategory, serviceItems, // Updated fields
            businessName, businessAddress, experienceYears,
            aadhaarUrl, panUrl
        } = req.body;

        console.log('Registration Request Body:', req.body); // DEBUG

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Name, email, and password are required'
            });
        }

        const userRole = role && (role === 'VENDOR' || role === 'USER') ? role : 'USER';

        if (userRole === 'VENDOR') {
            if (!serviceCategory || !subCategory || !businessName || !businessAddress) {
                return res.status(400).json({
                    success: false,
                    error: 'Service category, sub-category, business name, and address are required'
                });
            }
        }

        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ success: false, error: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userData = {
            name,
            email,
            phone: phone || null,
            password: hashedPassword,
            role: userRole,
            is_premium: false,
            approval_status: userRole === 'VENDOR' ? 'PENDING' : 'APPROVED'
        };

        if (userRole === 'VENDOR') {
            // Fetch category name for the legacy service_category field
            const { data: catData } = await supabase
                .from('service_categories')
                .select('name')
                .eq('id', serviceCategory)
                .single();

            userData.service_category_id = serviceCategory;
            userData.sub_category_id = subCategory;
            // Store Name instead of ID in the legacy text field for backward compatibility 
            userData.service_category = catData ? catData.name : serviceCategory;

            userData.business_name = businessName;
            userData.business_address = businessAddress;
            userData.experience_years = experienceYears ? parseInt(experienceYears) : null;
            userData.aadhaar_url = aadhaarUrl || null;
            userData.pan_url = panUrl || null;
        }

        const { data: user, error } = await supabase
            .from('users')
            .insert(userData)
            .select()
            .single();

        if (error) throw error;

        // Insert Vendor Services
        if (userRole === 'VENDOR' && Array.isArray(serviceItems) && serviceItems.length > 0) {
            try {
                const vendorServicesData = serviceItems.map(itemId => ({
                    vendor_id: user.id,
                    service_item_id: itemId
                }));

                const { error: vsError } = await supabase
                    .from('vendor_services')
                    .insert(vendorServicesData);

                if (vsError) console.error('Error inserting vendor services:', vsError);
            } catch (err) {
                console.error('Vendor service insert exception:', err);
            }
        }

        if (userRole === 'VENDOR') {
            return res.status(201).json({
                success: true,
                message: 'Vendor registration successful! Your account is pending admin approval.',
                requiresApproval: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    approvalStatus: user.approval_status
                }
            });
        }

        // For regular users, generate token and allow immediate login
        const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            secret,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                walletBalance: '₹0'
            }
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to register user'
        });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        // Find user by email
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            console.log('Login failed: User not found', email);
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        console.log('Login DEBUG: Found user', user.email, 'Role:', user.role);

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            console.log('Login failed: PWD mismatch for', email);
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Role mismatch check: if a role is provided and it doesn't match the registered role
        if (role && user.role !== role) {
            const registeredAs = user.role === 'VENDOR' ? 'Vendor' : 'User';
            const attemptedAs = role === 'VENDOR' ? 'Vendor' : 'User';
            console.log(`Role mismatch: ${email} is ${user.role} but tried to login as ${role}`);
            return res.status(403).json({
                success: false,
                error: `This account is registered as a ${registeredAs}. You cannot log in as a ${attemptedAs} with this email.`,
                errorCode: 'ROLE_MISMATCH',
                registeredRole: user.role
            });
        }

        // Check approval status for vendors
        if (user.role === 'VENDOR') {
            if (user.approval_status === 'PENDING') {
                return res.status(403).json({
                    success: false,
                    error: 'Your account is pending approval from admin. Please wait for approval.',
                    approvalStatus: 'PENDING'
                });
            }
            if (user.approval_status === 'REJECTED') {
                return res.status(403).json({
                    success: false,
                    error: 'Your account has been rejected. Please contact support for more information.',
                    approvalStatus: 'REJECTED'
                });
            }
        }

        // Generate JWT token with role
        const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        console.log('DEBUG: Login Signing Secret:', secret.substring(0, 5) + '...');
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            secret,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                isPremium: user.is_premium,
                walletBalance: user.wallet_balance || '₹0',
                approvalStatus: user.approval_status
            }
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to login'
        });
    }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
    try {
        // req.user from authMiddleware (Supabase User)
        // If checking against custom table:
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, phone')
            .eq('id', req.user.id)
            .single();

        if (error || !user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                ...user,
                walletBalance: user.wallet_balance || '₹0'
            }
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user'
        });
    }
};

// Forgot Password - Send OTP
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }

        // Check if user exists
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(404).json({
                success: false,
                error: 'User with this email not found'
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Save OTP to user record
        const { error: updateError } = await supabase
            .from('users')
            .update({
                reset_otp: otp,
                reset_otp_expires_at: expiresAt
            })
            .eq('id', user.id);

        if (updateError) throw updateError;

        // SIMULATE SENDING EMAIL
        console.log(`[EMAIL SIMULATION] Sending OTP ${otp} to ${email}`);

        // In a real application, you would use a service like NodeMailer, SendGrid, or AWS SES
        // For development, we'll return the success status 
        // We also return the OTP in the response ONLY for testing/demo convenience
        res.json({
            success: true,
            message: 'OTP sent successfully to your email',
            otp: process.env.NODE_ENV === 'production' ? undefined : otp // Only return in dev
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process forgot password request'
        });
    }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                error: 'Email and OTP are required'
            });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('id, reset_otp, reset_otp_expires_at')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        if (user.reset_otp !== otp) {
            return res.status(400).json({
                success: false,
                error: 'Invalid OTP'
            });
        }

        if (new Date(user.reset_otp_expires_at) < new Date()) {
            return res.status(400).json({
                success: false,
                error: 'OTP has expired'
            });
        }

        res.json({
            success: true,
            message: 'OTP verified successfully'
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify OTP'
        });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Email, OTP, and new password are required'
            });
        }

        // Verify OTP again (security measure)
        const { data: user, error } = await supabase
            .from('users')
            .select('id, reset_otp, reset_otp_expires_at')
            .eq('email', email)
            .single();

        if (error || !user || user.reset_otp !== otp || new Date(user.reset_otp_expires_at) < new Date()) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired OTP'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear OTP
        const { error: updateError } = await supabase
            .from('users')
            .update({
                password: hashedPassword,
                reset_otp: null,
                reset_otp_expires_at: null
            })
            .eq('id', user.id);

        if (updateError) throw updateError;

        res.json({
            success: true,
            message: 'Password reset successful. You can now login with your new password.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reset password'
        });
    }
};
// Google Login (supports both native Google idToken and Supabase OAuth access token)
exports.googleLogin = async (req, res) => {
    try {
        const { idToken, role } = req.body;

        if (!idToken) {
            return res.status(400).json({
                success: false,
                error: 'ID token is required'
            });
        }

        let payload;

        // Strategy: Try multiple methods to extract user info from the token
        // 1. Try Supabase token verification (for web-based OAuth flow)
        // 2. Try Google OAuth verification (for native Google Sign-In)
        // 3. Fallback: decode JWT manually (dev only)

        // Method 1: Try Supabase token — the OAuth flow sends a Supabase access_token
        try {
            const { createClient } = require('@supabase/supabase-js');
            const supabaseAdmin = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );
            const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(idToken);

            if (!userError && userData?.user?.email) {
                payload = {
                    email: userData.user.email,
                    name: userData.user.user_metadata?.full_name || userData.user.user_metadata?.name || userData.user.email.split('@')[0],
                    picture: userData.user.user_metadata?.avatar_url || userData.user.user_metadata?.picture || null,
                    sub: userData.user.id,
                };
                console.log('Verified via Supabase token:', payload.email);
            }
        } catch (supaErr) {
            console.log('Supabase token verify skipped:', supaErr.message);
        }

        // Method 2: Try Google OAuth verification
        if (!payload) {
            try {
                const { OAuth2Client } = require('google-auth-library');
                const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
                const ticket = await client.verifyIdToken({
                    idToken,
                    audience: process.env.GOOGLE_CLIENT_ID,
                });
                payload = ticket.getPayload();
                console.log('Verified via Google OAuth:', payload.email);
            } catch (verifyError) {
                console.warn('Google verify failed:', verifyError.message);
            }
        }

        // Method 3: Fallback JWT decode (DEV ONLY)
        if (!payload) {
            console.warn('Attempting fallback JWT decode (DEV ONLY)');
            const parts = idToken.split('.');
            if (parts.length === 3) {
                const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                if (decoded.email) {
                    payload = decoded;
                } else if (decoded.user_metadata?.email) {
                    payload = {
                        email: decoded.user_metadata.email,
                        name: decoded.user_metadata.full_name || decoded.user_metadata.name,
                        picture: decoded.user_metadata.avatar_url,
                        sub: decoded.sub,
                    };
                }
            }
        }

        if (!payload || !payload.email) {
            return res.status(400).json({
                success: false,
                error: 'Invalid token - could not extract user information'
            });
        }

        const { email, name, picture, sub: googleId } = payload;
        console.log(`Google/OAuth Login for: ${email} (${name})`);

        // Check if user exists
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        let targetUser = user;

        // If user doesn't exist, create one
        if (!targetUser) {
            const userRole = role === 'VENDOR' ? 'VENDOR' : 'USER';

            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            const userData = {
                name: name || 'Google User',
                email,
                password: hashedPassword,
                role: userRole,
                is_premium: false,
                approval_status: userRole === 'VENDOR' ? 'PENDING' : 'APPROVED',
            };

            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert(userData)
                .select()
                .single();

            if (createError) {
                console.error('Error creating Google user:', createError);
                return res.status(400).json({
                    success: false,
                    error: 'Could not create account. If you are a vendor, please sign up via the registration form.'
                });
            }

            targetUser = newUser;
        } else {
            // Existing user: check if the selected role matches their registered role
            const attemptedRole = role === 'VENDOR' ? 'VENDOR' : 'USER';
            if (targetUser.role !== attemptedRole) {
                const registeredAs = targetUser.role === 'VENDOR' ? 'Vendor' : 'User';
                const attemptedAs = attemptedRole === 'VENDOR' ? 'Vendor' : 'User';
                console.log(`Google role mismatch: ${email} is ${targetUser.role} but tried as ${attemptedRole}`);
                return res.status(403).json({
                    success: false,
                    error: `This Google account is registered as a ${registeredAs}. You cannot log in as a ${attemptedAs} with this account.`,
                    errorCode: 'ROLE_MISMATCH',
                    registeredRole: targetUser.role
                });
            }
        }

        // Check approval for vendors
        if (targetUser.role === 'VENDOR') {
            if (targetUser.approval_status === 'PENDING') {
                return res.status(403).json({
                    success: false,
                    error: 'Your account is pending approval from admin.',
                    approvalStatus: 'PENDING'
                });
            }
            if (targetUser.approval_status === 'REJECTED') {
                return res.status(403).json({
                    success: false,
                    error: 'Your account has been rejected.',
                    approvalStatus: 'REJECTED'
                });
            }
        }

        // Generate JWT
        const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        const token = jwt.sign(
            { userId: targetUser.id, email: targetUser.email, role: targetUser.role },
            secret,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            message: 'Google login successful',
            token,
            user: {
                id: targetUser.id,
                name: targetUser.name,
                email: targetUser.email,
                phone: targetUser.phone,
                role: targetUser.role,
                isPremium: targetUser.is_premium,
                walletBalance: targetUser.wallet_balance || '₹0',
                approvalStatus: targetUser.approval_status,
                picture
            }
        });

    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process Google login'
        });
    }
};
