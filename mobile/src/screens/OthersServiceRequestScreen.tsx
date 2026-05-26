import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
    Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { Theme } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { adminRequestAPI } from '../services/api';
import {
    ArrowLeft, Calendar, Clock, MapPin, FileText,
    Send, Sparkles, Phone,
} from 'lucide-react-native';
import { maskDateInput, parseDisplayDateToISO } from '../utils/dateUtils';

type OthersServiceRequestRouteProp = RouteProp<RootStackParamList, 'OthersServiceRequest'>;

const TIME_SLOTS = [
    '08:00 AM - 10:00 AM',
    '10:00 AM - 12:00 PM',
    '12:00 PM - 02:00 PM',
    '02:00 PM - 04:00 PM',
    '04:00 PM - 06:00 PM',
    '06:00 PM - 08:00 PM',
];

const OthersServiceRequestScreen = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const route = useRoute<OthersServiceRequestRouteProp>();
    const {
        serviceName,
        serviceItemId,
        categoryId,
        categoryName,
        subcategoryId,
        subcategoryName,
    } = route.params;

    const [description, setDescription] = useState('');
    const [preferredDate, setPreferredDate] = useState('');
    const [preferredTime, setPreferredTime] = useState('');
    const [address, setAddress] = useState('');
    const [contactNote, setContactNote] = useState('');
    const [loading, setLoading] = useState(false);

    // Simple date validation helper
    const isValidDate = (val: string) => /^\d{2}-\d{2}-\d{4}$/.test(val);

    const handleSubmit = async () => {
        if (!description.trim()) {
            Alert.alert('Required', 'Please describe what service/help you need.');
            return;
        }
        if (!address.trim()) {
            Alert.alert('Required', 'Please enter your address or location.');
            return;
        }

        setLoading(true);
        try {
            const response = await adminRequestAPI.submitRequest({
                categoryId,
                categoryName: categoryName || 'Others',
                subcategoryId,
                subcategoryName,
                serviceItemId,
                serviceName,
                description: description + (contactNote ? `\n\nAdditional Notes: ${contactNote}` : ''),
                preferredDate: parseDisplayDateToISO(preferredDate),
                preferredTime,
                location: {
                    type: 'Home',
                    address,
                },
            });

            if (response.data.success) {
                navigation.navigate('OthersRequestSuccess', { requestId: response.data.requestId });
            }
        } catch (error: any) {
            console.error('Failed to submit request:', error);
            Alert.alert(
                'Submission Failed',
                error.response?.data?.error || 'Failed to submit your request. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={22} color="#2D3748" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>{serviceName}</Text>
                        <Text style={styles.headerSubtitle}>Send Request to Admin</Text>
                    </View>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Banner Info Card */}
                    <View style={styles.infoBanner}>
                        <Sparkles size={20} color={Theme.colors.brandOrange} style={{ marginRight: 10 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.infoBannerTitle}>On-Demand Service</Text>
                            <Text style={styles.infoBannerText}>
                                Pricing will be discussed after our team reviews your request. We'll contact you shortly.
                            </Text>
                        </View>
                    </View>

                    {/* Service Details */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <FileText size={18} color={Theme.colors.brandOrange} />
                            <Text style={styles.sectionTitle}>Service Details</Text>
                        </View>
                        {subcategoryName ? (
                            <View style={styles.tagRow}>
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>{categoryName || 'Others'}</Text>
                                </View>
                                <Text style={styles.tagArrow}>›</Text>
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>{subcategoryName}</Text>
                                </View>
                                <Text style={styles.tagArrow}>›</Text>
                                <View style={[styles.tag, styles.tagActive]}>
                                    <Text style={[styles.tagText, { color: '#fff' }]}>{serviceName}</Text>
                                </View>
                            </View>
                        ) : null}

                        <Text style={styles.label}>Describe your requirement *</Text>
                        <TextInput
                            style={styles.textArea}
                            placeholder="Please describe in detail what you need, any specific requirements, or questions you have..."
                            placeholderTextColor="#A0AEC0"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Preferred Date & Time */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Calendar size={18} color={Theme.colors.brandOrange} />
                            <Text style={styles.sectionTitle}>Preferred Schedule (Optional)</Text>
                        </View>

                        <Text style={styles.label}>Preferred Date (DD-MM-YYYY)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 25-02-2026"
                            placeholderTextColor="#A0AEC0"
                            value={preferredDate}
                            onChangeText={(t) => setPreferredDate(maskDateInput(t))}
                            keyboardType="number-pad"
                            maxLength={10}
                        />

                        <Text style={styles.label}>Preferred Time Slot</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeSlotScroll}>
                            {TIME_SLOTS.map(slot => (
                                <TouchableOpacity
                                    key={slot}
                                    style={[styles.timeSlot, preferredTime === slot && styles.timeSlotActive]}
                                    onPress={() => setPreferredTime(slot === preferredTime ? '' : slot)}
                                >
                                    <Clock
                                        size={12}
                                        color={preferredTime === slot ? '#fff' : Theme.colors.brandOrange}
                                        style={{ marginRight: 4 }}
                                    />
                                    <Text style={[styles.timeSlotText, preferredTime === slot && styles.timeSlotTextActive]}>
                                        {slot}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Location */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MapPin size={18} color={Theme.colors.brandOrange} />
                            <Text style={styles.sectionTitle}>Service Location</Text>
                        </View>
                        <Text style={styles.label}>Full Address *</Text>
                        <TextInput
                            style={[styles.textArea, { height: 80 }]}
                            placeholder="Enter your full address where the service is needed..."
                            placeholderTextColor="#A0AEC0"
                            value={address}
                            onChangeText={setAddress}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Additional Notes */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Phone size={18} color={Theme.colors.brandOrange} />
                            <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Best time to call, special instructions, etc."
                            placeholderTextColor="#A0AEC0"
                            value={contactNote}
                            onChangeText={setContactNote}
                        />
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Send size={18} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.submitButtonText}>Submit Request to Admin</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.disclaimer}>
                        By submitting, you agree our team will contact you via the registered phone/email to discuss pricing and scheduling.
                    </Text>

                    <View style={{ height: 30 }} />
                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    safeArea: { flex: 1 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        backgroundColor: '#fff',
    },
    backButton: {
        width: 40, height: 40,
        borderRadius: 12,
        backgroundColor: '#F7FAFC',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 12,
    },
    headerTitleContainer: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A202C' },
    headerSubtitle: { fontSize: 12, color: Theme.colors.brandOrange, fontWeight: '600', marginTop: 2 },

    scrollContent: { padding: 20 },

    infoBanner: {
        flexDirection: 'row',
        backgroundColor: '#FFF8F0',
        borderRadius: 14,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FDDCB5',
        alignItems: 'flex-start',
    },
    infoBannerTitle: { fontSize: 14, fontWeight: '700', color: '#974A00', marginBottom: 4 },
    infoBannerText: { fontSize: 12, color: '#C05621', lineHeight: 18 },

    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#2D3748', marginLeft: 8 },

    tagRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 12, gap: 6 },
    tag: {
        backgroundColor: '#EDF2F7',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    tagActive: { backgroundColor: Theme.colors.brandOrange },
    tagText: { fontSize: 11, fontWeight: '600', color: '#4A5568' },
    tagArrow: { fontSize: 16, color: '#CBD5E0' },

    label: { fontSize: 13, fontWeight: '600', color: '#4A5568', marginBottom: 8, marginTop: 4 },

    input: {
        backgroundColor: '#F7FAFC',
        borderRadius: 12,
        padding: 14,
        fontSize: 14,
        color: '#2D3748',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 4,
    },
    textArea: {
        backgroundColor: '#F7FAFC',
        borderRadius: 12,
        padding: 14,
        fontSize: 14,
        color: '#2D3748',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        height: 120,
        marginBottom: 4,
    },

    timeSlotScroll: { marginBottom: 4 },
    timeSlot: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7FAFC',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    timeSlotActive: {
        backgroundColor: Theme.colors.brandOrange,
        borderColor: Theme.colors.brandOrange,
    },
    timeSlotText: { fontSize: 11, fontWeight: '600', color: '#4A5568' },
    timeSlotTextActive: { color: '#fff' },

    submitButton: {
        flexDirection: 'row',
        backgroundColor: Theme.colors.brandOrange,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        shadowColor: Theme.colors.brandOrange,
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    submitButtonDisabled: { opacity: 0.6 },
    submitButtonText: { fontSize: 16, fontWeight: '800', color: '#fff' },

    disclaimer: {
        fontSize: 11,
        color: '#A0AEC0',
        textAlign: 'center',
        marginTop: 14,
        lineHeight: 18,
        paddingHorizontal: 10,
    },
});

export default OthersServiceRequestScreen;
