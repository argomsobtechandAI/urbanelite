import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { bookingAPI } from '../services/api';

type BookingScheduleRouteProp = RouteProp<RootStackParamList, 'BookingSchedule'>;

// Generate next 7 days as date options
const buildDays = () => {
    const days = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() + i);
        const weekday = d.toLocaleDateString('en-IN', { weekday: 'short' });
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();
        // ISO date string for the API query (YYYY-MM-DD)
        const iso = d.toISOString().split('T')[0];
        const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${day}-${month}-${year}`;
        days.push({ label, value: iso });
    }
    return days;
};

const ALL_SLOTS = [
    '09:00 AM', '11:00 AM',
    '01:00 PM', '03:00 PM',
    '05:00 PM', '07:00 PM',
];

const BookingScheduleScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<BookingScheduleRouteProp>();
    const { item } = route.params || {};
    const insets = useSafeAreaInsets();

    const days = buildDays();

    const [selectedDate, setSelectedDate] = useState(days[0].value);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Extract vendorId if a vendor was selected upstream
    const vendorId: string | undefined = item?.provider?.id || item?.vendorId;

    const fetchBookedSlots = useCallback(async (date: string) => {
        if (!vendorId) return; // No vendor selected → no availability to check
        setLoadingSlots(true);
        setSelectedSlot(''); // reset selection when date changes
        try {
            const res = await bookingAPI.getVendorAvailability(vendorId, date);
            setBookedSlots(res.data?.bookedSlots || []);
        } catch (err) {
            console.warn('Could not fetch vendor availability:', err);
            setBookedSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    }, [vendorId]);

    useEffect(() => {
        fetchBookedSlots(selectedDate);
    }, [selectedDate, fetchBookedSlots]);

    // When date chip changes, auto-deselect slot if it was booked
    const handleDateChange = (dateValue: string) => {
        setSelectedDate(dateValue);
        setSelectedSlot(''); // force re-pick when date changes
    };

    const handleSlotSelect = (slot: string) => {
        if (bookedSlots.includes(slot)) return; // blocked
        setSelectedSlot(slot);
    };

    const canContinue = !!selectedSlot && !bookedSlots.includes(selectedSlot);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressStep, styles.completedStep]} />
                    <View style={[styles.progressStep, styles.activeStep]} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.titleContainer}>
                    <View style={styles.stepBadge}>
                        <Text style={styles.stepText}>2</Text>
                    </View>
                    <View>
                        <Text style={styles.pageTitle}>Schedule</Text>
                        <Text style={styles.pageTitle}>Appointment</Text>
                        <Text style={styles.subTitle}>Select your preferred availability</Text>
                    </View>
                </View>

                {/* Vendor notice if availability loaded */}
                {vendorId && (
                    <View style={styles.availabilityNotice}>
                        <Text style={styles.availabilityNoticeText}>
                            🗓️ Showing real-time availability for your selected professional
                        </Text>
                    </View>
                )}

                {/* Date Selection */}
                <Text style={styles.sectionLabel}>PICK A DAY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
                    {days.map((day) => (
                        <TouchableOpacity
                            key={day.value}
                            style={[styles.dateButton, selectedDate === day.value && styles.selectedButton]}
                            onPress={() => handleDateChange(day.value)}
                        >
                            <Text style={[styles.dateText, selectedDate === day.value && styles.selectedText]}>
                                {day.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Time Slots */}
                <View style={styles.slotsHeader}>
                    <Text style={[styles.sectionLabel, { marginTop: 30, marginBottom: 0 }]}>AVAILABLE SLOTS</Text>
                    {loadingSlots && (
                        <ActivityIndicator size="small" color={Theme.colors.brandOrange} style={{ marginTop: 28 }} />
                    )}
                </View>

                <View style={styles.gridContainer}>
                    {ALL_SLOTS.map((slot) => {
                        const isBooked = bookedSlots.includes(slot);
                        const isSelected = selectedSlot === slot;
                        return (
                            <TouchableOpacity
                                key={slot}
                                style={[
                                    styles.slotButton,
                                    isSelected && styles.selectedButton,
                                    isBooked && styles.bookedButton,
                                ]}
                                onPress={() => handleSlotSelect(slot)}
                                disabled={isBooked}
                                activeOpacity={isBooked ? 1 : 0.7}
                            >
                                <Text style={[
                                    styles.slotText,
                                    isSelected && styles.selectedText,
                                    isBooked && styles.bookedText,
                                ]}>
                                    {slot}
                                </Text>
                                {isBooked && (
                                    <Text style={styles.bookedLabel}>Booked</Text>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {bookedSlots.length > 0 && (
                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: Theme.colors.brandOrange }]} />
                            <Text style={styles.legendText}>Selected</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#E2E8F0' }]} />
                            <Text style={styles.legendText}>Booked</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#F7FAFC' }]} />
                            <Text style={styles.legendText}>Available</Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.continueButton, !canContinue && styles.disabledButton]}
                    disabled={!canContinue}
                    onPress={() => {
                        navigation.navigate('BookingLocation', {
                            item,
                            date: selectedDate,
                            slot: selectedSlot,
                            vendorId,
                        });
                    }}
                >
                    <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { paddingHorizontal: 20, paddingTop: 10 },
    progressBar: { flexDirection: 'row', height: 4, backgroundColor: '#EDF2F7', borderRadius: 2 },
    progressStep: { flex: 1, borderRadius: 2, marginRight: 5 },
    completedStep: { backgroundColor: Theme.colors.brandOrange },
    activeStep: { backgroundColor: Theme.colors.brandOrange },

    content: { padding: 20 },

    titleContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 30 },
    stepBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: Theme.colors.brandOrange, justifyContent: 'center', alignItems: 'center', marginRight: 15, marginTop: 5 },
    stepText: { color: '#FFF', fontWeight: 'bold' },
    pageTitle: { fontSize: 32, fontWeight: 'bold', color: '#000', lineHeight: 36 },
    subTitle: { fontSize: 16, color: '#718096', marginTop: 10, fontWeight: '600', maxWidth: 200 },

    availabilityNotice: {
        backgroundColor: '#EBF8FF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#BEE3F8',
    },
    availabilityNoticeText: { fontSize: 13, color: '#2B6CB0', fontWeight: '500' },

    sectionLabel: { fontSize: 10, fontWeight: 'bold', color: '#A0AEC0', letterSpacing: 1.5, marginBottom: 15, textTransform: 'uppercase' },

    // Horizontal date scroll
    dateScroll: { marginBottom: 5 },
    dateButton: {
        backgroundColor: '#F7FAFC',
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderRadius: 20,
        alignItems: 'center',
        marginRight: 10,
        minWidth: 100,
    },
    dateText: { fontSize: 13, fontWeight: '700', color: '#4A5568' },

    slotsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },

    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 15 },

    slotButton: {
        width: '48%',
        backgroundColor: '#F7FAFC',
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    slotText: { fontSize: 15, fontWeight: '700', color: '#4A5568' },

    bookedButton: {
        backgroundColor: '#EDF2F7',
        borderColor: '#E2E8F0',
        opacity: 0.7,
    },
    bookedText: { color: '#A0AEC0', textDecorationLine: 'line-through' },
    bookedLabel: { fontSize: 10, color: '#FC8181', fontWeight: '700', marginTop: 3, letterSpacing: 0.5 },

    selectedButton: { backgroundColor: Theme.colors.brandOrange, borderColor: Theme.colors.brandOrange },
    selectedText: { color: '#FFF' },

    legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 5, marginBottom: 10 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E0' },
    legendText: { fontSize: 12, color: '#718096' },

    footer: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 20, alignItems: 'center', justifyContent: 'space-between' },
    backButton: { paddingVertical: 15, paddingHorizontal: 30, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', width: '30%', alignItems: 'center' },
    backButtonText: { fontWeight: 'bold', color: '#4A5568' },
    continueButton: { backgroundColor: Theme.colors.brandOrange, paddingVertical: 15, borderRadius: 20, width: '65%', alignItems: 'center', shadowColor: Theme.colors.brandOrange, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
    continueButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    disabledButton: { opacity: 0.5 },
});

export default BookingScheduleScreen;
