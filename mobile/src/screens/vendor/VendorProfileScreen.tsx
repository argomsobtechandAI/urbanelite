import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Image, Alert, Platform, PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { Theme } from '../../theme';
import { RootStackParamList } from '../../types/navigation';
import { userAPI } from '../../services/api';
import { Camera } from 'lucide-react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { storageService } from '../../services/storage';

const LOGO_IMG = require('../../assets/images/logo.png');

const MENU_ITEMS = [
    { id: 'VendorServices', title: 'My Services', icon: '🛠️' },
    { id: 'VendorPersonalInformation', title: 'Business Information', icon: '🏢' },
    { id: 'VendorNotificationSettings', title: 'Notifications', icon: '🔔' },
    { id: 'VendorSupportHelp', title: 'Support & Help', icon: '🎧' },
    { id: 'VendorQuestionnaire', title: 'Vendor Questionnaire', icon: '📝' },
];

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

const VendorProfileScreen = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [])
    );

    const fetchProfile = async () => {
        try {
            const response = await userAPI.getProfile();
            setProfile(response.data);
        } catch (error) {
            console.error('Failed to fetch profile', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
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
            setProfile((prev: any) => ({ ...prev, profileImageUrl: uploadResult.url }));
            Alert.alert('Success', 'Profile photo updated!');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to upload photo');
        } finally {
            setUploadingPhoto(false);
        }
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
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <TouchableOpacity
                            style={styles.logoContainer}
                            onPress={() => navigation.navigate('VendorTabs' as any, { screen: 'Dashboard' } as any)}
                            activeOpacity={0.75}
                        >
                            <View style={styles.logoIcon}>
                                <Image source={LOGO_IMG} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                            </View>
                            <Text style={styles.headerTitle}>
                                <Text style={styles.titleOlfix}>OLFIX</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.contentContainer}>
                    {/* Profile Header */}
                    <View style={styles.profileHeader}>
                        <TouchableOpacity style={styles.avatarWrapper} onPress={handleChangePhoto} disabled={uploadingPhoto}>
                            <Image
                                source={{ uri: profile?.profileImageUrl || DEFAULT_AVATAR }}
                                style={styles.avatar}
                            />
                            {uploadingPhoto ? (
                                <View style={styles.avatarOverlay}>
                                    <ActivityIndicator size="small" color="#fff" />
                                </View>
                            ) : (
                                <View style={styles.cameraIcon}>
                                    <Camera size={14} color="#fff" />
                                </View>
                            )}
                        </TouchableOpacity>
                        <View style={styles.profileInfo}>
                            <Text style={styles.userName}>{profile?.name || 'Vendor'}</Text>
                            <Text style={styles.userTag}>VERIFIED VENDOR</Text>
                            <Text style={{ fontSize: 12, color: '#A0AEC0', marginTop: 2 }}>{profile?.phone}</Text>
                        </View>
                    </View>

                    {/* Stats */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{profile?.rating?.toFixed(1) || '5.0'}</Text>
                            <Text style={styles.statLabel}>Rating</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{profile?.completedBookings || '0'}</Text>
                            <Text style={styles.statLabel}>Completed</Text>
                        </View>
                    </View>

                    {/* Menu Items */}
                    <View style={styles.menuContainer}>
                        {MENU_ITEMS.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.menuItem}
                                onPress={() => navigation.navigate(item.id as any)}
                            >
                                <View style={styles.menuIconBox}>
                                    <Text style={styles.menuIcon}>{item.icon}</Text>
                                </View>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                <Text style={styles.chevron}>›</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutText}>Logout Account</Text>
                    </TouchableOpacity>

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },

    header: { paddingHorizontal: 20, paddingTop: 10, marginBottom: 20 },
    logoContainer: { flexDirection: 'row', alignItems: 'center' },
    logoIcon: { width: 40, height: 40, backgroundColor: "transparent", borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    headerTitle: { fontSize: 24, fontWeight: 'bold' },
    titleOlfix: { color: Theme.colors.brandOrange, fontWeight: '900', fontStyle: 'italic', letterSpacing: -0.5 },

    contentContainer: { paddingHorizontal: 20 },

    profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, paddingVertical: 10 },
    avatarWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginRight: 20,
        position: 'relative',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: Theme.colors.brandOrange,
    },
    avatarOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        borderRadius: 40,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Theme.colors.brandOrange,
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    profileInfo: { flex: 1 },
    userName: { fontSize: 24, fontWeight: 'bold', color: '#1A202C' },
    userTag: { fontSize: 10, fontWeight: 'bold', color: Theme.colors.brandOrange, letterSpacing: 1, marginTop: 5 },

    statsContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 15, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#F3F4F6' },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: 'bold', color: Theme.colors.textDark },
    statLabel: { fontSize: 12, color: Theme.colors.textLight, marginTop: 5 },
    statDivider: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 15 },

    menuContainer: { marginBottom: 40 },
    menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 15, borderRadius: 20, marginBottom: 15 },
    menuIconBox: { width: 40, height: 40, backgroundColor: '#FFFFFF', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    menuIcon: { fontSize: 18, color: '#4A5568' },
    menuTitle: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#2D3748' },
    chevron: { fontSize: 24, color: '#CBD5E0', fontWeight: 'bold' },

    logoutButton: { paddingVertical: 18, borderRadius: 20, borderWidth: 1, borderColor: '#FED7D7', alignItems: 'center', backgroundColor: '#FFF5F5' },
    logoutText: { color: '#F56565', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
});

export default VendorProfileScreen;
