import React, { useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal
} from 'react-native';
import { Theme } from '../theme';
import { CheckCircle2, Circle, X } from 'lucide-react-native';

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
];

interface TermsModalProps {
    visible: boolean;
    role: 'USER' | 'VENDOR';
    onAccept: () => void;
    onDecline: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ visible, role, onAccept, onDecline }) => {
    const [agreed, setAgreed] = useState(false);

    const handleContinue = () => {
        if (!agreed) {
            Alert.alert('Agreement Required', 'Please read and agree to the Terms & Conditions to continue.');
            return;
        }
        onAccept();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onDecline}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.headerTitle}>Terms & Conditions</Text>
                            <Text style={styles.headerSub}>Please read carefully before proceeding</Text>
                        </View>
                        <TouchableOpacity onPress={onDecline} style={styles.closeBtn}>
                            <X size={24} color="#1A202C" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeText}>
                            {role === 'VENDOR' ? '🔧 Service Provider Agreement' : '👤 User Agreement'}
                        </Text>
                    </View>

                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        <View style={styles.introCard}>
                            <Text style={styles.introTitle}>Welcome to Olfix</Text>
                            <Text style={styles.introText}>
                                These Terms & Conditions govern your use of the Olfix platform. Last updated: April 2026.
                            </Text>
                        </View>

                        {TERMS_SECTIONS.map((section, idx) => (
                            <View key={idx} style={styles.section}>
                                <Text style={styles.sectionTitle}>{section.title}</Text>
                                <Text style={styles.sectionContent}>{section.content}</Text>
                            </View>
                        ))}

                        <View style={{ height: 20 }} />
                    </ScrollView>

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
                                {agreed ? 'Accept & Continue' : 'Please Agree to Continue'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#F7FAFC',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '85%',
        overflow: 'hidden',
    },
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
    closeBtn: { padding: 4 },
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
    footer: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#EDF2F7', gap: 12, paddingBottom: 30 },
    checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    checkText: { flex: 1, fontSize: 14, color: '#4A5568', lineHeight: 20 },
    checkLink: { color: Theme.colors.brandOrange, fontWeight: '600' },
    continueBtn: { backgroundColor: Theme.colors.brandOrange, paddingVertical: 16, borderRadius: 14, alignItems: 'center', shadowColor: Theme.colors.brandOrange, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    continueBtnDisabled: { backgroundColor: '#CBD5E0', shadowOpacity: 0 },
    continueBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default TermsModal;
