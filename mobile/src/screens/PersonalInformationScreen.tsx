import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Camera, Mail, Phone, User, MapPin } from 'lucide-react-native';
import { Theme } from '../theme';
import { userAPI } from '../services/api';

const PersonalInformationScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        phone: '',
        location: '',
        profileImageUrl: ''
    });

    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [])
    );

    const loadProfile = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getProfile();
            setUserData(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        const phoneRegex = /^[0-9]{10}$/;
        if (userData.phone && !phoneRegex.test(userData.phone)) {
            Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
            return;
        }

        setLoading(true);
        try {
            await userAPI.updateProfile(userData);
            Alert.alert('Success', 'Profile updated successfully!');
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Personal Information</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Avatar Section */}
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={{ uri: userData.profileImageUrl || 'https://cdn-icons-png.flaticon.com/512/847/847969.png' }}
                            style={styles.avatar}
                        />
                        <TouchableOpacity style={styles.cameraButton}>
                            <Camera size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Form */}
                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <View style={styles.inputWrapper}>
                            <User size={20} color={Theme.colors.textLight} style={styles.inputIcon} />
                            <TextInput
                                value={userData.name}
                                onChangeText={(text) => setUserData({ ...userData, name: text })}
                                style={styles.input}
                                placeholder="Enter your name"
                                placeholderTextColor={Theme.colors.textLight}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputWrapper}>
                            <Mail size={20} color={Theme.colors.textLight} style={styles.inputIcon} />
                            <TextInput
                                value={userData.email}
                                onChangeText={(text) => setUserData({ ...userData, email: text })}
                                style={styles.input}
                                placeholder="Enter your email"
                                keyboardType="email-address"
                                placeholderTextColor={Theme.colors.textLight}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <View style={styles.inputWrapper}>
                            <Phone size={20} color={Theme.colors.textLight} style={styles.inputIcon} />
                            <TextInput
                                value={userData.phone}
                                onChangeText={(text) => setUserData({ ...userData, phone: text.replace(/[^0-9]/g, '').slice(0, 10) })}
                                style={styles.input}
                                placeholder="Enter your phone"
                                keyboardType="phone-pad"
                                maxLength={10}
                                placeholderTextColor={Theme.colors.textLight}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Location</Text>
                        <View style={styles.inputWrapper}>
                            <MapPin size={20} color={Theme.colors.textLight} style={styles.inputIcon} />
                            <TextInput
                                value={userData.location}
                                onChangeText={(text) => setUserData({ ...userData, location: text })}
                                style={styles.input}
                                placeholder="City, Country"
                                placeholderTextColor={Theme.colors.textLight}
                            />
                        </View>
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    backButton: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.textDark },
    content: { padding: 20 },

    avatarContainer: { alignItems: 'center', marginBottom: 30 },
    avatarWrapper: { position: 'relative' },
    avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: 'white', backgroundColor: '#F0F0F0' },
    cameraButton: { position: 'absolute', bottom: 0, right: 0, backgroundColor: Theme.colors.brandOrange, padding: 8, borderRadius: 20, borderWidth: 2, borderColor: 'white' },

    formContainer: { marginBottom: 30 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: Theme.colors.textDark, marginBottom: 8, marginLeft: 4 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.inputBg, borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: '#E2E8F0' },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, color: Theme.colors.textDark, fontSize: 16 },

    saveButton: { backgroundColor: Theme.colors.brandOrange, paddingVertical: 15, borderRadius: 15, alignItems: 'center', shadowColor: Theme.colors.brandOrange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});

export default PersonalInformationScreen;
