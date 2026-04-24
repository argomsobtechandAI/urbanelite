import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
    Alert, ActivityIndicator, Image, Platform, PermissionsAndroid, FlatList, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Theme } from '../../theme';
import { RootStackParamList } from '../../types/navigation';
import { offersAPI } from '../../services/api';
import { storageService } from '../../services/storage';
import { ArrowLeft, Image as ImageIcon, Video, X, Plus, Camera } from 'lucide-react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

interface MediaItem {
    uri: string;
    base64: string;
    type: string; // 'image/jpeg' | 'video/mp4' etc.
    name: string;
    isVideo: boolean;
}

const VendorCreateOfferScreen = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState<'PROMOTION' | 'JOB'>('PROMOTION');
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const [showMediaOptions, setShowMediaOptions] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        discountAmount: '',
        discountCode: '',
        validUntil: new Date().toISOString().split('T')[0],
    });

    const futureDays = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return {
            label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${day}-${month}-${year}`,
            value: d.toISOString().split('T')[0]
        };
    });

    const requestCameraPermission = async (): Promise<boolean> => {
        if (Platform.OS !== 'android') return true;
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
                {
                    title: 'Camera Permission',
                    message: 'Allow camera access to capture photos for your post.',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch {
            return false;
        }
    };

    const handleAddMedia = () => {
        if (mediaItems.length >= 5) {
            Alert.alert('Limit Reached', 'You can attach up to 5 media files.');
            return;
        }
        setShowMediaOptions(true);
    };

    const handleMediaPick = async (pickType: 'camera' | 'photo' | 'video') => {
        setShowMediaOptions(false);
        let result: any;
        if (pickType === 'camera') {
            const hasPerm = await requestCameraPermission();
            if (!hasPerm) { Alert.alert('Permission Denied', 'Camera access required.'); return; }
            result = await launchCamera({ mediaType: 'photo', includeBase64: true, quality: 0.8 });
        } else if (pickType === 'photo') {
            result = await launchImageLibrary({ mediaType: 'photo', includeBase64: true, quality: 0.8 });
        } else {
            result = await launchImageLibrary({ mediaType: 'video', includeBase64: true, quality: 0.8 });
        }

        if (!result?.didCancel && result?.assets?.[0]) {
            const asset = result.assets[0];
            if (pickType === 'video' && asset.fileSize && asset.fileSize > 50 * 1024 * 1024) {
                Alert.alert('File Too Large', 'Video must be under 50MB.');
                return;
            }
            setMediaItems(prev => [...prev, {
                uri: asset.uri!,
                base64: asset.base64 || '',
                type: asset.type || (pickType === 'video' ? 'video/mp4' : 'image/jpeg'),
                name: asset.fileName || `${pickType}_${Date.now()}.${pickType === 'video' ? 'mp4' : 'jpg'}`,
                isVideo: pickType === 'video',
            }]);
        }
    };

    const handleTypeChange = (newType: 'PROMOTION' | 'JOB') => {
        if (newType === type) return;
        setType(newType);
        setFormData({
            title: '',
            description: '',
            discountAmount: '',
            discountCode: '',
            validUntil: new Date().toISOString().split('T')[0],
        });
        setMediaItems([]);
    };

    const handleRemoveMedia = (index: number) => {
        setMediaItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleCreate = async () => {
        if (!formData.title || !formData.discountAmount) {
            Alert.alert('Error', 'Title and Amount/Compensation are required');
            return;
        }

        setLoading(true);
        try {
            // Upload all media first
            const uploadedUrls: string[] = [];
            if (mediaItems.length > 0) {
                setUploadingMedia(true);
                for (const item of mediaItems) {
                    if (!item.base64) continue;
                    const folder = type === 'JOB' ? 'jobs' : 'promotions';
                    const uploadResult = await storageService.uploadFile(
                        'offer-media',
                        `${folder}/${Date.now()}_${item.name}`,
                        item.base64,
                        item.type
                    );
                    if (uploadResult.url) {
                        uploadedUrls.push(uploadResult.url);
                    } else if (uploadResult.error) {
                        Alert.alert('Upload Failed', `Could not upload ${item.name}: ${uploadResult.error}`);
                        setLoading(false);
                        setUploadingMedia(false);
                        return;
                    }
                }
                setUploadingMedia(false);
            }

            await offersAPI.createOffer({
                ...formData,
                type,
                imageUrl: uploadedUrls[0] || '',           // Keep primary for backwards compat
                mediaUrls: uploadedUrls,                    // All media (images + videos)
                validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : undefined
            });

            Alert.alert('Success', `${type === 'JOB' ? 'Job Opening' : 'Offer'} created successfully!`, [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Create offer error:', error);
            Alert.alert('Error', 'Failed to create offer');
        } finally {
            setLoading(false);
            setUploadingMedia(false);
        }
    };

    const loadingText = uploadingMedia
        ? `Uploading media (${mediaItems.length} file${mediaItems.length > 1 ? 's' : ''})...`
        : type === 'JOB' ? 'Posting Job...' : 'Creating Offer...';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                {navigation.canGoBack() && (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color={Theme.colors.textDark} />
                    </TouchableOpacity>
                )}
                <Text style={styles.headerTitle}>{type === 'JOB' ? 'Post Job Opening' : 'Create New Offer'}</Text>
            </View>

            <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
                {/* Type Selector */}
                <View style={styles.typeContainer}>
                    <TouchableOpacity
                        style={[styles.typeButton, type === 'PROMOTION' && styles.activeTypeButton]}
                        onPress={() => handleTypeChange('PROMOTION')}
                    >
                        <Text style={[styles.typeText, type === 'PROMOTION' && styles.activeTypeText]}>Promotion / Ad</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.typeButton, type === 'JOB' && styles.activeTypeButton]}
                        onPress={() => handleTypeChange('JOB')}
                    >
                        <Text style={[styles.typeText, type === 'JOB' && styles.activeTypeText]}>Job Opening</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>{type === 'JOB' ? 'Job Title *' : 'Offer Title *'}</Text>
                <TextInput
                    style={styles.input}
                    placeholder={type === 'JOB' ? 'e.g. Senior Hairstylist' : 'e.g. Summer Sale 20% Off'}
                    placeholderTextColor="#94A3B8"
                    value={formData.title}
                    onChangeText={t => setFormData({ ...formData, title: t })}
                />

                <Text style={styles.label}>{type === 'JOB' ? 'Job Description' : 'Description'}</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder={type === 'JOB' ? 'Describe the role, responsibilities, and requirements...' : 'Describe the offer details...'}
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={4}
                    value={formData.description}
                    onChangeText={t => setFormData({ ...formData, description: t })}
                />

                <Text style={styles.label}>{type === 'JOB' ? 'Salary / Compensation *' : 'Discount Amount *'}</Text>
                <TextInput
                    style={styles.input}
                    placeholder={type === 'JOB' ? 'e.g. 25000' : 'e.g. 500'}
                    placeholderTextColor="#94A3B8"
                    value={formData.discountAmount}
                    keyboardType="number-pad"
                    maxLength={10}
                    onChangeText={t => {
                        const numericValue = t.replace(/[^0-9]/g, '');
                        setFormData({ ...formData, discountAmount: numericValue });
                    }}
                />

                <Text style={styles.label}>{type === 'JOB' ? 'Job ID / Reference (Optional)' : 'Discount Code (Optional)'}</Text>
                <TextInput
                    style={styles.input}
                    placeholder={type === 'JOB' ? 'e.g. JOB-2024-001' : 'e.g. SAVE20'}
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="characters"
                    value={formData.discountCode}
                    onChangeText={t => setFormData({ ...formData, discountCode: t })}
                />

                {/* Media Upload Section */}
                <Text style={styles.label}>Upload Photos & Videos (Select up to 5 files)</Text>
                <View style={styles.mediaGrid}>
                    {mediaItems.map((item, index) => (
                        <View key={index} style={styles.mediaThumbnail}>
                            <Image source={{ uri: item.uri }} style={styles.mediaImage} resizeMode="cover" />
                            {item.isVideo && (
                                <View style={styles.videoOverlay}>
                                    <Video size={22} color="#fff" />
                                </View>
                            )}
                            <TouchableOpacity style={styles.removeMediaBtn} onPress={() => handleRemoveMedia(index)}>
                                <X size={14} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ))}
                    {mediaItems.length < 5 && (
                        <TouchableOpacity style={styles.addMediaBtn} onPress={handleAddMedia}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                <ImageIcon size={20} color={Theme.colors.brandOrange} />
                                <Text style={{ color: Theme.colors.brandOrange, fontWeight: 'bold' }}>/</Text>
                                <Video size={20} color={Theme.colors.brandOrange} />
                            </View>
                            <Text style={styles.addMediaText}>Upload Now</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.mediaHint}>Attach photos or videos to showcase your {type === 'JOB' ? 'workplace' : 'offer'} (MP4 max 50MB)</Text>

                <Text style={styles.label}>{type === 'JOB' ? 'Application Deadline' : 'Valid Until'}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
                    {futureDays.map((day) => (
                        <TouchableOpacity
                            key={day.value}
                            style={[
                                styles.dateChip,
                                formData.validUntil === day.value && styles.activeDateChip
                            ]}
                            onPress={() => setFormData({ ...formData, validUntil: day.value })}
                        >
                            <Text style={[
                                styles.dateChipText,
                                formData.validUntil === day.value && styles.activeDateChipText
                            ]}>
                                {day.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <TouchableOpacity
                    style={[styles.createButton, loading && { opacity: 0.7 }]}
                    onPress={handleCreate}
                    disabled={loading}
                >
                    {loading ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <ActivityIndicator color="white" />
                            <Text style={styles.createButtonText}>{loadingText}</Text>
                        </View>
                    ) : (
                        <Text style={styles.createButtonText}>{type === 'JOB' ? 'Post Job' : 'Create Offer'}</Text>
                    )}
                </TouchableOpacity>
                <View style={{ height: 50 }} />
            </ScrollView>

            {/* Media Options Modal */}
            <Modal
                visible={showMediaOptions}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowMediaOptions(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowMediaOptions(false)}
                >
                    <View style={styles.optionsModal}>
                        <Text style={styles.modalTitle}>Add Media</Text>
                        
                        <TouchableOpacity style={styles.optionItem} onPress={() => handleMediaPick('camera')}>
                            <View style={[styles.optionIcon, { backgroundColor: '#F0FFF4' }]}>
                                <Camera size={24} color="#48BB78" />
                            </View>
                            <Text style={styles.optionText}>Take a Photo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.optionItem} onPress={() => handleMediaPick('photo')}>
                            <View style={[styles.optionIcon, { backgroundColor: '#EBF8FF' }]}>
                                <ImageIcon size={24} color="#4299E1" />
                            </View>
                            <Text style={styles.optionText}>Choose Photo from Gallery</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.optionItem} onPress={() => handleMediaPick('video')}>
                            <View style={[styles.optionIcon, { backgroundColor: '#FFF5F5' }]}>
                                <Video size={24} color="#F56565" />
                            </View>
                            <Text style={styles.optionText}>Choose Video from Gallery</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowMediaOptions(false)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: 'white' },
    backButton: { marginRight: 15 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: Theme.colors.textDark },
    content: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', color: Theme.colors.textDark, marginBottom: 8, marginTop: 14 },
    input: { backgroundColor: 'white', borderRadius: 10, padding: 15, fontSize: 16, color: Theme.colors.textDark, borderWidth: 1, borderColor: '#E2E8F0' },
    textArea: { height: 100, textAlignVertical: 'top' },

    typeContainer: { flexDirection: 'row', marginBottom: 10, backgroundColor: '#EDF2F7', borderRadius: 10, padding: 5 },
    typeButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    activeTypeButton: { backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    typeText: { fontSize: 14, fontWeight: 'bold', color: '#A0AEC0' },
    activeTypeText: { color: Theme.colors.brandOrange },

    // Media
    mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
    mediaThumbnail: { width: 90, height: 90, borderRadius: 10, overflow: 'hidden', position: 'relative' },
    mediaImage: { width: '100%', height: '100%' },
    videoOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center',
    },
    removeMediaBtn: {
        position: 'absolute', top: 4, right: 4,
        backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, width: 20, height: 20,
        justifyContent: 'center', alignItems: 'center',
    },
    addMediaBtn: {
        width: 90, height: 90, borderRadius: 10,
        borderWidth: 2, borderColor: Theme.colors.brandOrange, borderStyle: 'dashed',
        justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF7ED',
    },
    addMediaText: { fontSize: 12, color: Theme.colors.brandOrange, fontWeight: '600', marginTop: 4 },
    mediaHint: { fontSize: 12, color: '#94A3B8', marginTop: 8, marginBottom: 4 },

    createButton: { backgroundColor: Theme.colors.brandOrange, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30, shadowColor: Theme.colors.brandOrange, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    createButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    optionsModal: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 20, textAlign: 'center' },
    optionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    optionIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    optionText: { fontSize: 16, fontWeight: '600', color: '#334155' },
    cancelBtn: { marginTop: 20, paddingVertical: 15, alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 15 },
    cancelBtnText: { fontSize: 16, fontWeight: 'bold', color: '#64748B' },

    // Date Chips
    dateScroll: { flexDirection: 'row', marginTop: 5, marginBottom: 10 },
    dateChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    activeDateChip: {
        backgroundColor: Theme.colors.brandOrange,
        borderColor: Theme.colors.brandOrange,
    },
    dateChipText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    activeDateChipText: {
        color: 'white',
    },
});

export default VendorCreateOfferScreen;
