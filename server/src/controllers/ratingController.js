const supabase = require('../config/database');

// ── Submit a rating & feedback after a completed booking ──────────────────────
exports.submitRating = async (req, res) => {
    try {
        const { bookingId, reviewedId, rating, feedback } = req.body;
        const reviewerId = req.user.id;

        if (!bookingId || !reviewedId || !rating) {
            return res.status(400).json({ success: false, error: 'bookingId, reviewedId, and rating are required' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
        }

        // Verify the booking exists and belongs to this user
        const { data: booking, error: bErr } = await supabase
            .from('bookings')
            .select('id, status, user_id, vendor_id')
            .eq('id', bookingId)
            .single();

        if (bErr || !booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        if (booking.status?.toUpperCase() !== 'COMPLETED') {
            return res.status(400).json({ success: false, error: 'Can only rate completed bookings' });
        }

        // Insert rating (upsert to allow updating)
        const { data: ratingData, error: rErr } = await supabase
            .from('ratings')
            .upsert({
                booking_id: bookingId,
                reviewer_id: reviewerId,
                reviewed_id: reviewedId,
                rating: parseInt(rating),
                feedback: feedback || null,
            }, { onConflict: 'booking_id,reviewer_id' })
            .select()
            .single();

        if (rErr) throw rErr;

        // Update average rating on the reviewed user
        const { data: allRatings } = await supabase
            .from('ratings')
            .select('rating')
            .eq('reviewed_id', reviewedId);

        if (allRatings && allRatings.length > 0) {
            const avg = allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length;
            await supabase
                .from('users')
                .update({ average_rating: Math.round(avg * 100) / 100, rating_count: allRatings.length })
                .eq('id', reviewedId);
        }

        res.status(201).json({ success: true, message: 'Rating submitted successfully', rating: ratingData });
    } catch (error) {
        console.error('Error submitting rating:', error);
        res.status(500).json({ success: false, error: 'Failed to submit rating' });
    }
};

// ── Submit a report (misbehaviour) ───────────────────────────────────────────
exports.submitReport = async (req, res) => {
    try {
        const { reportedId, bookingId, reason, description } = req.body;
        const reporterId = req.user.id;

        if (!reportedId || !reason) {
            return res.status(400).json({ success: false, error: 'reportedId and reason are required' });
        }

        const { data: report, error } = await supabase
            .from('reports')
            .insert({
                reporter_id: reporterId,
                reported_id: reportedId,
                booking_id: bookingId || null,
                reason,
                description: description || null,
                status: 'PENDING',
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, message: 'Report submitted. Our team will review it shortly.', report });
    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({ success: false, error: 'Failed to submit report' });
    }
};

// ── Get rating for a specific booking (check if already rated) ───────────────
exports.getBookingRating = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const reviewerId = req.user.id;

        const { data, error } = await supabase
            .from('ratings')
            .select('*')
            .eq('booking_id', bookingId)
            .eq('reviewer_id', reviewerId)
            .maybeSingle();

        if (error) throw error;

        res.json({ success: true, rating: data });
    } catch (error) {
        console.error('Error fetching booking rating:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch rating' });
    }
};

// ── Admin: Get all reports ────────────────────────────────────────────────────
exports.getAllReports = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const from = (parseInt(page) - 1) * parseInt(limit);
        const to = from + parseInt(limit) - 1;

        let query = supabase
            .from('reports')
            .select('*, reporter:users!reports_reporter_id_fkey(id,name,email), reported:users!reports_reported_id_fkey(id,name,email)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (status) query = query.eq('status', status.toUpperCase());

        const { data: reports, count: total, error } = await query;
        if (error) throw error;

        res.json({ success: true, reports: reports || [], total: total || 0 });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch reports' });
    }
};

// ── Admin: Update report status ───────────────────────────────────────────────
exports.updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_notes } = req.body;

        const { data, error } = await supabase
            .from('reports')
            .update({ status, admin_notes })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, message: 'Report updated', report: data });
    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({ success: false, error: 'Failed to update report' });
    }
};
