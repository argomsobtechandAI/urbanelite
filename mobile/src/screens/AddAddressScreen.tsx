import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, MapPin, Briefcase, Home } from 'lucide-react-native';
import { Theme } from '../theme';
import { userAPI } from '../services/api';

const AddAddressScreen = () => {
    const navigation = useNavigation<any>();

    const [type, setType] = useState('Home');
    const [address, setAddress] = useState('');
    const [isDefault, setIsDefault] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!address.trim()) {
            Alert.alert('Error', 'Please enter an address');
            return;
        }

        setLoading(true);
        try {
            await userAPI.addAddress({
                type,
                address,
                isDefault
            });
            Alert.alert('Success', 'Address added successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            console.error('Failed to save address', error);
            if (error.response?.status === 401) {
                Alert.alert('Session Expired', 'Please log in again to save your address.', [
                    { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' as any }] }) }
                ]);
            } else {
                Alert.alert('Error', 'Failed to save address. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const TypeButton = ({ label, icon: Icon, value }: any) => (
        <TouchableOpacity
            style={[styles.typeButton, type === value && styles.typeButtonActive]}
            onPress={() => setType(value)}
        >
            <Icon size={20} color={type === value ? 'white' : Theme.colors.textDark} />
            <Text style={[styles.typeText, type === value && styles.typeTextActive]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add New Address</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Address Type */}
                <Text style={styles.label}>Address Type</Text>
                <View style={styles.typesContainer}>
                    <TypeButton label="Home" icon={Home} value="Home" />
                    <TypeButton label="Work" icon={Briefcase} value="Work" />
                    <TypeButton label="Other" icon={MapPin} value="Other" />
                </View>

                {/* Address Input */}
                <Text style={styles.label}>Full Address</Text>
                <TextInput
                    style={styles.input}
                    placeholder="House No, Street, Landmark, City, Pincode"
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    value={address}
                    onChangeText={setAddress}
                />

                {/* Default Toggle */}
                <View style={styles.row}>
                    <Text style={styles.labelRow}>Set as Default Address</Text>
                    <Switch
                        trackColor={{ false: '#E2E8F0', true: '#FFEDD5' }}
                        thumbColor={isDefault ? Theme.colors.brandOrange : '#f4f3f4'}
                        onValueChange={setIsDefault}
                        value={isDefault}
                    />
                </View>

            </ScrollView>

            {/* Footer Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveButton, loading && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Address</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: 'white' },
    backButton: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.textDark },
    content: { padding: 20 },

    label: { fontSize: 14, fontWeight: '600', color: Theme.colors.textDark, marginBottom: 12, marginTop: 10 },

    typesContainer: { flexDirection: 'row', gap: 10, marginBottom: 25 },
    typeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', gap: 8 },
    typeButtonActive: { backgroundColor: Theme.colors.brandOrange, borderColor: Theme.colors.brandOrange },
    typeText: { fontSize: 14, fontWeight: '500', color: Theme.colors.textDark },
    typeTextActive: { color: 'white' },

    input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 15, fontSize: 16, color: Theme.colors.textDark, minHeight: 120, marginBottom: 25 },

    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    labelRow: { fontSize: 16, fontWeight: '500', color: Theme.colors.textDark },

    footer: { padding: 20, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    saveButton: { backgroundColor: Theme.colors.brandOrange, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});

export default AddAddressScreen;
