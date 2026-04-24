import React, { useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { Theme } from '../theme';
import { CheckCircle2, Circle } from 'lucide-react-native';

type TermsRouteProp = RouteProp<RootStackParamList, 'TermsConditions'>;

const TERMS_SECTIONS = [
    {
        title: '1. Acceptance of Terms',
        content: 'By accessing or using the Olfix platform, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.',
    },
    {
        title: '2. Services Provided',
        content: 'Olfix is a service marketplace connecting users with verified service providers (vendors). We facilitate bookings for home services including cleaning, electrical, plumbing, AC repair, salon services, and more.',
    },
    {
        title: '3. Service Charges & Part Replacement',
        content: 'Our platform charges only for the service rendered by the professional. If a service requires part replacement:\n\n• The cost of parts is NOT included in our service charge.\n• Parts may be paid directly to the service provider, OR\n• The user may arrange and provide the required parts themselves.\n• Olfix is not responsible for part costs or procurement.',
    },
    {
        title: '4. User Conduct',
        content: 'You agree to:\n• Provide accurate information when booking services.\n• Treat service providers with respect and professionalism.\n• Not engage in abusive, threatening, or illegal behaviour.\n• Not use the platform for any fraudulent activity.\n\nViolation of these terms may result in account suspension.',
    },
    {
        title: '5. Service Provider Conduct',
        content: 'Service providers (vendors) agree to:\n• Provide services as described and within the agreed timeframe.\n• Treat users with respect and professionalism.\n• Not demand payment beyond the agreed service charge (excluding parts).\n• Maintain valid certifications and work within their designated service categories.',
    },
    {
        title: '6. Ratings & Reports',
        content: 'After each completed service:\n• Users and vendors may rate each other (1–5 stars).\n• Both parties may submit feedback about their experience.\n• Misbehaviour or misconduct can be reported to our admin team.\n• We review all reports and may suspend or ban accounts based on findings.',
    },
    {
        title: '7. Cancellation Policy',
        content: 'Bookings may be cancelled before the service begins. Cancellations after service commencement may incur a partial charge. Repeated cancellations may affect account standing.',
    },
    {
        title: '8. Privacy & Data',
        content: 'We collect and use personal information in accordance with our Privacy Policy. Your data is used to facilitate bookings, improve our services, and communicate important updates. We do not sell your data to third parties.',
    },
    {
        title: '9. Liability Limitation',
        content: 'Olfix acts as a marketplace intermediary. We are not directly liable for the quality of services rendered by independent service providers. However, we have an active dispute resolution process and will intervene in cases of misconduct.',
    },
    {
        title: '10. Amendments',
        content: 'We may update these Terms & Conditions from time to time. Continued use of the platform after changes constitutes acceptance of the revised terms.',
    },
];

const TermsConditionsScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<TermsRouteProp>();
    const role = route.params?.role || 'USER';
    const [agreed, setAgreed] = useState(false);

    const handleContinue = () => {
        if (!agreed) {
            Alert.alert('Agreement Required', 'Please read and agree to the Terms & Conditions to continue.');
            return;
        }
        navigation.navigate('Login');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Terms & Conditions</Text>
                    <Text style={styles.headerSub}>Please read carefully before proceeding</Text>
                </View>
            </View>

            {/* Role badge */}
            <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                    {role === 'VENDOR' ? '🔧 Service Provider Agreement' : '👤 User Agreement'}
                </Text>
            </View>

            {/* Terms Content */}
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.introCard}>
                    <Text style={styles.introTitle}>Welcome to Olfix</Text>
                    <Text style={styles.introText}>
                        These Terms & Conditions govern your use of the Olfix platform. Last updated: April 2025.
                    </Text>
                </View>

                {TERMS_SECTIONS.map((section, idx) => (
                    <View key={idx} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <Text style={styles.sectionContent}>{section.content}</Text>
                    </View>
                ))}

                {/* Special Part Replacement Highlight */}
                <View style={styles.highlightCard}>
                    <Text style={styles.highlightIcon}>🔧</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.highlightTitle}>Part Replacement Policy</Text>
                        <Text style={styles.highlightText}>
                            We charge only for the service. Part costs are separate and are settled directly between you and the service provider.
                        </Text>
                    </View>
                </View>

                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Agreement Checkbox + CTA */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.checkRow}
                    onPress={() => setAgreed(!agreed)}
                    activeOpacity={0.7}
                >
                    {agreed
                        ? <CheckCircle2 size={24} color={Theme.colors.brandOrange} />
                        : <Circle size={24} color="#CBD5E0" />
                    }
                    <Text style={styles.checkText}>
                        I have read and agree to the <Text style={styles.checkLink}>Terms & Conditions</Text>
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.continueBtn, !agreed && styles.continueBtnDisabled]}
                    onPress={handleContinue}
                    activeOpacity={0.85}
                >
                    <Text style={styles.continueBtnText}>
                        {agreed ? 'Continue to Login →' : 'Please Agree to Continue'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
    backBtn: { padding: 8, marginRight: 8 },
    backIcon: { fontSize: 22, color: '#1A202C' },
    headerCenter: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A202C' },
    headerSub: { fontSize: 12, color: '#718096', marginTop: 2 },
    roleBadge: { backgroundColor: Theme.colors.brandOrange + '15', paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center' },
    roleBadgeText: { color: Theme.colors.brandOrange, fontWeight: '700', fontSize: 14 },
    scrollView: { flex: 1, paddingHorizontal: 16 },
    introCard: { backgroundColor: '#1A202C', borderRadius: 16, padding: 20, marginTop: 16, marginBottom: 8 },
    introTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 6 },
    introText: { fontSize: 13, color: '#CBD5E0', lineHeight: 20 },
    section: { backgroundColor: 'white', borderRadius: 12, padding: 18, marginVertical: 6, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1A202C', marginBottom: 8 },
    sectionContent: { fontSize: 13, color: '#4A5568', lineHeight: 21 },
    highlightCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF5F0', borderRadius: 14, padding: 18, marginVertical: 8, borderWidth: 1.5, borderColor: Theme.colors.brandOrange + '40' },
    highlightIcon: { fontSize: 28, marginRight: 14 },
    highlightTitle: { fontSize: 15, fontWeight: 'bold', color: '#C05621', marginBottom: 6 },
    highlightText: { fontSize: 13, color: '#744210', lineHeight: 20 },
    footer: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#EDF2F7', gap: 12 },
    checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    checkText: { flex: 1, fontSize: 14, color: '#4A5568', lineHeight: 20 },
    checkLink: { color: Theme.colors.brandOrange, fontWeight: '600' },
    continueBtn: { backgroundColor: Theme.colors.brandOrange, paddingVertical: 16, borderRadius: 14, alignItems: 'center', shadowColor: Theme.colors.brandOrange, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    continueBtnDisabled: { backgroundColor: '#CBD5E0', shadowOpacity: 0 },
    continueBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default TermsConditionsScreen;
