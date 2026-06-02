const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Robustly load .env relative to this file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms - IP: ${req.ip}`);
    });
    next();
});

// Basic Route
app.get('/', (req, res) => {
    res.send('Olfix API is running');
});

const homeRoutes = require('./routes/homeRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const chatRoutes = require('./routes/chatRoutes');
const offersRoutes = require('./routes/offersRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRequestRoutes = require('./routes/adminRequestRoutes');
const ratingRoutes = require('./routes/ratingRoutes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/user', userRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin-requests', adminRequestRoutes);
app.use('/api/ratings', ratingRoutes);


// 404 Handler
app.use((req, res, next) => {
    console.log(`[404] Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ success: false, error: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`[500] Global Error:`, err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
});

app.listen(PORT, '0.0.0.0', () => {

    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Access from network: http://192.168.1.47:${PORT}`);
});
