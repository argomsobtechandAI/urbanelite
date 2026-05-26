import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { authAPI } from '../services/api';
import { Theme } from '../theme';
import { Lock, ChevronLeft } from 'lucide-react-native';

type VerifyOTPScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VerifyOTP'>;
type VerifyOTPScreenRouteProp = RouteProp<RootStackParamList, 'VerifyOTP'>;

interface Props {
    navigation: VerifyOTPScreenNavigationProp;
    route: VerifyOTPScreenRouteProp;
}

const VerifyOTPScreen = ({ navigation, route }: any) => {
    const { email } = route.params;
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerifyOTP = async () => {
        if (!otp || otp.length < 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.verifyOTP(email, otp);
            if (response.data.success) {
                navigation.navigate('ResetPassword', { email, otp });
            }
        } catch (error: any) {
            console.error('Verify OTP error:', error);
            Alert.alert(
                'Error',
                error.response?.data?.error || 'Invalid OTP. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setLoading(true);
        try {
            await authAPI.forgotPassword(email);
            Alert.alert('Success', 'OTP has been resent to your email.');
        } catch (error: any) {
            console.error('Resend OTP error:', error);
            Alert.alert('Error', 'Failed to resend OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.content}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft size={24} color={Theme.colors.brandOrange} />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>Verify OTP</Text>
                    <Text style={styles.subtitle}>
                        We've sent a 6-digit code to <Text style={styles.emailText}>{email}</Text>
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Lock size={20} color={Theme.colors.textLight} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter 6-digit OTP"
                            placeholderTextColor={Theme.colors.textLight}
                            value={otp}
                            onChangeText={setOtp}
                            keyboardType="number-pad"
                            maxLength={6}
                            editable={!loading}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleVerifyOTP}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>Verify OTP</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.resendContainer}>
                        <Text style={styles.resendText}>Didn't receive the code? </Text>
                        <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
                            <Text style={styles.resendLink}>Resend</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    content: {
        flex: 1,
        padding: 24,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    backText: {
        fontSize: 16,
        color: Theme.colors.brandOrange,
        marginLeft: 4,
        fontWeight: '600',
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Theme.colors.textDark,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: Theme.colors.textLight,
        lineHeight: 24,
    },
    emailText: {
        color: Theme.colors.textDark,
        fontWeight: 'bold',
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.inputBg,
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        marginBottom: 24,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 56,
        fontSize: 16,
        color: Theme.colors.textDark,
        letterSpacing: 2,
    },
    button: {
        backgroundColor: Theme.colors.brandOrange,
        borderRadius: 12,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Theme.colors.brandOrange,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    resendText: {
        fontSize: 16,
        color: Theme.colors.textLight,
    },
    resendLink: {
        fontSize: 16,
        color: Theme.colors.brandOrange,
        fontWeight: 'bold',
    },
});

export default VerifyOTPScreen;
