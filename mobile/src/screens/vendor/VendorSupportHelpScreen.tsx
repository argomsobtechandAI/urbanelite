import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, LayoutAnimation, Platform, UIManager, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Phone, Mail, ChevronRight, HelpCircle, MessageCircle } from 'lucide-react-native';
import { Theme } from '../../theme';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const VendorSupportHelpScreen = () => {
    const navigation = useNavigation();

    const openWhatsApp = () => {
        const phone = '+918858854373';
        const message = 'Hello Olfix Support, I am a partner and I need help regarding...';
        const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
        
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                // Fallback to web link if app not installed
                Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
            }
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Vendor Support</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <View style={styles.banner}>
                    <View style={styles.bannerContent}>
                        <Text style={styles.bannerTitle}>Support for Partners</Text>
                        <Text style={styles.bannerSubtitle}>Need help with payouts or bookings? We are here for you.</Text>
                    </View>
                    <HelpCircle size={60} color="rgba(255,255,255,0.2)" style={styles.bannerIcon} />
                </View>

                <Text style={styles.sectionTitle}>Direct Chat Support</Text>

                <TouchableOpacity style={styles.whatsappCard} onPress={openWhatsApp}>
                    <View style={styles.whatsappIconBox}>
                        <MessageCircle size={32} color="white" />
                    </View>
                    <View style={styles.whatsappTextContent}>
                        <Text style={styles.whatsappTitle}>Chat on WhatsApp</Text>
                        <Text style={styles.whatsappSubtitle}>Instant support for all your queries</Text>
                    </View>
                    <ChevronRight size={24} color="#64748B" />
                </TouchableOpacity>

                <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Other Ways to Reach Us</Text>

                <View style={styles.contactGrid}>
                    <TouchableOpacity style={styles.contactCard} onPress={() => Linking.openURL('tel:+918858854373')}>
                        <View style={[styles.contactIconBox, { backgroundColor: '#E0F2FE' }]}>
                            <Phone size={24} color="#0EA5E9" />
                        </View>
                        <Text style={styles.contactLabel}>Call Support</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.contactCard} onPress={() => Linking.openURL('mailto:olfixandaman@gmail.com')}>
                        <View style={[styles.contactIconBox, { backgroundColor: '#F3E8FF' }]}>
                            <Mail size={24} color="#A855F7" />
                        </View>
                        <Text style={styles.contactLabel}>Email Support</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Merchant FAQs</Text>

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
        { q: 'When do I get my payouts?', a: 'Payouts are processed weekly on Wednesdays for all completed orders from the previous week.' },
        { q: 'How to increase my service radius?', a: 'You can request a service radius increase by contacting support or upgrading to a Premium Partner tier.' },
        { q: 'What if a customer cancels late?', a: 'For late cancellations (within 4 hours of slot), you will receive 50% of the booking fee as compensation.' },
        { q: 'How do I add more services?', a: 'Go to your Services tab and click "Add New Service". Approval takes 24-48 hours.' },
        { q: 'Tax documents requirement?', a: 'You must upload your GST certificate and PAN card in the Profile > Documents section for tax compliance.' }
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
    
    whatsappCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FFF4', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#C6F6D5', shadowColor: '#38A169', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    whatsappIconBox: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    whatsappTextContent: { flex: 1 },
    whatsappTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.textDark, marginBottom: 4 },
    whatsappSubtitle: { fontSize: 14, color: '#38A169', fontWeight: '500' },

    faqList: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0', overflow: 'hidden' },
    faqWrapper: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    faqQuestion: { fontSize: 15, color: Theme.colors.textDark, fontWeight: '500', flex: 1, marginRight: 10 },
    faqBody: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 0 },
    faqAnswer: { fontSize: 14, color: '#64748B', lineHeight: 20 }
});

export default VendorSupportHelpScreen;
