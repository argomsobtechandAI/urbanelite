import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { Theme } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { bookingAPI } from '../services/api';
import { MapPin, Calendar, Clock, MessageCircle, XCircle, Star, Flag, Wrench } from 'lucide-react-native';

type BookingDetailsRouteProp = RouteProp<RootStackParamList, 'BookingDetails'>;

const BookingDetailsScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<BookingDetailsRouteProp>();
    const { bookingId } = route.params;

    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState<any>(null);
    const [cancelling, setCancelling] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchBookingDetails();
        }, [])
    );

    const fetchBookingDetails = async () => {
        try {
            const response = await bookingAPI.getBooking(bookingId);
            setBooking(response.data.booking);
        } catch (error) {
            console.error('Failed to fetch booking:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
            { text: 'No', style: 'cancel' },
            {
                text: 'Yes, Cancel', style: 'destructive',
                onPress: async () => {
                    setCancelling(true);
                    try {
                        await bookingAPI.cancelBooking(bookingId);
                        Alert.alert('✅ Booking cancelled successfully');
                        navigation.goBack();
                    } catch (error) {
                        Alert.alert('Failed to cancel booking');
                        console.error(error);
                    } finally {
                        setCancelling(false);
                    }
                }
            }
        ]);
    };

    const handleRateAndReview = () => {
        if (!booking?.professional?.id && !booking?.vendor_id) {
            Alert.alert('No service provider found for this booking.');
            return;
        }
        navigation.navigate('RatingFeedback', {
            bookingId,
            reviewedId: booking?.vendor_id || booking?.professional?.id,
            reviewedName: booking?.professional?.name || booking?.professional_name || 'Service Provider',
            serviceName: booking?.service || booking?.service_name || 'Service',
        });
    };

    const handleReport = () => {
        if (!booking?.vendor_id && !booking?.professional?.id) {
            Alert.alert('No service provider to report.');
            return;
        }
        navigation.navigate('RatingFeedback', {
            bookingId,
            reviewedId: booking?.vendor_id || booking?.professional?.id,
            reviewedName: booking?.professional?.name || booking?.professional_name || 'Service Provider',
            serviceName: booking?.service || booking?.service_name || 'Service',
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Theme.colors.brandOrange} />
            </SafeAreaView>
        );
    }

    if (!booking) {
        return (
            <SafeAreaView style={[styles.container, styles.center]}>
                <Text>Booking not found</Text>
            </SafeAreaView>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'PENDING': return '#F59E0B';
            case 'CONFIRMED': return '#F59E0B';
            case 'ACCEPTED': return '#3B82F6';
            case 'ACTIVE': return '#10B981';
            case 'COMPLETED': return '#059669';
            case 'CANCELLED': return '#EF4444';
            default: return '#6B7280';
        }
    };

    const isCompleted = booking.status?.toUpperCase() === 'COMPLETED';
    const isActive = ['PENDING', 'CONFIRMED', 'ACCEPTED'].includes(booking.status?.toUpperCase());

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Booking Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Status Section */}
                <View style={styles.statusSection}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                            {booking.status?.toUpperCase()}
                        </Text>
                    </View>
                    <Text style={styles.priceText}>{booking.price}</Text>
                </View>

                {/* Service Card */}
                <View style={styles.card}>
                    <Text style={styles.serviceName}>{booking.service}</Text>
                    <View style={styles.row}>
                        <Calendar size={16} color={Theme.colors.textLight} />
                        <Text style={styles.rowText}>{booking.date}</Text>
                    </View>
                    <View style={styles.row}>
                        <Clock size={16} color={Theme.colors.textLight} />
                        <Text style={styles.rowText}>{booking.timeSlot}</Text>
                    </View>
                </View>

                {/* Professional Section */}
                {booking.professional && booking.professional.name && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Service Provider</Text>
                        <View style={styles.proRow}>
                            <View style={styles.proAvatar}>
                                <Text style={styles.proInitials}>{booking.professional.name[0]}</Text>
                            </View>
                            <View style={styles.proInfo}>
                                <Text style={styles.proName}>{booking.professional.name}</Text>
                                <Text style={styles.proSub}>Verified Professional</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.chatBtn}
                                onPress={() => navigation.navigate('Chat', {
                                    bookingId: bookingId,
                                    professionalName: booking.professional.name
                                })}
                            >
                                <MessageCircle size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Location */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Location</Text>
                    <View style={styles.row}>
                        <MapPin size={16} color={Theme.colors.textLight} />
                        <Text style={styles.rowText}>{booking.location?.address}</Text>
                    </View>
                </View>

                {/* Part Replacement Notice */}
                <View style={styles.partsNotice}>
                    <Wrench size={18} color={Theme.colors.brandOrange} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.partsNoticeTitle}>Part Replacement Policy</Text>
                        <Text style={styles.partsNoticeText}>
                            Our service charge covers only the labour. If parts need replacement, the cost is paid directly to the service provider — or you may provide the parts yourself.
                        </Text>
                    </View>
                </View>

                {/* Actions based on status */}
                <View style={styles.actions}>
                    {/* Completed: Show Rate & Report buttons */}
                    {isCompleted && (
                        <>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#FEF3C7' }]}
                                onPress={handleRateAndReview}
                            >
                                <Star size={20} color="#D97706" />
                                <Text style={[styles.actionBtnText, { color: '#D97706' }]}>Rate & Give Feedback</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#FEE2E2', marginTop: 10 }]}
                                onPress={handleReport}
                            >
                                <Flag size={20} color="#EF4444" />
                                <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Report Misbehaviour</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Active bookings: Show Cancel button */}
                    {isActive && (
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#FEE2E2', marginTop: 15 }]}
                            onPress={handleCancel}
                            disabled={cancelling}
                        >
                            {cancelling ? (
                                <ActivityIndicator size="small" color="#EF4444" />
                            ) : (
                                <>
                                    <XCircle size={20} color="#EF4444" />
                                    <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Cancel Booking</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7FAFC' },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: 'white' },
    backButton: { padding: 10 },
    backIcon: { fontSize: 24, color: '#1A202C' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    scrollContent: { padding: 20 },

    statusSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    statusText: { fontWeight: 'bold', fontSize: 12 },
    priceText: { fontSize: 24, fontWeight: 'bold', color: Theme.colors.brandOrange },

    card: { backgroundColor: 'white', padding: 20, borderRadius: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    serviceName: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#1A202C' },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    rowText: { marginLeft: 10, color: '#4A5568', fontSize: 15 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#2D3748' },

    proRow: { flexDirection: 'row', alignItems: 'center' },
    proAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EDF2F7', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    proInitials: { fontSize: 20, fontWeight: 'bold', color: Theme.colors.brandOrange },
    proInfo: { flex: 1 },
    proName: { fontSize: 16, fontWeight: 'bold' },
    proSub: { fontSize: 13, color: '#718096' },
    chatBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.colors.brandOrange, justifyContent: 'center', alignItems: 'center' },

    partsNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#FFF5F0', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Theme.colors.brandOrange + '30' },
    partsNoticeTitle: { fontSize: 14, fontWeight: 'bold', color: '#C05621', marginBottom: 4 },
    partsNoticeText: { fontSize: 12, color: '#744210', lineHeight: 18 },

    actions: { marginTop: 4 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 10 },
    actionBtnText: { fontWeight: 'bold', fontSize: 15 },
});

export default BookingDetailsScreen;
