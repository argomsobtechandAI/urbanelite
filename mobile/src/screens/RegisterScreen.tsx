import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Modal,
    FlatList,
    PermissionsAndroid,
    Image,
} from 'react-native';
const RNAndroidLocationEnabler = require('react-native-android-location-enabler').default || require('react-native-android-location-enabler');
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { API_URL } from '@env';
import { serviceAPI, authAPI } from '../services/api';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { Camera, Image as ImageIcon, FileText, CheckCircle2, Upload, X } from 'lucide-react-native';
import { storageService } from '../services/storage';
import { authService } from '../services/authService';
import { Theme } from '../theme';
import TermsModal from '../components/TermsModal';


type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

interface Props {
    navigation: RegisterScreenNavigationProp;
}

interface ServiceCategory {
    id: string;
    name: string;
    slug: string;
}

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState<'USER' | 'VENDOR'>('USER');
    const [showTerms, setShowTerms] = useState(false);
    const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

    // Vendor-specific fields (Level 2 & 3)
    const [subCategory, setSubCategory] = useState('');
    const [serviceItems, setServiceItems] = useState<string[]>([]);

    // Vendor Data Holders
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [subCategories, setSubCategories] = useState<{ id: string, name: string }[]>([]);
    const [availableServices, setAvailableServices] = useState<{ id: string, title: string }[]>([]);

    // Loaders
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingSubCategories, setLoadingSubCategories] = useState(false);
    const [loadingServices, setLoadingServices] = useState(false);

    // Dropdown Visibility
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showSubCategoryDropdown, setShowSubCategoryDropdown] = useState(false);
    const [showServiceDropdown, setShowServiceDropdown] = useState(false);



    useEffect(() => {
        if (selectedRole === 'VENDOR') {
            fetchCategories();
        }
        checkLocation();
    }, [selectedRole]);

    const checkLocation = async () => {
        if (Platform.OS === 'android') {
            try {
                await RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
                    interval: 10000,
                    fastInterval: 5000,
                });
                await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                );
            } catch (err) {
                console.warn('Location permission/enabler error:', err);
            }
        }
    };

    const fetchCategories = async () => {
        setLoadingCategories(true);
        try {
            const response = await serviceAPI.getCategories();
            if (response.data.success) {
                setCategories(response.data.categories);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            // Fallback removed, rely on API
        } finally {
            setLoadingCategories(false);
        }
    };

    const fetchSubCategories = async (categoryId: string) => {
        setLoadingSubCategories(true);
        setSubCategory('');
        setServiceItems([]);
        setAvailableServices([]);
        try {
            const response = await serviceAPI.getSubCategories(categoryId);
            if (response.data.success) {
                setSubCategories(response.data.subcategories);
            }
        } catch (error) {
            console.error('Error fetching subcategories:', error);
        } finally {
            setLoadingSubCategories(false);
        }
    };

    const fetchServices = async (subCatId: string) => {
        setLoadingServices(true);
        setServiceItems([]);
        try {
            const response = await serviceAPI.getServiceItems(subCatId);
            if (response.data.success) {
                setAvailableServices(response.data.services);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoadingServices(false);
        }
    };

    // Vendor-specific fields
    const [businessName, setBusinessName] = useState('');
    const [businessAddress, setBusinessAddress] = useState('');
    const [experienceYears, setExperienceYears] = useState('');
    const [aadhaarUrl, setAadhaarUrl] = useState('');
    const [panUrl, setPanUrl] = useState('');
    const [isUploadingAadhaar, setIsUploadingAadhaar] = useState(false);
    const [isUploadingPan, setIsUploadingPan] = useState(false);
    const [showAadhaarOptions, setShowAadhaarOptions] = useState(false);
    const [showPanOptions, setShowPanOptions] = useState(false);

    // Vendor Selection State
    const [serviceCategory, setServiceCategory] = useState(''); // Stores ID now
    const [selectedCategoryName, setSelectedCategoryName] = useState('');

    // Render helper for file selector
    const renderFileSelector = (type: 'aadhaar' | 'pan', label: string, currentUrl: string, isUploading: boolean) => (
        <View style={styles.fileSelectorContainer}>
            <Text style={styles.fileLabel}>{label} *</Text>
            {currentUrl ? (
                <View style={styles.uploadedContainer}>
                    <CheckCircle2 size={20} color="#48BB78" />
                    <Text style={styles.uploadedText} numberOfLines={1}>Document Uploaded</Text>
                    <TouchableOpacity onPress={() => type === 'aadhaar' ? setAadhaarUrl('') : setPanUrl('')}>
                        <X size={20} color="#A0AEC0" />
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => type === 'aadhaar' ? setShowAadhaarOptions(true) : setShowPanOptions(true)}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <ActivityIndicator size="small" color="#FF6B6B" />
                    ) : (
                        <>
                            <Upload size={20} color="#FF6B6B" />
                            <Text style={styles.uploadButtonText}>Attach Document</Text>
                        </>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );

    const selectCategory = (category: ServiceCategory) => {
        setServiceCategory(category.id);
        setSelectedCategoryName(category.name);
        setShowCategoryDropdown(false);
        fetchSubCategories(category.id);
    };

    const requestCameraPermission = async (): Promise<boolean> => {
        if (Platform.OS !== 'android') return true;
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
                {
                    title: 'Camera Permission',
                    message: 'This app needs access to your camera to take document photos.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                }
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                Alert.alert('Permission Denied', 'Camera permission is required to take photos. Please enable it in Settings.');
                return false;
            }
            return true;
        } catch (err) {
            console.warn('Camera permission error:', err);
            return false;
        }
    };

    const handleFileUpload = async (type: 'aadhaar' | 'pan', source: 'camera' | 'library' | 'pdf') => {
        try {
            let fileData: any = null;

            if (source === 'pdf') {
                const results = await pick({
                    type: [types.pdf],
                });
                fileData = results[0];
            } else {
                const options: any = {
                    mediaType: 'photo',
                    includeBase64: true,
                    quality: 0.7,
                };

                if (source === 'camera') {
                    const hasPermission = await requestCameraPermission();
                    if (!hasPermission) return;
                }

                const result = source === 'camera'
                    ? await launchCamera(options)
                    : await launchImageLibrary(options);

                if (result.didCancel) return;
                if (result.errorCode) {
                    Alert.alert('Camera Error', result.errorMessage || 'Could not open camera.');
                    return;
                }
                if (result.assets && result.assets.length > 0) {
                    fileData = {
                        uri: result.assets[0].uri,
                        base64: result.assets[0].base64,
                        type: result.assets[0].type,
                        name: result.assets[0].fileName,
                    };
                }
            }

            if (!fileData) return;

            if (type === 'aadhaar') {
                setIsUploadingAadhaar(true);
                setShowAadhaarOptions(false);
            } else {
                setIsUploadingPan(true);
                setShowPanOptions(false);
            }

            let base64 = fileData.base64;
            if (source === 'pdf') {
                // Simplified for demo
                Alert.alert('Info', 'PDF support requires additional setup. Please upload an image for now.');
                setIsUploadingAadhaar(false);
                setIsUploadingPan(false);
                return;
            }

            const fileName = `${type}_${Date.now()}_${fileData.name}`;
            const uploadResult = await storageService.uploadFile(
                'kyc-documents',
                `${type}/${fileName}`,
                base64,
                fileData.type || 'image/jpeg'
            );

            if (uploadResult.error) {
                Alert.alert('Upload Failed', uploadResult.error);
            } else if (uploadResult.url) {
                if (type === 'aadhaar') setAadhaarUrl(uploadResult.url);
                else setPanUrl(uploadResult.url);
            }
        } catch (err) {
            console.error('File pick error:', err);
            const isCancel = isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED;
            if (!isCancel) {
                Alert.alert('Error', 'Failed to pick file');
            }
        } finally {
            setIsUploadingAadhaar(false);
            setIsUploadingPan(false);
        }
    };

    const toggleServiceSelection = (serviceId: string) => {
        if (serviceItems.includes(serviceId)) {
            setServiceItems(serviceItems.filter(id => id !== serviceId));
        } else {
            setServiceItems([...serviceItems, serviceId]);
        }
    };

    const handleRegister = () => {
        if (!hasAcceptedTerms) {
            setShowTerms(true);
            return;
        }
        executeRegister();
    };

    const executeRegister = async () => {
        // Validation
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        // Validate phone number
        const phoneRegex = /^[0-9]{10}$/;
        if (!phone) {
            Alert.alert('Error', 'Phone number is required');
            return;
        }
        if (!phoneRegex.test(phone)) {
            Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
            return;
        }

        // Validate vendor-specific fields
        if (selectedRole === 'VENDOR') {
            if (!serviceCategory || !subCategory || serviceItems.length === 0 || !businessName || !businessAddress || !aadhaarUrl || !panUrl) {
                Alert.alert('Error', 'Please fill in all vendor details including selecting services and KYC documents.');
                return;
            }
        }

        setLoading(true);
        try {
            const response = await authAPI.register({
                name, email, phone, password, role: selectedRole,
                serviceCategory, // ID
                subCategory, // ID
                serviceItems, // Array of IDs
                businessName, businessAddress, experienceYears,
                aadhaarUrl, panUrl
            });

            const data = response.data;
            if (!data.success) throw new Error(data.error || 'Registration failed');

            const successMessage = data.requiresApproval
                ? 'Vendor registration successful! Admin approval pending.'
                : 'Account created successfully! Please login.'
            Alert.alert('Success', successMessage, [{ text: 'OK', onPress: () => navigation.navigate('Login') }]);
        } catch (error: any) {
            console.error('Registration error:', error);
            const errorMessage = error.response?.data?.error || error.message || 'An error occurred.';
            Alert.alert('Registration Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const onAcceptTerms = () => {
        setShowTerms(false);
        setHasAcceptedTerms(true);
        executeRegister();
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.content}>
                    <View style={styles.logoWrapper}>
                        <Image
                            source={require('../assets/images/logo.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Sign up to get started</Text>

                    <View style={styles.form}>
                        {/* Role Selector */}
                        <View style={styles.roleSelector}>
                            <TouchableOpacity
                                style={[styles.roleButton, selectedRole === 'USER' && styles.roleButtonActive]}
                                onPress={() => setSelectedRole('USER')}
                                disabled={loading}
                            >
                                <Text style={[styles.roleButtonText, selectedRole === 'USER' && styles.roleButtonTextActive]}>
                                    User
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.roleButton, selectedRole === 'VENDOR' && styles.roleButtonActive]}
                                onPress={() => setSelectedRole('VENDOR')}
                                disabled={loading}
                            >
                                <Text style={[styles.roleButtonText, selectedRole === 'VENDOR' && styles.roleButtonTextActive]}>
                                    Vendor
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Full Name *"
                            placeholderTextColor="#94A3B8"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                            editable={!loading}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Email *"
                            placeholderTextColor="#94A3B8"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!loading}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Phone (10 digits) *"
                            placeholderTextColor="#94A3B8"
                            value={phone}
                            onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, '').slice(0, 10))}
                            keyboardType="phone-pad"
                            maxLength={10}
                            editable={!loading}
                        />

                        {/* Vendor-specific fields */}
                        {selectedRole === 'VENDOR' && (
                            <>
                                {/* Service Category Dropdown */}
                                <Text style={styles.sectionTitle}>Service Details</Text>
                                <TouchableOpacity
                                    style={styles.dropdownButton}
                                    onPress={() => setShowCategoryDropdown(true)}
                                    disabled={loading || loadingCategories}
                                >
                                    <Text style={selectedCategoryName ? styles.dropdownButtonText : styles.dropdownPlaceholder}>
                                        {loadingCategories ? 'Loading categories...' : (selectedCategoryName || 'Select Parent Category *')}
                                    </Text>
                                    <Text style={styles.dropdownButtonText}>▼</Text>
                                </TouchableOpacity>

                                {/* Sub Category Dropdown */}
                                {serviceCategory && (
                                    <TouchableOpacity
                                        style={styles.dropdownButton}
                                        onPress={() => setShowSubCategoryDropdown(true)}
                                        disabled={loadingSubCategories}
                                    >
                                        <Text style={subCategory ? styles.dropdownButtonText : styles.dropdownPlaceholder}>
                                            {loadingSubCategories ? 'Loading sub-categories...' : (subCategories.find(s => s.id === subCategory)?.name || 'Select Sub-Category *')}
                                        </Text>
                                        <Text style={styles.dropdownButtonText}>▼</Text>
                                    </TouchableOpacity>
                                )}

                                {/* Service Items Multi-Select */}
                                {subCategory && (
                                    <View style={{ marginBottom: 16 }}>
                                        <Text style={[styles.fileLabel, { marginLeft: 0, marginBottom: 8 }]}>Select Services You Offer *</Text>
                                        {loadingServices ? (
                                            <ActivityIndicator size="small" color="#000" />
                                        ) : availableServices.length > 0 ? (
                                            availableServices.map(service => (
                                                <TouchableOpacity
                                                    key={service.id}
                                                    style={[
                                                        styles.serviceItem,
                                                        serviceItems.includes(service.id) && styles.serviceItemActive
                                                    ]}
                                                    onPress={() => toggleServiceSelection(service.id)}
                                                >
                                                    <View style={[
                                                        styles.checkbox,
                                                        serviceItems.includes(service.id) && styles.checkboxActive
                                                    ]}>
                                                        {serviceItems.includes(service.id) && <Text style={styles.checkmark}>✓</Text>}
                                                    </View>
                                                    <Text style={styles.serviceItemText}>{service.title}</Text>
                                                </TouchableOpacity>
                                            ))
                                        ) : (
                                            <Text style={{ color: '#718096', fontStyle: 'italic' }}>No services available in this category.</Text>
                                        )}
                                    </View>
                                )}

                                <TextInput
                                    style={styles.input}
                                    placeholder="Business Name *"
                                    placeholderTextColor="#94A3B8"
                                    value={businessName}
                                    onChangeText={setBusinessName}
                                    autoCapitalize="words"
                                    editable={!loading}
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder="Business Address *"
                                    placeholderTextColor="#94A3B8"
                                    value={businessAddress}
                                    onChangeText={setBusinessAddress}
                                    editable={!loading}
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder="Years of Experience (Optional)"
                                    placeholderTextColor="#94A3B8"
                                    value={experienceYears}
                                    onChangeText={setExperienceYears}
                                    keyboardType="numeric"
                                    editable={!loading}
                                />

                                <Text style={styles.sectionTitle}>KYC Details (Required)</Text>

                                {renderFileSelector('aadhaar', 'Aadhaar Card', aadhaarUrl, isUploadingAadhaar)}
                                {renderFileSelector('pan', 'PAN Card', panUrl, isUploadingPan)}
                            </>
                        )}

                        <TextInput
                            style={styles.input}
                            placeholder="Password *"
                            placeholderTextColor="#94A3B8"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            editable={!loading}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password *"
                            placeholderTextColor="#94A3B8"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            editable={!loading}
                        />

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text style={styles.buttonText}>Register</Text>
                            )}
                        </TouchableOpacity>



                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login' as any)}>
                                <Text style={styles.loginLink}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Category Dropdown Modal */}
            <Modal
                visible={showCategoryDropdown}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowCategoryDropdown(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowCategoryDropdown(false)}
                >
                    <View style={styles.dropdownModal}>
                        <Text style={styles.dropdownTitle}>Select Service Category</Text>
                        <FlatList
                            data={categories}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.dropdownItem}
                                    onPress={() => selectCategory(item)}
                                >
                                    <Text style={styles.dropdownItemText}>{item.name}</Text>
                                    {serviceCategory === item.id && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            style={styles.dropdownCancel}
                            onPress={() => setShowCategoryDropdown(false)}
                        >
                            <Text style={styles.dropdownCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Sub-Category Dropdown Modal */}
            <Modal
                visible={showSubCategoryDropdown}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSubCategoryDropdown(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowSubCategoryDropdown(false)}
                >
                    <View style={styles.dropdownModal}>
                        <Text style={styles.dropdownTitle}>Select Sub-Category</Text>
                        <FlatList
                            data={subCategories}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setSubCategory(item.id);
                                        setShowSubCategoryDropdown(false);
                                        fetchServices(item.id);
                                    }}
                                >
                                    <Text style={styles.dropdownItemText}>{item.name}</Text>
                                    {subCategory === item.id && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            style={styles.dropdownCancel}
                            onPress={() => setShowSubCategoryDropdown(false)}
                        >
                            <Text style={styles.dropdownCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* File Options Modal */}
            <Modal
                visible={showAadhaarOptions || showPanOptions}
                transparent={true}
                animationType="slide"
                onRequestClose={() => {
                    setShowAadhaarOptions(false);
                    setShowPanOptions(false);
                }}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => {
                        setShowAadhaarOptions(false);
                        setShowPanOptions(false);
                    }}
                >
                    <View style={styles.optionsModal}>
                        <Text style={styles.modalTitle}>Choose {showAadhaarOptions ? 'Aadhaar' : 'PAN'} Source</Text>

                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => handleFileUpload(showAadhaarOptions ? 'aadhaar' : 'pan', 'camera')}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: '#F0FFF4' }]}>
                                <Camera size={24} color="#48BB78" />
                            </View>
                            <Text style={styles.optionText}>Take a Photo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => handleFileUpload(showAadhaarOptions ? 'aadhaar' : 'pan', 'library')}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: '#EBF8FF' }]}>
                                <ImageIcon size={24} color="#4299E1" />
                            </View>
                            <Text style={styles.optionText}>Choose from Gallery</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => handleFileUpload(showAadhaarOptions ? 'aadhaar' : 'pan', 'pdf')}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: '#FFF5F5' }]}>
                                <FileText size={24} color="#F56565" />
                            </View>
                            <Text style={styles.optionText}>Attach PDF Document</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => {
                                setShowAadhaarOptions(false);
                                setShowPanOptions(false);
                            }}
                        >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <TermsModal
                visible={showTerms}
                role={selectedRole}
                onAccept={onAcceptTerms}
                onDecline={() => setShowTerms(false)}
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        padding: 24,
    },
    logoWrapper: {
        alignItems: 'center',
        marginBottom: 10,
    },
    logoImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Theme.colors.textDark,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: Theme.colors.textLight,
        marginBottom: 32,
    },
    form: {
        width: '100%',
    },
    roleSelector: {
        flexDirection: 'row',
        backgroundColor: Theme.colors.searchBg,
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    roleButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
    },
    roleButtonActive: {
        backgroundColor: Theme.colors.navy,
    },
    roleButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: Theme.colors.textLight,
    },
    roleButtonTextActive: {
        color: '#FFFFFF',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Theme.colors.textDark,
        marginTop: 16,
        marginBottom: 12,
        marginLeft: 4,
    },
    input: {
        backgroundColor: Theme.colors.inputBg,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 16,
        color: Theme.colors.textDark,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Theme.colors.inputBg,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    dropdownButtonText: {
        fontSize: 16,
        color: Theme.colors.textDark,
    },
    dropdownPlaceholder: {
        fontSize: 16,
        color: Theme.colors.textLight,
    },
    fileSelectorContainer: {
        marginBottom: 16,
    },
    fileLabel: {
        fontSize: 13,
        color: Theme.colors.textLight,
        marginBottom: 6,
        marginLeft: 4,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FDFCF0',
        borderWidth: 1,
        borderColor: Theme.colors.primary,
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 16,
        justifyContent: 'center',
    },
    uploadButtonText: {
        marginLeft: 8,
        fontSize: 15,
        color: Theme.colors.primary,
        fontWeight: '600',
    },
    uploadedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FFF4',
        borderWidth: 1,
        borderColor: '#48BB78',
        borderRadius: 12,
        padding: 16,
    },
    uploadedText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: '#48BB78',
        fontWeight: '500',
    },
    button: {
        backgroundColor: Theme.colors.primary,
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    googleButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        marginTop: 16,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    googleButtonText: {
        color: Theme.colors.textDark,
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
        marginBottom: 40,
    },
    loginText: {
        color: Theme.colors.textLight,
        fontSize: 14,
    },
    loginLink: {
        color: Theme.colors.textDark,
        fontSize: 14,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    dropdownModal: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        width: '100%',
        maxHeight: '70%',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    dropdownTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 16,
        textAlign: 'center',
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#0F172A',
    },
    dropdownCancel: {
        marginTop: 16,
        padding: 16,
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
    },
    dropdownCancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },
    checkmark: {
        color: Theme.colors.primary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    optionsModal: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        width: '100%',
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Theme.colors.textDark,
        marginBottom: 24,
        textAlign: 'center',
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        marginBottom: 12,
    },
    optionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
        color: Theme.colors.textDark,
    },
    cancelBtn: {
        marginTop: 12,
        padding: 16,
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: Theme.colors.textLight,
    },
    // New Styles for Service Items
    serviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: Theme.colors.inputBg,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    serviceItemActive: {
        borderColor: Theme.colors.primary,
        backgroundColor: '#F0FFF4',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: Theme.colors.textLight,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        borderColor: Theme.colors.primary,
        backgroundColor: Theme.colors.primary,
    },
    serviceItemText: {
        fontSize: 14,
        color: Theme.colors.textDark,
    },
});

export default RegisterScreen;
