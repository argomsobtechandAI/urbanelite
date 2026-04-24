import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { Theme } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { userAPI } from '../services/api';
import NotificationBell from '../components/NotificationBell';
import { formatDisplayDate } from '../utils/dateUtils';

const BookingsScreen = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
    const [bookings, setBookings] = useState<any>({ upcoming: [], completed: [], cancelled: [] });
    const [loading, setLoading] = useState(true);

    const fetchBookings = async () => {
        try {
            const response = await userAPI.getBookings();
            setBookings(response.data);
        } catch (error) {
            console.error('Failed to fetch bookings', error);
        } finally {
            setLoading(false);
        }
    };

    // Reset to 'upcoming' tab and fetch bookings every time screen comes into focus
    useFocusEffect(
        useCallback(() => {
            setActiveTab('upcoming');
            fetchBookings();
        }, [])
    );

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.logoContainer}
                onPress={() => navigation.navigate('MainTabs' as any, { screen: 'Explore' } as any)}
                activeOpacity={0.75}
            >
                <View style={styles.logoIcon}>
                    <Text style={styles.logoIconText}>⚡</Text>
                </View>
                <Text style={styles.headerTitle}>
                    <Text style={styles.titleOlfix}>OLFIX</Text>
                </Text>
            </TouchableOpacity>
            <NotificationBell navigation={navigation} />
        </View>
    );


    const renderTabs = () => (
        <View style={styles.tabsContainer}>
            {(['upcoming', 'completed', 'cancelled'] as const).map((tab) => (
                <TouchableOpacity
                    key={tab}
                    style={[styles.tab, activeTab === tab && styles.activeTab]}
                    onPress={() => setActiveTab(tab)}
                >
                    <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab.toUpperCase()}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderBookingItem = ({ item }: { item: any }) => (
        <View style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
                <View style={styles.bookingServiceInfo}>
                    <Text style={styles.bookingServiceName}>{item.service}</Text>
                    <Text style={styles.bookingDate}>{formatDisplayDate(item.date)}</Text>
                </View>
                <View style={styles.bookingStatusBox}>
                    <Text style={styles.bookingStatusText}>{item.status}</Text>
                </View>
            </View>
            <View style={styles.bookingFooter}>
                <Text style={styles.bookingPrice}>{item.price}</Text>
                <TouchableOpacity
                    style={styles.viewDetailsBtn}
                    onPress={() => navigation.navigate('BookingDetails', { bookingId: item.id })}
                >
                    <Text style={styles.viewDetailsText}>View Details</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyStateContainer}>
            <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png' }}
                style={styles.emptyStateIcon}
            />
            <Text style={styles.emptyStateTitle}>NO {activeTab.toUpperCase()} BOOKINGS</Text>
            <Text style={styles.emptyStateSubtitle}>YOUR Olfix SCHEDULE IS CLEAR.</Text>
        </View>
    );

    const currentList = bookings[activeTab] || [];

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Theme.colors.brandOrange} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {renderHeader()}
            {renderTabs()}

            {currentList.length > 0 ? (
                <FlatList
                    data={currentList}
                    renderItem={renderBookingItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                />
            ) : (
                renderEmptyState()
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },

    // Header
    header: { paddingHorizontal: 20, paddingTop: 10, marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    logoContainer: { flexDirection: 'row', alignItems: 'center' },
    logoIcon: { width: 40, height: 40, backgroundColor: Theme.colors.brandOrange, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    logoIconText: { fontSize: 24, color: 'white' },
    headerTitle: { fontSize: 22, fontWeight: 'bold' },
    titleOlfix: { color: Theme.colors.brandOrange, fontWeight: '900', fontStyle: 'italic' },
    notificationButton: { width: 40, height: 40, backgroundColor: Theme.colors.searchBg, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    notificationIcon: { width: 20, height: 20, tintColor: Theme.colors.textLight },
    notificationBadge: { width: 8, height: 8, backgroundColor: Theme.colors.brandOrange, borderRadius: 4, position: 'absolute', top: 10, right: 10, borderWidth: 1, borderColor: '#FFF' },

    // Search
    searchContainer: { paddingHorizontal: 20, marginBottom: 20 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.searchBg, borderRadius: 15, paddingHorizontal: 15, paddingVertical: 12 },
    searchInput: { marginLeft: 10, flex: 1, fontSize: 16, color: Theme.colors.textDark },
    filterIcon: { width: 20, height: 20, tintColor: Theme.colors.textLight },

    // Tabs
    tabsContainer: { flexDirection: 'row', backgroundColor: Theme.colors.searchBg, marginHorizontal: 20, borderRadius: 15, padding: 5, marginBottom: 20 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
    activeTab: { backgroundColor: Theme.colors.brandOrange },
    tabText: { fontSize: 12, fontWeight: 'bold', color: Theme.colors.textLight },
    activeTabText: { color: 'white' },

    // Empty State
    emptyStateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 },
    emptyStateIcon: { width: 100, height: 100, marginBottom: 20, opacity: 0.2 },
    emptyStateTitle: { fontSize: 18, fontWeight: 'bold', color: '#A0AEC0', marginBottom: 10, fontStyle: 'italic' },
    emptyStateSubtitle: { fontSize: 12, fontWeight: 'bold', color: '#CBD5E0', letterSpacing: 1.5 },

    // List
    listContent: { paddingHorizontal: 20, paddingBottom: 20 },
    bookingCard: { backgroundColor: 'white', padding: 20, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#F7FAFC', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    bookingServiceInfo: { flex: 1 },
    bookingServiceName: { fontSize: 18, fontWeight: 'bold', color: '#1A202C', marginBottom: 5 },
    bookingDate: { fontSize: 12, color: '#A0AEC0', fontWeight: 'bold' },
    bookingStatusBox: { backgroundColor: '#F0FFF4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    bookingStatusText: { fontSize: 10, fontWeight: 'bold', color: '#48BB78' },
    bookingFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F7FAFC', paddingTop: 15 },
    bookingPrice: { fontSize: 20, fontWeight: '900', color: '#1A202C' },
    viewDetailsBtn: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#EDF2F7', borderRadius: 10 },
    viewDetailsText: { fontSize: 12, fontWeight: 'bold', color: '#4A5568' },
});

export default BookingsScreen;
