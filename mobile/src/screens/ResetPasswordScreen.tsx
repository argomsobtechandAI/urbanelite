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
import { Lock, Eye, EyeOff, ChevronLeft } from 'lucide-react-native';

type ResetPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ResetPassword'>;
type ResetPasswordScreenRouteProp = RouteProp<RootStackParamList, 'ResetPassword'>;

interface Props {
    navigation: ResetPasswordScreenNavigationProp;
    route: ResetPasswordScreenRouteProp;
}

const ResetPasswordScreen = ({ navigation, route }: any) => {
    const { email, otp } = route.params;
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.resetPassword({
                email,
                otp,
                newPassword: password
            });
            if (response.data.success) {
                Alert.alert(
                    'Success',
                    'Your password has been reset successfully. Please login with your new password.',
                    [
                        {
                            text: 'Login Now',
                            onPress: () => navigation.navigate('Login'),
                        },
                    ]
                );
            }
        } catch (error: any) {
            console.error('Reset password error:', error);
            Alert.alert(
                'Error',
                error.response?.data?.error || 'Failed to reset password. Please try again.'
            );
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
                    <Text style={styles.title}>New Password</Text>
                    <Text style={styles.subtitle}>
                        Create a strong new password to secure your account.
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Lock size={20} color={Theme.colors.textLight} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="New Password"
                            placeholderTextColor={Theme.colors.textLight}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            editable={!loading}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            {showPassword ? (
                                <EyeOff size={20} color={Theme.colors.textLight} />
                            ) : (
                                <Eye size={20} color={Theme.colors.textLight} />
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputContainer}>
                        <Lock size={20} color={Theme.colors.textLight} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm New Password"
                            placeholderTextColor={Theme.colors.textLight}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showPassword}
                            editable={!loading}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleResetPassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>Reset Password</Text>
                        )}
                    </TouchableOpacity>
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
        marginBottom: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 56,
        fontSize: 16,
        color: Theme.colors.textDark,
    },
    button: {
        backgroundColor: Theme.colors.brandOrange,
        borderRadius: 12,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
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
});

export default ResetPasswordScreen;
