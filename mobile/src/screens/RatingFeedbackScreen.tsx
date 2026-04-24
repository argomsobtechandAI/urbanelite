import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ScrollView, Alert, ActivityIndicator, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { Theme } from '../theme';
import { ratingAPI } from '../services/api';
import { Flag, Star, MessageSquare, CheckCircle } from 'lucide-react-native';

type RatingFeedbackRouteProp = RouteProp<RootStackParamList, 'RatingFeedback'>;

const REPORT_REASONS = [
    'Unprofessional behaviour',
    'Did not arrive on time',
    'Poor quality of work',
    'Demanded extra payment',
    'Abusive or threatening language',
    'Did not complete the service',
    'Damaged property',
    'Fraudulent activity',
    'Other',
];

const RatingFeedbackScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<RatingFeedbackRouteProp>();
    const { bookingId, reviewedId, reviewedName, serviceName } = route.params;

    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Report modal state
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedReason, setSelectedReason] = useState('');
    const [reportDescription, setReportDescription] = useState('');
    const [reportLoading, setReportLoading] = useState(false);

    const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

    const handleSubmitRating = async () => {
        if (rating === 0) {
            Alert.alert('Rating Required', 'Please select a star rating before submitting.');
            return;
        }
        setLoading(true);
        try {
            await ratingAPI.submitRating({ bookingId, reviewedId, rating, feedback });
            setSubmitted(true);
        } catch (error: any) {
            console.error('Rating submit error:', error);
            Alert.alert('Error', 'Failed to submit rating. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReport = async () => {
        if (!selectedReason) {
            Alert.alert('Reason Required', 'Please select a reason for reporting.');
            return;
        }
        setReportLoading(true);
        try {
            await ratingAPI.submitReport({
                reportedId: reviewedId,
                bookingId,
                reason: selectedReason,
                description: reportDescription || undefined,
            });
            setShowReportModal(false);
            Alert.alert(
                '✅ Report Submitted',
                'Thank you for reporting. Our team will review this within 24–48 hours and take appropriate action.',
                [{ text: 'OK' }]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to submit report. Please try again.');
        } finally {
            setReportLoading(false);
        }
    };

    if (submitted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.successContainer}>
                    <View style={styles.successCircle}>
                        <CheckCircle size={60} color="white" />
                    </View>
                    <Text style={styles.successTitle}>Thank You!</Text>
                    <Text style={styles.successSub}>Your rating and feedback have been submitted successfully.</Text>
                    <View style={styles.starsDisplay}>
                        {[1, 2, 3, 4, 5].map(s => (
                            <Text key={s} style={{ fontSize: 28 }}>{s <= rating ? '⭐' : '☆'}</Text>
                        ))}
                    </View>
                    <Text style={styles.successLabel}>{STAR_LABELS[rating]} Experience</Text>
                    <TouchableOpacity
                        style={styles.doneBtn}
                        onPress={() => navigation.navigate('MainTabs')}
                    >
                        <Text style={styles.doneBtnText}>Back to Home</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Rate & Review</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Professional Info Card */}
                <View style={styles.proCard}>
                    <View style={styles.proAvatar}>
                        <Text style={styles.proInitials}>{reviewedName?.[0]?.toUpperCase() || '?'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.proName}>{reviewedName}</Text>
                        <Text style={styles.serviceName}>{serviceName}</Text>
                    </View>
                </View>

                {/* Star Rating */}
                <View style={styles.ratingCard}>
                    <Text style={styles.ratingTitle}>How was your experience?</Text>
                    <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => setRating(star)}
                                activeOpacity={0.7}
                                style={styles.starBtn}
                            >
                                <Star
                                    size={44}
                                    color={star <= (hoveredRating || rating) ? '#F59E0B' : '#E2E8F0'}
                                    fill={star <= (hoveredRating || rating) ? '#F59E0B' : 'transparent'}
                                    strokeWidth={1.5}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    {rating > 0 && (
                        <Text style={styles.ratingLabel}>{STAR_LABELS[rating]}</Text>
                    )}
                </View>

                {/* Feedback */}
                <View style={styles.feedbackCard}>
                    <View style={styles.feedbackHeader}>
                        <MessageSquare size={18} color={Theme.colors.brandOrange} />
                        <Text style={styles.feedbackTitle}>Leave Feedback (Optional)</Text>
                    </View>
                    <TextInput
                        style={styles.feedbackInput}
                        placeholder="Share your experience with this service provider..."
                        placeholderTextColor="#A0AEC0"
                        multiline
                        numberOfLines={4}
                        value={feedback}
                        onChangeText={setFeedback}
                        textAlignVertical="top"
                        maxLength={500}
                    />
                    <Text style={styles.charCount}>{feedback.length}/500</Text>
                </View>

                {/* Report Section */}
                <View style={styles.reportCard}>
                    <View style={styles.reportTop}>
                        <Flag size={18} color="#EF4444" />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.reportTitle}>Report Misbehaviour</Text>
                            <Text style={styles.reportSub}>
                                If this service provider behaved improperly, you can report them to our team.
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.reportBtn}
                        onPress={() => setShowReportModal(true)}
                    >
                        <Flag size={16} color="#EF4444" />
                        <Text style={styles.reportBtnText}>Report {reviewedName}</Text>
                    </TouchableOpacity>
                </View>

                {/* Part Replacement Notice */}
                <View style={styles.noticeCard}>
                    <Text style={styles.noticeIcon}>🔧</Text>
                    <Text style={styles.noticeText}>
                        <Text style={styles.noticeBold}>Parts Policy: </Text>
                        If any parts were replaced, those costs were separate and paid directly to the service provider. We only charged the service fee.
                    </Text>
                </View>

                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Submit Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                    onPress={handleSubmitRating}
                    disabled={loading}
                >
                    {loading
                        ? <ActivityIndicator color="white" />
                        : <Text style={styles.submitBtnText}>Submit Rating & Feedback</Text>
                    }
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('MainTabs')} style={styles.skipBtn}>
                    <Text style={styles.skipBtnText}>Skip for now</Text>
                </TouchableOpacity>
            </View>

            {/* Report Modal */}
            <Modal
                visible={showReportModal}
                transparent
                animationType="slide"
                statusBarTranslucent
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <Flag size={20} color="#EF4444" />
                            <Text style={styles.modalTitle}>Report {reviewedName}</Text>
                            <TouchableOpacity onPress={() => setShowReportModal(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSub}>Select a reason for reporting</Text>

                        <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
                            {REPORT_REASONS.map(reason => (
                                <TouchableOpacity
                                    key={reason}
                                    style={[styles.reasonRow, selectedReason === reason && styles.reasonRowSelected]}
                                    onPress={() => setSelectedReason(reason)}
                                >
                                    <View style={[styles.reasonRadio, selectedReason === reason && styles.reasonRadioSelected]}>
                                        {selectedReason === reason && <View style={styles.reasonRadioInner} />}
                                    </View>
                                    <Text style={[styles.reasonText, selectedReason === reason && { color: '#1A202C', fontWeight: '600' }]}>
                                        {reason}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={[styles.feedbackTitle, { marginTop: 16, marginBottom: 8 }]}>Additional Details (Optional)</Text>
                        <TextInput
                            style={[styles.feedbackInput, { height: 80 }]}
                            placeholder="Describe what happened..."
                            placeholderTextColor="#A0AEC0"
                            multiline
                            value={reportDescription}
                            onChangeText={setReportDescription}
                            textAlignVertical="top"
                        />

                        <TouchableOpacity
                            style={[styles.reportSubmitBtn, reportLoading && { opacity: 0.7 }]}
                            onPress={handleSubmitReport}
                            disabled={reportLoading}
                        >
                            {reportLoading
                                ? <ActivityIndicator color="white" />
                                : <Text style={styles.reportSubmitBtnText}>Submit Report</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
    backBtn: { padding: 8 },
    backIcon: { fontSize: 22, color: '#1A202C' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A202C' },
    scrollContent: { padding: 16 },

    proCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, padding: 18, marginBottom: 16, gap: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    proAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Theme.colors.brandOrange + '20', justifyContent: 'center', alignItems: 'center' },
    proInitials: { fontSize: 24, fontWeight: 'bold', color: Theme.colors.brandOrange },
    proName: { fontSize: 17, fontWeight: 'bold', color: '#1A202C' },
    serviceName: { fontSize: 13, color: '#718096', marginTop: 2 },

    ratingCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    ratingTitle: { fontSize: 16, fontWeight: '700', color: '#2D3748', marginBottom: 20 },
    starsRow: { flexDirection: 'row', gap: 8 },
    starBtn: { padding: 4 },
    ratingLabel: { marginTop: 12, fontSize: 16, fontWeight: 'bold', color: '#F59E0B' },

    feedbackCard: { backgroundColor: 'white', borderRadius: 16, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    feedbackTitle: { fontSize: 15, fontWeight: '700', color: '#2D3748' },
    feedbackInput: { backgroundColor: '#F7FAFC', borderRadius: 12, padding: 14, fontSize: 14, color: '#1A202C', minHeight: 100, borderWidth: 1, borderColor: '#E2E8F0' },
    charCount: { textAlign: 'right', fontSize: 11, color: '#A0AEC0', marginTop: 6 },

    reportCard: { backgroundColor: '#FEF2F2', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' },
    reportTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
    reportTitle: { fontSize: 15, fontWeight: '700', color: '#991B1B', marginBottom: 4 },
    reportSub: { fontSize: 13, color: '#7F1D1D', lineHeight: 20 },
    reportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'white', borderWidth: 1.5, borderColor: '#EF4444', borderRadius: 12, paddingVertical: 12 },
    reportBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },

    noticeCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF5F0', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Theme.colors.brandOrange + '30', gap: 12 },
    noticeIcon: { fontSize: 22 },
    noticeText: { flex: 1, fontSize: 13, color: '#744210', lineHeight: 20 },
    noticeBold: { fontWeight: 'bold', color: '#C05621' },

    footer: { backgroundColor: 'white', padding: 20, borderTopWidth: 1, borderTopColor: '#EDF2F7', gap: 10 },
    submitBtn: { backgroundColor: Theme.colors.brandOrange, paddingVertical: 16, borderRadius: 14, alignItems: 'center', shadowColor: Theme.colors.brandOrange, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    skipBtn: { alignItems: 'center', paddingVertical: 6 },
    skipBtnText: { color: '#718096', fontSize: 14 },

    successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    successCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    successTitle: { fontSize: 28, fontWeight: 'bold', color: '#1A202C', marginBottom: 10 },
    successSub: { fontSize: 15, color: '#718096', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    starsDisplay: { flexDirection: 'row', gap: 4, marginBottom: 8 },
    successLabel: { fontSize: 18, fontWeight: 'bold', color: '#F59E0B', marginBottom: 32 },
    doneBtn: { backgroundColor: Theme.colors.brandOrange, paddingVertical: 16, paddingHorizontal: 48, borderRadius: 16, width: '100%', alignItems: 'center' },
    doneBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
    modalHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
    modalTitle: { flex: 1, fontSize: 17, fontWeight: 'bold', color: '#1A202C' },
    modalClose: { fontSize: 18, color: '#718096', padding: 4 },
    modalSub: { fontSize: 13, color: '#718096', marginBottom: 16 },
    reasonRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, marginBottom: 4, borderWidth: 1, borderColor: 'transparent' },
    reasonRowSelected: { backgroundColor: '#FFF5F0', borderColor: Theme.colors.brandOrange + '40' },
    reasonRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CBD5E0', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
    reasonRadioSelected: { borderColor: Theme.colors.brandOrange },
    reasonRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Theme.colors.brandOrange },
    reasonText: { fontSize: 14, color: '#4A5568', flex: 1 },
    reportSubmitBtn: { backgroundColor: '#EF4444', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 16 },
    reportSubmitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default RatingFeedbackScreen;
