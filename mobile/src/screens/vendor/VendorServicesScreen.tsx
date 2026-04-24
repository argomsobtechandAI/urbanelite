import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Theme } from '../../theme';
import { vendorAPI } from '../../services/api';
import { Briefcase, CheckCircle2, Clock, ShieldAlert, ArrowLeft } from 'lucide-react-native';

const VendorServicesScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState<any[]>([]);
    const [updatingMap, setUpdatingMap] = useState<Record<string, boolean>>({});

    useFocusEffect(
        useCallback(() => {
            fetchServices();
        }, [])
    );

    const fetchServices = async () => {
        try {
            const response = await vendorAPI.getServices();
            setServices(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch services:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateService = async (serviceId: string, customPrice: string, customDuration: string, isEnabled: boolean) => {
        setUpdatingMap(prev => ({ ...prev, [serviceId]: true }));
        try {
            const response = await vendorAPI.updateServiceItem({
                serviceItemId: serviceId,
                customPrice,
                customDuration: customDuration ? parseInt(customDuration) : undefined,
                isEnabled
            });
            if (response.data.success) {
                setServices(prev => prev.map(s =>
                    s.id === serviceId ? { ...s, customPrice, customDuration: customDuration ? parseInt(customDuration) : null, isEnabled } : s
                ));
                Alert.alert('Amount updated', 'Price has been updated', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error: any) {
            Alert.alert('Update Failed', error.response?.data?.error || 'Could not update service.');
        } finally {
            setUpdatingMap(prev => ({ ...prev, [serviceId]: false }));
        }
    };

    const onPriceChange = (serviceId: string, text: string) => {
        setServices(prev => prev.map(s => s.id === serviceId ? { ...s, customPrice: text } : s));
    };

    const onDurationChange = (serviceId: string, text: string) => {
        setServices(prev => prev.map(s => s.id === serviceId ? { ...s, customDuration: text } : s));
    };

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
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <ArrowLeft size={22} color={Theme.colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Services</Text>
                <Text style={styles.headerSubtitle}>Set your pricing & duration for each service</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
                {services.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No services assigned to you yet.{'\n'}Contact admin to get services assigned.</Text>
                    </View>
                ) : (
                    services.map((service) => (
                        <View key={service.id} style={[styles.serviceCard, !service.isEnabled && styles.disabledCard]}>
                            <View style={styles.serviceMain}>
                                {/* Top Row: Icon + Info + Toggle */}
                                <View style={styles.serviceTop}>
                                    <View style={styles.serviceIconContainer}>
                                        {service.image ? (
                                            <Image source={{ uri: service.image }} style={styles.serviceImage} />
                                        ) : (
                                            <Briefcase size={24} color={Theme.colors.brandOrange} />
                                        )}
                                    </View>
                                    <View style={styles.serviceInfo}>
                                        <Text style={styles.serviceName}>{service.name}</Text>
                                        <Text style={styles.basePriceBadge}>
                                            Catalog: {service.basePrice || 'N/A'} · {service.baseDuration ? `${service.baseDuration} mins` : 'N/A'}
                                        </Text>
                                    </View>
                                    <Switch
                                        value={service.isEnabled}
                                        onValueChange={(val) => handleUpdateService(service.id, service.customPrice, String(service.customDuration ?? ''), val)}
                                        trackColor={{ false: '#E2E8F0', true: Theme.colors.brandOrange }}
                                        thumbColor="#FFF"
                                    />
                                </View>

                                {/* Admin Override Notice */}
                                {(service.priceUpdatedBy === 'ADMIN' || service.durationUpdatedBy === 'ADMIN') && (
                                    <View style={styles.adminNotice}>
                                        <ShieldAlert size={13} color="#3B82F6" />
                                        <Text style={styles.adminNoticeText}>
                                            Admin has overridden{' '}
                                            {service.priceUpdatedBy === 'ADMIN' && service.durationUpdatedBy === 'ADMIN'
                                                ? 'price & duration'
                                                : service.priceUpdatedBy === 'ADMIN' ? 'price' : 'duration'}
                                        </Text>
                                    </View>
                                )}

                                {/* Price + Duration Row */}
                                <View style={styles.editSection}>
                                    {/* Price Field */}
                                    <View style={styles.fieldBlock}>
                                        <Text style={styles.fieldLabel}>My Price (₹)</Text>
                                        <View style={[styles.inputWrapper, service.priceUpdatedBy === 'ADMIN' && styles.inputOverridden]}>
                                            <Text style={styles.currencyPrefix}>₹</Text>
                                            <TextInput
                                                style={styles.priceInput}
                                                value={service.customPrice != null ? String(service.customPrice) : ''}
                                                placeholder={service.basePrice || 'Set price'}
                                                keyboardType="numeric"
                                                onChangeText={(text) => onPriceChange(service.id, text)}
                                                editable={!updatingMap[service.id]}
                                            />
                                        </View>
                                    </View>

                                    {/* Duration Field */}
                                    <View style={styles.fieldBlock}>
                                        <Text style={styles.fieldLabel}>Duration (mins)</Text>
                                        <View style={[styles.inputWrapper, service.durationUpdatedBy === 'ADMIN' && styles.inputOverridden]}>
                                            <Clock size={14} color="#94A3B8" style={{ marginRight: 4 }} />
                                            <TextInput
                                                style={styles.priceInput}
                                                value={service.customDuration != null ? String(service.customDuration) : ''}
                                                placeholder={service.baseDuration || 'Set mins'}
                                                keyboardType="numeric"
                                                onChangeText={(text) => onDurationChange(service.id, text)}
                                                editable={!updatingMap[service.id]}
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* Save Button */}
                                <TouchableOpacity
                                    style={[styles.saveButton, updatingMap[service.id] && styles.buttonDisabled]}
                                    onPress={() => handleUpdateService(service.id, service.customPrice, String(service.customDuration ?? ''), service.isEnabled)}
                                    disabled={updatingMap[service.id]}
                                >
                                    {updatingMap[service.id] ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <>
                                            <CheckCircle2 size={16} color="#FFF" />
                                            <Text style={styles.saveButtonText}>Save Changes</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { paddingHorizontal: 20, paddingTop: 24, marginBottom: 20 },
    backButton: {
        width: 40,
        height: 40,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerTitle: { fontSize: 32, fontWeight: '900', color: Theme.colors.textDark, letterSpacing: -0.5 },
    headerSubtitle: { fontSize: 14, color: '#64748B', marginTop: 6, fontWeight: '500' },

    content: { flex: 1, paddingHorizontal: 20 },

    serviceCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    disabledCard: {
        opacity: 0.6,
        backgroundColor: '#F1F5F9',
    },
    serviceMain: { width: '100%' },
    serviceTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    serviceIconContainer: {
        width: 56,
        height: 56,
        backgroundColor: '#FFF7ED',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    serviceImage: { width: 40, height: 40, borderRadius: 8 },
    serviceInfo: { flex: 1 },
    serviceName: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
    basePriceBadge: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },

    adminNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 7,
        marginBottom: 14,
        gap: 6,
    },
    adminNoticeText: { fontSize: 12, color: '#3B82F6', fontWeight: '600', flex: 1 },

    editSection: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 14,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 14,
    },
    fieldBlock: { flex: 1 },
    fieldLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },

    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 12,
        height: 46,
    },
    inputOverridden: {
        borderColor: '#93C5FD',
        backgroundColor: '#EFF6FF',
    },
    currencyPrefix: { fontSize: 15, color: '#64748B', fontWeight: '700', marginRight: 4 },
    priceInput: { flex: 1, fontSize: 15, color: '#1E293B', fontWeight: '700', padding: 0 },

    saveButton: {
        backgroundColor: Theme.colors.brandOrange,
        paddingVertical: 13,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    buttonDisabled: { backgroundColor: '#94A3B8' },
    saveButtonText: { color: '#FFF', fontWeight: '800', fontSize: 15 },

    emptyState: { padding: 60, alignItems: 'center' },
    emptyStateText: { fontSize: 15, color: '#94A3B8', textAlign: 'center', fontWeight: '500', lineHeight: 24 },
});

export default VendorServicesScreen;
