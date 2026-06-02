import { ArrowLeft, Bell, Tag, IndianRupee } from 'lucide-react-native';
import { Theme } from '../../theme';
import { userAPI } from '../../services/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const VendorNotificationSettingsScreen = () => {
    const navigation = useNavigation();
    const [settings, setSettings] = useState({
        bookingUpdates: true,
        offers: true,
        reminders: true,
        newLeads: true,
        payouts: true
    });

    // Maps UI key -> actual DB column name
    const MAPPING: { [key: string]: string } = {
        bookingUpdates: 'booking_updates',
        offers: 'offers_promotions',
        reminders: 'service_reminders',
        newLeads: 'new_leads',
        payouts: 'payouts'
    };

    const REVERSE_MAPPING: { [key: string]: string } = Object.entries(MAPPING).reduce((acc, [k, v]) => ({ ...acc, [v]: k }), {});

    useFocusEffect(
        useCallback(() => {
            loadSettings();
        }, [])
    );

    const loadSettings = async () => {
        try {
            const response = await userAPI.getNotificationSettings();
            if (response.data) {
                const mappedData: any = {};
                Object.entries(response.data).forEach(([key, value]) => {
                    if (REVERSE_MAPPING[key]) {
                        mappedData[REVERSE_MAPPING[key]] = value;
                    }
                });
                setSettings(prev => ({ ...prev, ...mappedData }));
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const toggleSwitch = async (key: string, value: boolean) => {
        const backendKey = MAPPING[key] || key;
        const newSettings = { ...settings, [key]: value };
        
        // Special case: New Leads & Offers might want to update both in backend
        const updateData: any = { [backendKey]: value };
        if (key === 'newLeads') {
            updateData['offers_promotions'] = value;
        }

        setSettings(newSettings);
        try {
            await userAPI.updateNotificationSettings(updateData);
        } catch (error: any) {
            console.error('Failed to update setting:', error);
            // Revert local state if update fails
            setSettings(prev => ({ ...prev, [key]: !value }));
            
            const errorMsg = error.response?.data?.detail || error.message || 'Unknown error';
            Alert.alert('Error', `Failed to update notification settings: ${errorMsg}`);
        }
    };

    const SettingItem = ({ icon, title, description, value, onValueChange, color = Theme.colors.brandOrange }: any) => (
        <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
                    {React.cloneElement(icon, { size: 24, color: color })}
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.settingTitle}>{title}</Text>
                    <Text style={styles.settingDesc}>{description}</Text>
                </View>
            </View>
            <Switch
                trackColor={{ false: '#767577', true: color }}
                thumbColor={value ? 'white' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={onValueChange}
                value={value}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Push Notifications</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <SettingItem
                    icon={<Bell />}
                    title="Booking Updates"
                    description="Get updates about new and ongoing bookings"
                    value={settings.bookingUpdates}
                    onValueChange={(val: boolean) => toggleSwitch('bookingUpdates', val)}
                />

                <SettingItem
                    icon={<IndianRupee />}
                    title="New Leads & Offers"
                    description="Receive notifications for new job leads nearby"
                    value={settings.newLeads}
                    onValueChange={(val: boolean) => toggleSwitch('newLeads', val)}
                    color="#22C55E"
                />

                <SettingItem
                    icon={<Tag />}
                    title="Payout Updates"
                    description="Get notified when your weekly payout is processed"
                    value={settings.payouts}
                    onValueChange={(val: boolean) => toggleSwitch('payouts', val)}
                    color="#0EA5E9"
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    backButton: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.textDark },
    content: { padding: 20 },
    settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: 'white', borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
    settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
    iconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    textContainer: { flex: 1 },
    settingTitle: { fontSize: 16, fontWeight: 'bold', color: Theme.colors.textDark, marginBottom: 4 },
    settingDesc: { fontSize: 12, color: '#94A3B8', lineHeight: 18 }
});

export default VendorNotificationSettingsScreen;
