import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    PermissionsAndroid,
    ScrollView,
    Image,
} from 'react-native';
const RNAndroidLocationEnabler = require('react-native-android-location-enabler').default || require('react-native-android-location-enabler');
import Svg, { Path } from 'react-native-svg';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { authAPI } from '../services/api';
import { authService } from '../services/authService';
import { Theme } from '../theme';
import {
    GoogleSignin,
    statusCodes,
} from '@react-native-google-signin/google-signin';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff } from 'lucide-react-native';
import TermsModal from '../components/TermsModal';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
    navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState<'USER' | 'VENDOR'>('USER');
    const [loginError, setLoginError] = useState('');
    const [showTerms, setShowTerms] = useState(false);
    const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
    const [pendingAction, setPendingAction] = useState<'login' | 'google' | null>(null);

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: '169716600495-i6viptj0oto6vnfqm6rbk9pc15d4nnhf.apps.googleusercontent.com',
            offlineAccess: true,
        });
        checkLocation();
    }, []);

    const checkLocation = async () => {
        if (Platform.OS !== 'android') return;
        try {
            await RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
                interval: 10000,
                fastInterval: 5000,
            });
            await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );
        } catch (err) {
            console.warn('Location permission not granted:', err);
        }
    };

    const handleGoogleLogin = () => {
        if (!hasAcceptedTerms) {
            setPendingAction('google');
            setShowTerms(true);
            return;
        }
        executeGoogleLogin();
    };

    const executeGoogleLogin = async () => {
        try {
            setLoading(true);
            setLoginError('');

            await GoogleSignin.hasPlayServices();
            const response = await GoogleSignin.signIn();

            const idToken = response.data?.idToken ?? (response as any).idToken;

            if (!idToken) {
                if ((response as any).type === 'cancelled') return;
                throw new Error('No ID token received from Google');
            }

            // Sync with Supabase (optional but good for consistency)
            await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: idToken,
            });

            // Sync with our backend — pass selectedRole for role validation
            const apiResponse = await authAPI.googleLogin(idToken, selectedRole);
            const data = apiResponse.data;

            if (!data.success) throw new Error(data.error || 'Google Login failed');

            await authService.setToken(data.token);
            await authService.setUser(data.user);

            const targetScreen = data.user.role === 'VENDOR' ? 'VendorTabs' : 'MainTabs';
            navigation.reset({ index: 0, routes: [{ name: targetScreen as any }] });

        } catch (error: any) {
            console.error('Google Login Error:', error);
            if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
            if (error.code === statusCodes.IN_PROGRESS) return;
            if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Alert.alert('Error', 'Google Play Services not available or outdated');
                return;
            }

            // DEVELOPER_ERROR (Code 10) usually means SHA-1 mismatch or wrong Web Client ID
            if (error.code === '10' || error.code === 10 || error.message?.includes('DEVELOPER_ERROR')) {
                Alert.alert(
                    'Google Sign-In Error',
                    'Developer Error (Code 10).\n\nThis usually means the SHA-1 fingerprint in Firebase doesn\'t match the keystore used to sign the app, or the Web Client ID is incorrect.',
                    [{ text: 'OK' }]
                );
                return;
            }

            const errorData = error.response?.data;

            // Role mismatch — show a clear popup
            if (errorData?.errorCode === 'ROLE_MISMATCH') {
                const registeredAs = errorData.registeredRole === 'VENDOR' ? 'Vendor' : 'User';
                const attemptedAs = selectedRole === 'VENDOR' ? 'Vendor' : 'User';
                Alert.alert(
                    '⚠️ Wrong Account Type',
                    `This Google account is registered as a ${registeredAs} account.\n\nYou cannot sign in as a ${attemptedAs} with this Google account.\n\nPlease select "${registeredAs}" and try again.`,
                    [{ text: 'OK' }]
                );
                return;
            }
            if (errorData?.approvalStatus === 'PENDING') {
                Alert.alert('Approval Pending', 'Your account is pending admin approval.');
                return;
            }
            if (errorData?.approvalStatus === 'REJECTED') {
                Alert.alert('Account Rejected', 'Your account has been rejected.');
                return;
            }
            Alert.alert('Google Login Failed', errorData?.error || error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = () => {
        if (!hasAcceptedTerms) {
            setPendingAction('login');
            setShowTerms(true);
            return;
        }
        executeLogin();
    };

    const executeLogin = async () => {
        setLoginError('');
        if (!email.trim()) {
            setLoginError('Please enter your email address.');
            return;
        }
        if (!password) {
            setLoginError('Please enter your password.');
            return;
        }

        setLoading(true);
        try {
            // Pass selectedRole so server can validate it matches the registered role
            const response = await authAPI.login(email.trim(), password, selectedRole);
            const data = response.data;

            if (!data.success) throw new Error(data.error || 'Login failed');

            await authService.setToken(data.token);
            await authService.setUser(data.user);

            const targetScreen = data.user.role === 'VENDOR' ? 'VendorTabs' : 'MainTabs';
            navigation.reset({ index: 0, routes: [{ name: targetScreen as any }] });

        } catch (error: any) {
            console.error('Login error:', error);
            const errorData = error.response?.data;

            // Role mismatch — show a clear popup
            if (errorData?.errorCode === 'ROLE_MISMATCH') {
                const registeredAs = errorData.registeredRole === 'VENDOR' ? 'Vendor' : 'User';
                const attemptedAs = selectedRole === 'VENDOR' ? 'Vendor' : 'User';
                Alert.alert(
                    '⚠️ Wrong Account Type',
                    `This email is registered as a ${registeredAs} account.\n\nYou cannot sign in as a ${attemptedAs} with this email.\n\nPlease select "${registeredAs}" and try again.`,
                    [{ text: 'OK' }]
                );
                return;
            }
            if (errorData?.approvalStatus === 'PENDING') {
                setLoginError('Your account is pending admin approval. Please wait.');
                return;
            }
            if (errorData?.approvalStatus === 'REJECTED') {
                setLoginError('Your account has been rejected. Please contact support.');
                return;
            }
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                setLoginError('Connection timed out. Please check your internet and try again.');
                return;
            }
            if (!error.response) {
                setLoginError('Cannot connect to server. Please check your internet connection.');
                return;
            }
            setLoginError(errorData?.error || error.message || 'Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    const onAcceptTerms = () => {
        setShowTerms(false);
        setHasAcceptedTerms(true);
        if (pendingAction === 'login') {
            executeLogin();
        } else if (pendingAction === 'google') {
            executeGoogleLogin();
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.content}>
                    <View style={styles.logoWrapper}>
                        <Image
                            source={require('../assets/images/logo.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to continue</Text>

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

                        {/* Email */}
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={(t) => { setEmail(t); setLoginError(''); }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!loading}
                        />

                        {/* Password with Eye Toggle */}
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Password"
                                placeholderTextColor="#999"
                                value={password}
                                onChangeText={(t) => { setPassword(t); setLoginError(''); }}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!loading}
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowPassword(prev => !prev)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                {showPassword
                                    ? <EyeOff size={20} color="#94A3B8" />
                                    : <Eye size={20} color="#94A3B8" />
                                }
                            </TouchableOpacity>
                        </View>

                        {/* Inline Error Message */}
                        {loginError ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>⚠️  {loginError}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={styles.forgotPasswordContainer}
                            onPress={() => navigation.navigate('ForgotPassword' as any, { email })}
                        >
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Sign In as {selectedRole === 'USER' ? 'User' : 'Vendor'}</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.googleButton, loading && styles.buttonDisabled]}
                            onPress={handleGoogleLogin}
                            disabled={loading}
                        >
                            <Svg width={20} height={20} viewBox="0 0 48 48" style={{ marginRight: 10 }}>
                                <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                            </Svg>
                            <Text style={styles.googleButtonText}>Continue with Google</Text>
                        </TouchableOpacity>

                        <View style={styles.registerContainer}>
                            <Text style={styles.registerText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register' as any)}>
                                <Text style={styles.linkText}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Terms & Conditions */}
                        <TouchableOpacity
                            style={styles.termsContainer}
                            onPress={() => navigation.navigate('TermsConditions' as any, { role: selectedRole })}
                        >
                            <Text style={styles.termsText}>
                                By continuing, you agree to our{' '}
                                <Text style={styles.termsLink}>Terms &amp; Conditions</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

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
    container: { flex: 1, backgroundColor: Theme.colors.background },
    scrollContent: { flexGrow: 1 },
    content: { flex: 1, padding: 24, justifyContent: 'center', minHeight: '100%' as any },
    title: { fontSize: 32, fontWeight: 'bold', color: Theme.colors.textDark, marginBottom: 8 },
    subtitle: { fontSize: 16, color: Theme.colors.textLight, marginBottom: 32 },
    form: { width: '100%' },
    logoWrapper: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logoImage: {
        width: 80,
        height: 80,
    },

    roleSelector: {
        flexDirection: 'row',
        backgroundColor: Theme.colors.searchBg,
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    roleButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
    roleButtonActive: { backgroundColor: Theme.colors.brandOrange },
    roleButtonText: { fontSize: 14, fontWeight: '600', color: Theme.colors.textLight },
    roleButtonTextActive: { color: '#FFFFFF' },

    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 16,
        color: Theme.colors.textDark,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },

    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 8,
        paddingRight: 12,
    },
    passwordInput: {
        flex: 1,
        padding: 16,
        fontSize: 16,
        color: Theme.colors.textDark,
    },
    eyeButton: {
        padding: 4,
    },

    errorBox: {
        backgroundColor: '#FEF2F2',
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    errorText: {
        color: '#DC2626',
        fontSize: 13,
        lineHeight: 18,
    },

    forgotPasswordContainer: { alignItems: 'flex-end', marginBottom: 24, marginTop: 4 },
    forgotPasswordText: { color: Theme.colors.primary, fontSize: 14, fontWeight: '600' },

    button: {
        backgroundColor: Theme.colors.buttonPeach,
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: Theme.colors.buttonPeach,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },

    googleButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    googleButtonText: { color: Theme.colors.textDark, fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },

    registerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
    registerText: { color: '#64748B', fontSize: 14 },
    linkText: { color: '#0F172A', fontSize: 14, fontWeight: 'bold' },

    termsContainer: { alignItems: 'center', marginTop: 12, paddingHorizontal: 20 },
    termsText: { color: '#94A3B8', fontSize: 12, textAlign: 'center', lineHeight: 18 },
    termsLink: { color: Theme.colors.brandOrange, fontWeight: '600', textDecorationLine: 'underline' },
});

export default LoginScreen;