import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, LayoutAnimation, Platform, UIManager, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Phone, Mail, ChevronRight, HelpCircle, MessageSquare } from 'lucide-react-native';
import { Theme } from '../theme';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const SupportHelpScreen = () => {
    const navigation = useNavigation();

    const openWhatsApp = () => {
        const phone = '+918858854373';
        const message = 'Hello OLFIX Support, I need help with...';
        const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
        const webUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Linking.openURL(webUrl);
            }
        }).catch(() => {
            Linking.openURL(webUrl);
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Support & Help</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                <View style={styles.banner}>
                    <View style={styles.bannerContent}>
                        <Text style={styles.bannerTitle}>How can we help you?</Text>
                        <Text style={styles.bannerSubtitle}>Our team is available 24/7 to assist you with any issues.</Text>
                    </View>
                    <HelpCircle size={60} color="rgba(255,255,255,0.2)" style={styles.bannerIcon} />
                </View>

                <Text style={styles.sectionTitle}>Contact Us</Text>

                <View style={styles.contactGrid}>
                    <TouchableOpacity
                        style={styles.contactCard}
                        onPress={() => Linking.openURL('tel:+918858854373')}
                    >
                        <View style={[styles.contactIconBox, { backgroundColor: '#E0F2FE' }]}>
                            <Phone size={24} color="#0EA5E9" />
                        </View>
                        <Text style={styles.contactLabel}>Call Us</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.contactCard}
                        onPress={() => Linking.openURL('mailto:olfixandaman@gmail.com')}
                    >
                        <View style={[styles.contactIconBox, { backgroundColor: '#F3E8FF' }]}>
                            <Mail size={24} color="#A855F7" />
                        </View>
                        <Text style={styles.contactLabel}>Email Us</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.contactCard}
                        onPress={openWhatsApp}
                    >
                        <View style={[styles.contactIconBox, { backgroundColor: '#DCFCE7' }]}>
                            <MessageSquare size={24} color="#22C55E" />
                        </View>
                        <Text style={styles.contactLabel}>WhatsApp</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Frequently Asked Questions</Text>

                <FAQSection />

            </ScrollView>
        </SafeAreaView>
    );
};

const FAQSection = () => {
    const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);

    const toggleExpand = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const faqs = [
        { q: 'How do I reschedule a booking?', a: 'You can reschedule your booking by navigating to the "Bookings" tab, selecting your upcoming booking, and tapping the "Reschedule" button.' },
        { q: 'What is the cancellation policy?', a: 'Cancellations made at least 24 hours before the scheduled service time are potentially fully refundable. Late cancellations may incur a fee as per our terms.' },
        { q: 'How do I update my profile?', a: 'Go to the Profile tab and tap on the "Edit Profile" option to update your name, email, or saved addresses.' },
        { q: 'Payment methods handled?', a: 'We accept all major credit/debit cards, UPI, and Wallet payments. All transactions are secured via Cashfree.' },
        { q: 'Service warranty policy', a: 'We provide a 7-day service warranty. If you face any issues related to the service provided, please contact us immediately.' }
    ];

    return (
        <View style={styles.faqList}>
            {faqs.map((item, index) => {
                const isExpanded = expandedIndex === index;
                return (
                    <View key={index} style={styles.faqWrapper}>
                        <TouchableOpacity
                            style={styles.faqHeader}
                            onPress={() => toggleExpand(index)}
                        >
                            <Text style={styles.faqQuestion}>{item.q}</Text>
                            <ChevronRight
                                size={20}
                                color="#CBD5E0"
                                style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                            />
                        </TouchableOpacity>
                        {isExpanded && (
                            <View style={styles.faqBody}>
                                <Text style={styles.faqAnswer}>{item.a}</Text>
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    backButton: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.textDark },
    content: { padding: 20 },

    banner: { backgroundColor: Theme.colors.brandOrange, borderRadius: 20, padding: 25, position: 'relative', overflow: 'hidden', marginBottom: 30 },
    bannerContent: { zIndex: 1 },
    bannerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 8 },
    bannerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
    bannerIcon: { position: 'absolute', right: -10, bottom: -10 },

    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Theme.colors.textDark, marginBottom: 15 },

    contactGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
    contactCard: { flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    contactIconBox: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    contactLabel: { fontSize: 14, fontWeight: '600', color: Theme.colors.textDark },

    faqList: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0', overflow: 'hidden' },
    faqWrapper: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    faqQuestion: { fontSize: 15, color: Theme.colors.textDark, fontWeight: '500', flex: 1, marginRight: 10 },
    faqBody: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 0 },
    faqAnswer: { fontSize: 14, color: '#64748B', lineHeight: 20 }
});

export default SupportHelpScreen;
