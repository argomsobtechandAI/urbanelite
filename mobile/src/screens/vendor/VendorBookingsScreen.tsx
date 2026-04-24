import { Theme } from '../../theme';
import { vendorAPI } from '../../services/api';
import { CheckCircle, XCircle, Clock, MessageCircle } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDisplayDate } from '../../utils/dateUtils';

const VendorBookingsScreen = () => {
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<any[]>([]);
    const [selectedTab, setSelectedTab] = useState<'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('PENDING');

    // Reset to PENDING tab every time screen comes into focus, then fetch
    useFocusEffect(
        useCallback(() => {
            setSelectedTab('PENDING');
        }, [])
    );

    // Re-fetch whenever selected tab changes
    useEffect(() => {
        fetchBookings();
    }, [selectedTab]);

    const fetchBookings = async () => {
        try {
            const response = await vendorAPI.getBookings(selectedTab);
            setBookings(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (bookingId: string, status: string) => {
        try {
            await vendorAPI.updateBookingStatus(bookingId, status);
            fetchBookings();
        } catch (error: any) {
            console.error('Failed to update booking status:', error);
            const errMessage = error?.response?.data?.error || error?.message || 'Unknown error';
            const detail = error?.response?.data?.detail;
            Alert.alert('Update Failed', `${errMessage}${detail ? `\n\nDetail: ${detail}` : ''}`);
        }
    };

    const renderTabs = () => (
        <View style={styles.tabsContainer}>
            {(['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
                <TouchableOpacity
                    key={tab}
                    style={[styles.tab, selectedTab === tab && styles.tabActive]}
                    onPress={() => setSelectedTab(tab)}
                >
                    <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                        {tab.charAt(0) + tab.slice(1).toLowerCase()}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Theme.colors.brandOrange} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.headerTitle}>Bookings</Text>
                </View>
                <Text style={styles.headerSubtitle}>Manage service requests</Text>
            </View>

            {renderTabs()}

            <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
                {bookings.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No {selectedTab.toLowerCase()} bookings</Text>
                    </View>
                ) : (
                    bookings.map((booking) => (
                        <View key={booking.id} style={styles.bookingCard}>
                            <View style={styles.bookingHeader}>
                                <Text style={styles.bookingService}>{booking.service_name}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                                        <Text style={styles.statusText}>{booking.status}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => navigation.navigate('Chat', {
                                        bookingId: booking.id,
                                        professionalName: booking.users?.name || 'Customer',
                                        professionalImage: undefined
                                    })}>
                                        <MessageCircle size={22} color={Theme.colors.brandOrange} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <Text style={styles.bookingDate}>{formatDisplayDate(booking.date)} • {booking.time_slot}</Text>
                            <Text style={styles.bookingLocation}>{booking.location?.address || 'No location'}</Text>
                            <Text style={styles.bookingPrice}>{booking.price}</Text>

                            {selectedTab === 'PENDING' && (
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: '#10B981' }]}
                                        onPress={() => handleUpdateStatus(booking.id, 'ACCEPTED')}
                                    >
                                        <CheckCircle size={16} color="#FFF" />
                                        <Text style={styles.actionButtonText}>Accept</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
                                        onPress={() => handleUpdateStatus(booking.id, 'CANCELLED')}
                                    >
                                        <XCircle size={16} color="#FFF" />
                                        <Text style={styles.actionButtonText}>Reject</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {selectedTab === 'ACTIVE' && (
                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: Theme.colors.brandOrange, marginTop: 10 }]}
                                    onPress={() => handleUpdateStatus(booking.id, 'COMPLETED')}
                                >
                                    <CheckCircle size={16} color="#FFF" />
                                    <Text style={styles.actionButtonText}>Mark Complete</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))
                )}
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'PENDING': return '#FEF3C7';
        case 'ACCEPTED':
        case 'ACTIVE': return '#DBEAFE';
        case 'COMPLETED': return '#D1FAE5';
        case 'CANCELLED': return '#FEE2E2';
        default: return '#F3F4F6';
    }
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    header: { paddingHorizontal: 20, paddingTop: 20, marginBottom: 20 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: Theme.colors.textDark },
    headerSubtitle: { fontSize: 14, color: Theme.colors.textLight, marginTop: 5 },

    tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: Theme.colors.brandOrange },
    tabText: { fontSize: 13, fontWeight: '600', color: Theme.colors.textLight },
    tabTextActive: { color: Theme.colors.brandOrange },

    content: { flex: 1, paddingHorizontal: 20 },

    bookingCard: { backgroundColor: '#FFFFFF', borderRadius: 15, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
    bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    bookingService: { fontSize: 16, fontWeight: 'bold', color: Theme.colors.textDark, flex: 1 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: 'bold', color: Theme.colors.textDark },
    bookingDate: { fontSize: 13, color: Theme.colors.textLight, marginBottom: 5 },
    bookingLocation: { fontSize: 13, color: Theme.colors.textLight, marginBottom: 5 },
    bookingPrice: { fontSize: 16, fontWeight: 'bold', color: Theme.colors.brandOrange, marginBottom: 10 },

    actionButtons: { flexDirection: 'row', gap: 10, marginTop: 10 },
    actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 5 },
    actionButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

    emptyState: { padding: 40, alignItems: 'center' },
    emptyStateText: { fontSize: 14, color: Theme.colors.textLight },
});

export default VendorBookingsScreen;
