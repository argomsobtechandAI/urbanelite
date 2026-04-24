import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { bookingAPI, paymentAPI } from '../services/api';
import { CFPaymentGatewayService } from 'react-native-cashfree-pg-sdk';
import { CFSession as CFSessionContract, CFEnvironment as CFEnvironmentContract, CFWebCheckoutPayment as CFWebCheckoutPaymentContract, CFThemeBuilder as CFThemeBuilderContract } from 'cashfree-pg-api-contract';

type BookingReviewRouteProp = RouteProp<RootStackParamList, 'BookingReview'>;

const BookingReviewScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<BookingReviewRouteProp>();
    const { item, date, slot, location, instructions, attachmentUrl, vendorId } = route.params || {};

    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState<boolean>(false);
    const currentOrderId = React.useRef<string | null>(null);

    const [paymentMode, setPaymentMode] = useState<'PREPAID' | 'POSTPAID'>('PREPAID');

    // Cleanup callback on unmount
    React.useEffect(() => {
        return () => {
            CFPaymentGatewayService.setCallback({
                onVerify: async () => { },
                onError: () => { }
            });
        };
    }, []);

    const handleConfirm = async () => {
        setLoading(true);

        if (paymentMode === 'POSTPAID') {
            await createBooking('POSTPAID');
            return;
        }

        try {
            // Prepaid Flow (Cashfree)
            const priceValue = parseFloat(String(item?.price || '0').replace(/[₹,]/g, ''));
            const orderResponse = await paymentAPI.createOrder({
                orderAmount: priceValue,
                orderCurrency: 'INR',
                customerId: 'USER_123',
                customerPhone: '9999999999',
                customerName: 'Olfix User',
                customerEmail: 'user@example.com'
            });

            const { payment_session_id, order_id } = orderResponse.data;
            currentOrderId.current = order_id;

            CFPaymentGatewayService.setCallback({
                onVerify: async (orderID: string) => {
                    if (orderID !== currentOrderId.current) return;
                    try {
                        await paymentAPI.verifyPayment({ orderId: orderID });
                        await createBooking('PREPAID');
                    } catch (error) {
                        console.error('Payment verification failed', error);
                        Alert.alert('Error', 'Payment verification failed.');
                        setLoading(false);
                    }
                },
                onError: (error: any, orderID: string) => {
                    if (orderID !== currentOrderId.current) return;
                    Alert.alert('Error', error.message || 'Payment failed');
                    setLoading(false);
                }
            });

            const session = new CFSessionContract(payment_session_id, order_id, CFEnvironmentContract.SANDBOX);
            CFPaymentGatewayService.doWebPayment(session);

        } catch (error) {
            console.error('Payment initiation error:', error);
            Alert.alert('Error', 'Failed to initiate payment.');
            setLoading(false);
        }
    };

    const [bookingConfirmed, setBookingConfirmed] = useState(false);

    const createBooking = async (mode: 'PREPAID' | 'POSTPAID') => {
        try {
            await bookingAPI.createBooking({
                serviceId: item?.id || null,
                serviceName: item?.title || 'Service',
                date: date || '',
                timeSlot: slot || '',
                location: location || { type: 'Home', address: '' },
                instructions: instructions || '',
                price: String(item?.price || '0'),   // ensure string, works with ₹500 or 500
                paymentMode: mode,
                attachmentUrl: attachmentUrl,
                vendorId: vendorId || null,
            });

            // Show confirmation popup
            setBookingConfirmed(true);
        } catch (error: any) {
            console.error('Booking creation error:', error);
            const errCode = error?.response?.data?.errorCode;
            const errMessage = error?.response?.data?.error || error?.message || 'Unknown error';
            console.log('Server error details:', JSON.stringify(error?.response?.data));
            if (errCode === 'VENDOR_SLOT_TAKEN') {
                Alert.alert(
                    '⚠️ Slot No Longer Available',
                    error.response.data.error || 'This professional is already booked for that slot. Please go back and choose a different time or professional.',
                    [
                        { text: 'Change Time', onPress: () => navigation.navigate('BookingSchedule', { item, vendorId }) },
                        { text: 'OK', style: 'cancel' },
                    ]
                );
            } else {
                Alert.alert('Booking Failed', `${errMessage}\n\nIf this persists, contact support.`);
            }
        } finally {
            setLoading(false);
        }
    };


    const handleBookingConfirmedClose = () => {
        setBookingConfirmed(false);
        // Navigate to Home tab
        navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
        });
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressStep, styles.completedStep]} />
                    <View style={[styles.progressStep, styles.completedStep]} />
                    <View style={[styles.progressStep, styles.completedStep]} />
                    <View style={[styles.progressStep, styles.completedStep]} />
                    <View style={[styles.progressStep, styles.activeStep]} />
                    <View style={styles.progressStep} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.titleContainer}>
                    <View style={styles.stepBadge}>
                        <Text style={styles.stepText}>5</Text>
                    </View>
                    <View>
                        <Text style={styles.pageTitle}>Review & Place</Text>
                        <Text style={styles.pageTitle}>Request</Text>
                        <Text style={styles.subTitle}>Select payment preferred option</Text>
                    </View>
                </View>

                {/* Service Info Mini Card */}
                <View style={styles.miniCard}>
                    <View>
                        <Text style={styles.detailLabel}>SERVICE</Text>
                        <Text style={styles.detailValue}>{item?.title || 'Service'}</Text>
                        <Text style={styles.detailSub}>{date} @ {slot}</Text>
                    </View>
                    <Text style={styles.miniPrice}>{item?.price || '₹0'}</Text>
                </View>

                {/* Payment Mode Selection */}
                <Text style={styles.sectionTitle}>Payment Method</Text>

                <TouchableOpacity
                    style={[styles.paymentOption, paymentMode === 'PREPAID' && styles.selectedOption]}
                    onPress={() => setPaymentMode('PREPAID')}
                >
                    <View style={[styles.radio, paymentMode === 'PREPAID' && styles.radioActive]} />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.optionTitle, paymentMode === 'PREPAID' && styles.selectedOptionText]}>Pay Now</Text>
                        <Text style={[styles.optionDesc, paymentMode === 'PREPAID' && styles.selectedOptionText]}>Secure online payment via Cashfree</Text>
                    </View>
                    <Text style={styles.optionPrice}>{item?.price || '₹0'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.paymentOption, paymentMode === 'POSTPAID' && styles.selectedOption]}
                    onPress={() => setPaymentMode('POSTPAID')}
                >
                    <View style={[styles.radio, paymentMode === 'POSTPAID' && styles.radioActive]} />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.optionTitle, paymentMode === 'POSTPAID' && styles.selectedOptionText]}>Pay After Service</Text>
                        <Text style={[styles.optionDesc, paymentMode === 'POSTPAID' && styles.selectedOptionText]}>Pay directly to the professional later</Text>
                    </View>
                    <Text style={styles.optionPrice}>{item?.price || '₹0'}</Text>
                </TouchableOpacity>

                {/* Part Replacement Notice */}
                <View style={styles.partsNotice}>
                    <Text style={styles.partsNoticeIcon}>🔧</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.partsNoticeTitle}>Part Replacement Policy</Text>
                        <Text style={styles.partsNoticeText}>
                            Service charge only. If parts need replacement, costs are paid directly to the provider or you may supply the parts yourself.
                        </Text>
                    </View>
                </View>

                {/* Note */}
                <View style={styles.noteContainer}>
                    <View style={styles.noteIcon}>
                        <Text style={styles.noteIconText}>ℹ️</Text>
                    </View>
                    <Text style={styles.noteText}>
                        {paymentMode === 'PREPAID' ? (
                            <Text>Full payment of <Text style={styles.noteBold}>{item?.price || '₹0'}</Text> will be charged now to confirm booking.</Text>
                        ) : (
                            <Text>No immediate payment required. You can pay after job completion.</Text>
                        )}
                    </Text>
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                {paymentMode === 'PREPAID' && (
                    <View style={{ position: 'absolute', top: -70, left: 20, right: 20, padding: 10, backgroundColor: '#FFF5F5', borderRadius: 8, borderWidth: 1, borderColor: '#FEB2B2', zIndex: 10 }}>
                        <Text style={{ color: '#C53030', fontSize: 12, fontWeight: 'bold' }}>SANDBOX MODE</Text>
                        <Text style={{ color: '#2D3748', fontSize: 10 }}>Test UPI: <Text style={{ fontWeight: 'bold' }}>testsuccess@gocashfree</Text></Text>
                    </View>
                )}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    disabled={loading}
                >
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.confirmButton, loading && styles.disabledButton]}
                    onPress={handleConfirm}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.confirmButtonText}>
                            {paymentMode === 'PREPAID' ? 'Pay & Confirm' : 'Confirm Booking'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Booking Confirmed Modal */}
            <Modal
                visible={bookingConfirmed}
                transparent
                animationType="fade"
                statusBarTranslucent
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalCheckCircle}>
                            <Text style={styles.modalCheckText}>✓</Text>
                        </View>
                        <Text style={styles.modalTitle}>Booking Confirmed!</Text>
                        <Text style={styles.modalSubtitle}>
                            Your booking for{' '}
                            <Text style={styles.modalServiceName}>{item?.title || 'the service'}</Text>
                            {' '}has been placed successfully.
                        </Text>
                        <Text style={styles.modalDetail}>📅 {date}  •  🕐 {slot}</Text>
                        <Text style={styles.modalNote}>A professional will be assigned to your booking shortly.</Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={handleBookingConfirmedClose}
                        >
                            <Text style={styles.modalButtonText}>Go to Home</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 32, alignItems: 'center', width: '100%', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
    modalCheckCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    modalCheckText: { fontSize: 40, color: '#FFF', fontWeight: 'bold' },
    modalTitle: { fontSize: 26, fontWeight: 'bold', color: '#1A202C', marginBottom: 12, textAlign: 'center' },
    modalSubtitle: { fontSize: 15, color: '#4A5568', textAlign: 'center', lineHeight: 22, marginBottom: 16 },
    modalServiceName: { fontWeight: 'bold', color: Theme.colors.brandOrange },
    modalDetail: { fontSize: 14, color: '#718096', marginBottom: 12, textAlign: 'center' },
    modalNote: { fontSize: 13, color: '#A0AEC0', textAlign: 'center', marginBottom: 28, lineHeight: 20 },
    modalButton: { backgroundColor: Theme.colors.brandOrange, paddingVertical: 16, paddingHorizontal: 48, borderRadius: 20, width: '100%', alignItems: 'center' },
    modalButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    header: { paddingHorizontal: 20, paddingTop: 10 },
    progressBar: { flexDirection: 'row', height: 4, backgroundColor: '#EDF2F7', borderRadius: 2 },
    progressStep: { flex: 1, borderRadius: 2, marginRight: 5, backgroundColor: '#EDF2F7' },
    completedStep: { backgroundColor: Theme.colors.brandOrange },
    activeStep: { backgroundColor: Theme.colors.brandOrange },

    content: { padding: 20 },

    titleContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 40 },
    stepBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: Theme.colors.brandOrange, justifyContent: 'center', alignItems: 'center', marginRight: 15, marginTop: 5 },
    stepText: { color: '#FFF', fontWeight: 'bold' },
    pageTitle: { fontSize: 32, fontWeight: 'bold', color: '#000', lineHeight: 36, },
    subTitle: { fontSize: 16, color: '#718096', marginTop: 10, fontWeight: '600' },

    detailsContainer: { marginBottom: 30 },
    detailRow: { marginBottom: 20 },
    detailLabel: { fontSize: 10, fontWeight: 'bold', color: '#A0AEC0', letterSpacing: 1.5, marginBottom: 8 },
    detailValue: { fontSize: 18, fontWeight: 'bold', color: '#1A202C' },
    detailSub: { fontSize: 14, color: '#A0AEC0', marginTop: 2 },

    miniCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F7FAFC', borderRadius: 20, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: '#EDF2F7' },
    miniPrice: { fontSize: 24, fontWeight: 'bold', color: Theme.colors.brandOrange },

    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1A202C', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },

    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 15,
        borderWidth: 2,
        borderColor: '#EDF2F7'
    },
    selectedOption: {
        borderColor: Theme.colors.brandOrange,
        backgroundColor: '#FFFAF0'
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#CBD5E0',
        marginRight: 15,
        justifyContent: 'center',
        alignItems: 'center'
    },
    radioActive: {
        borderColor: Theme.colors.brandOrange,
        backgroundColor: '#FFF'
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Theme.colors.brandOrange
    },
    optionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 2 },
    optionDesc: { fontSize: 12, color: '#718096' },
    optionPrice: { fontSize: 16, fontWeight: 'bold', color: '#4A5568', marginLeft: 10 },
    selectedOptionText: { color: '#1A202C' },

    priceContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    priceLabel: { fontSize: 20, fontWeight: 'bold', color: '#1A202C' },
    priceValue: { fontSize: 28, fontWeight: 'bold', color: Theme.colors.brandOrange },

    noteContainer: { flexDirection: 'row', backgroundColor: '#FFF5F0', borderRadius: 15, padding: 15, alignItems: 'flex-start' },
    noteIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: Theme.colors.brandOrange, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    noteIconText: { fontSize: 16 },
    noteText: { flex: 1, fontSize: 13, color: '#1A202C', lineHeight: 20 },
    noteBold: { fontWeight: 'bold', color: '#C05621' },

    partsNotice: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F0FFF4', borderRadius: 14, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#9AE6B4' },
    partsNoticeIcon: { fontSize: 20, marginRight: 12 },
    partsNoticeTitle: { fontSize: 13, fontWeight: 'bold', color: '#276749', marginBottom: 4 },
    partsNoticeText: { fontSize: 12, color: '#276749', lineHeight: 18 },

    footer: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 20, alignItems: 'center', justifyContent: 'space-between' },
    backButton: { paddingVertical: 15, paddingHorizontal: 30, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', width: '30%', alignItems: 'center' },
    backButtonText: { fontWeight: 'bold', color: '#4A5568' },
    confirmButton: { backgroundColor: Theme.colors.brandOrange, paddingVertical: 15, borderRadius: 20, width: '65%', alignItems: 'center', shadowColor: Theme.colors.brandOrange, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
    confirmButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    disabledButton: { opacity: 0.6 }
});

export default BookingReviewScreen;
