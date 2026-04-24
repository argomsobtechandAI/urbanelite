import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Camera, Mail, Phone, MapPin, Briefcase, FileText, Layers } from 'lucide-react-native';
import { Theme } from '../../theme';
import { userAPI } from '../../services/api';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { storageService } from '../../services/storage';
import { Platform, PermissionsAndroid } from 'react-native';

const VendorPersonalInformationScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [vendorData, setVendorData] = useState({
        businessName: '',
        email: '',
        phone: '',
        location: '',
        taxId: '',
        serviceCategory: '',
        profileImageUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
    });
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [])
    );

    const loadProfile = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getProfile();
            // Map user profile to vendor fields if necessary or fetch vendor specific profile
            setVendorData({
                businessName: response.data.name || '',
                email: response.data.email || '',
                phone: response.data.phone || '',
                location: response.data.location || '',
                taxId: response.data.taxId || '',
                serviceCategory: response.data.serviceCategory || '',
                profileImageUrl: response.data.profileImageUrl || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const requestCameraPermission = async (): Promise<boolean> => {
        if (Platform.OS !== 'android') return true;
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
                {
                    title: 'Camera Permission',
                    message: 'Allow access to camera to take a profile photo.',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch {
            return false;
        }
    };

    const handleChangePhoto = () => {
        Alert.alert('Change Profile Photo', 'Choose an option', [
            {
                text: 'Take Photo',
                onPress: async () => {
                    const hasPerm = await requestCameraPermission();
                    if (!hasPerm) {
                        Alert.alert('Permission Denied', 'Camera permission is required.');
                        return;
                    }
                    const result = await launchCamera({ mediaType: 'photo', includeBase64: true, quality: 0.7 });
                    if (!result.didCancel && result.assets?.[0]) handleUpload(result.assets[0]);
                },
            },
            {
                text: 'Choose from Gallery',
                onPress: async () => {
                    const result = await launchImageLibrary({ mediaType: 'photo', includeBase64: true, quality: 0.7 });
                    if (!result.didCancel && result.assets?.[0]) handleUpload(result.assets[0]);
                },
            },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const handleUpload = async (asset: any) => {
        if (!asset.base64) return;
        setUploadingPhoto(true);
        try {
            const fileName = `profile_${Date.now()}.jpg`;
            const uploadResult = await storageService.uploadFile(
                'profile-images',
                `vendors/${fileName}`,
                asset.base64,
                asset.type || 'image/jpeg'
            );

            if (uploadResult.error) {
                Alert.alert('Upload Failed', uploadResult.error);
                return;
            }

            await userAPI.updateProfile({ profileImageUrl: uploadResult.url });
            setVendorData((prev: any) => ({ ...prev, profileImageUrl: uploadResult.url }));
            Alert.alert('Success', 'Profile photo updated!');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to upload photo');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleSave = async () => {
        const phoneRegex = /^[0-9]{10}$/;
        if (vendorData.phone && !phoneRegex.test(vendorData.phone)) {
            Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
            return;
        }

        setLoading(true);
        try {
            // Ideally we'd have a specific vendor update endpoint
            await userAPI.updateProfile({
                name: vendorData.businessName,
                email: vendorData.email,
                phone: vendorData.phone,
                location: vendorData.location,
                // Add vendor specific fields to payload if backend supports it
                taxId: vendorData.taxId,
                serviceCategory: vendorData.serviceCategory
            });
            Alert.alert('Success', 'Business Information updated successfully!');
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Business Information</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={{ uri: vendorData.profileImageUrl }}
                            style={styles.avatar}
                        />
                        <TouchableOpacity style={styles.cameraButton} onPress={handleChangePhoto} disabled={uploadingPhoto}>
                            {uploadingPhoto ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Camera size={20} color="white" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Business Name</Text>
                        <View style={styles.inputWrapper}>
                            <Briefcase size={20} color={Theme.colors.textLight} style={styles.inputIcon} />
                            <TextInput
                                value={vendorData.businessName}
                                onChangeText={(text) => setVendorData({ ...vendorData, businessName: text })}
                                style={styles.input}
                                placeholder="Enter business name"
                                placeholderTextColor={Theme.colors.textLight}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Tax ID / GSTIN</Text>
                        <View style={styles.inputWrapper}>
                            <FileText size={20} color={Theme.colors.textLight} style={styles.inputIcon} />
                            <TextInput
                                value={vendorData.taxId}
                                onChangeText={(text) => setVendorData({ ...vendorData, taxId: text })}
                                style={styles.input}
                                placeholder="Enter Tax ID"
                                placeholderTextColor={Theme.colors.textLight}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Service Category</Text>
                        <View style={styles.inputWrapper}>
                            <Layers size={20} color={Theme.colors.textLight} style={styles.inputIcon} />
                            <TextInput
                                value={vendorData.serviceCategory}
                                onChangeText={(text) => setVendorData({ ...vendorData, serviceCategory: text })}
                                style={styles.input}
                                placeholder="e.g. Plumbing, Cleaning"
                                placeholderTextColor={Theme.colors.textLight}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputWrapper}>
                            <Mail size={20} color={Theme.colors.textLight} style={styles.inputIcon} />
                            <TextInput
                                value={vendorData.email}
                                onChangeText={(text) => setVendorData({ ...vendorData, email: text })}
                                style={styles.input}
                                placeholder="Enter business email"
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
                                value={vendorData.phone}
                                onChangeText={(text) => setVendorData({ ...vendorData, phone: text.replace(/[^0-9]/g, '').slice(0, 10) })}
                                style={styles.input}
                                placeholder="Enter business phone"
                                keyboardType="phone-pad"
                                maxLength={10}
                                placeholderTextColor={Theme.colors.textLight}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Business Location</Text>
                        <View style={styles.inputWrapper}>
                            <MapPin size={20} color={Theme.colors.textLight} style={styles.inputIcon} />
                            <TextInput
                                value={vendorData.location}
                                onChangeText={(text) => setVendorData({ ...vendorData, location: text })}
                                style={styles.input}
                                placeholder="City, Country"
                                placeholderTextColor={Theme.colors.textLight}
                            />
                        </View>
                    </View>
                </View>

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

export default VendorPersonalInformationScreen;
