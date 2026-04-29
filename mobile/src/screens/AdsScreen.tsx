import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { Theme } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { offersAPI } from '../services/api';
import { Tag, Clock, Briefcase, MapPin } from 'lucide-react-native';
import NotificationBell from '../components/NotificationBell';
import { formatDisplayDate } from '../utils/dateUtils';

const AdsScreen = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'PROMOTION' | 'JOB'>('PROMOTION');

    useFocusEffect(
        useCallback(() => {
            fetchOffers();
        }, [])
    );

    const fetchOffers = async () => {
        try {
            const response = await offersAPI.getOffers();
            if (response.data.success) {
                setOffers(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching offers:', error);
        } finally {
            setLoading(false);
        }
    };

    const pinnedOffers = offers.filter(o => !o.type || o.type === 'PROMOTION');
    const jobOffers = offers.filter(o => o.type === 'JOB');

    const displayData = activeTab === 'PROMOTION' ? pinnedOffers : jobOffers;

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.logoContainer}
                onPress={() => navigation.navigate('MainTabs' as any, { screen: 'Explore' } as any)}
                activeOpacity={0.75}
            >
                <View style={styles.logoIcon}>
                    <Image source={require('../assets/images/logo.png')} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                </View>
                <Text style={styles.headerTitle}>
                    <Text style={styles.titleOlfix}>OLFIX</Text>
                </Text>
            </TouchableOpacity>
            <NotificationBell navigation={navigation} />
        </View>
    );

    const renderTabs = () => (
        <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[styles.tabButton, activeTab === 'PROMOTION' && styles.activeTabButton]}
                onPress={() => setActiveTab('PROMOTION')}
            >
                <Tag size={16} color={activeTab === 'PROMOTION' ? '#FFF' : '#718096'} />
                <Text style={[styles.tabText, activeTab === 'PROMOTION' && styles.activeTabText]}>Promotions</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tabButton, activeTab === 'JOB' && styles.activeTabButton]}
                onPress={() => setActiveTab('JOB')}
            >
                <Briefcase size={16} color={activeTab === 'JOB' ? '#FFF' : '#718096'} />
                <Text style={[styles.tabText, activeTab === 'JOB' && styles.activeTabText]}>Job Openings</Text>
            </TouchableOpacity>
        </View>
    );

    const renderOffer = ({ item }: { item: any }) => {
        if (item.type === 'JOB') {
            return (
                <TouchableOpacity style={styles.jobCard} activeOpacity={0.9}>
                    <View style={styles.jobHeader}>
                        <Image
                            source={{ uri: item.image_url || 'https://via.placeholder.com/100' }}
                            style={styles.companyLogo}
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.jobTitle}>{item.title}</Text>
                            <Text style={styles.companyName}>{item.vendor?.business_name || 'Olfix Partner'}</Text>
                        </View>
                        {item.status === 'ACTIVE' && (
                            <View style={styles.activeTag}>
                                <Text style={styles.activeTagText}>HIRING</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.jobDesc} numberOfLines={3}>{item.description}</Text>

                    <View style={styles.jobMetaRow}>
                        <View style={styles.jobMetaItem}>
                            <Tag size={14} color={Theme.colors.brandOrange} />
                            <Text style={styles.jobMetaText}>{item.discount_amount}</Text>
                        </View>
                        {item.discount_code && (
                            <View style={styles.jobMetaItem}>
                                <Briefcase size={14} color="#718096" />
                                <Text style={styles.jobMetaText}>{item.discount_code}</Text>
                            </View>
                        )}
                    </View>

                    {item.valid_until && (
                        <View style={styles.jobFooter}>
                            <Clock size={12} color="#A0AEC0" />
                            <Text style={styles.expiryText}>Apply by: {formatDisplayDate(item.valid_until)}</Text>
                        </View>
                    )}

                    <TouchableOpacity style={styles.applyButton}>
                        <Text style={styles.applyButtonText}>Apply Now</Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity style={styles.offerCard} activeOpacity={0.9}>
                <Image
                    source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800&q=80' }}
                    style={styles.offerImage}
                />
                <View style={styles.offerContent}>
                    <View style={styles.vendorBadge}>
                        <Text style={styles.vendorName}>{item.vendor?.business_name || 'Olfix Official'}</Text>
                    </View>
                    <Text style={styles.offerTitle}>{item.title}</Text>
                    <Text style={styles.offerDescription} numberOfLines={2}>{item.description}</Text>

                    <View style={styles.offerFooter}>
                        <View style={styles.discountBadge}>
                            <Tag size={14} color="#FFF" />
                            <Text style={styles.discountText}>{item.discount_amount}</Text>
                        </View>
                        {item.discount_code && (
                            <View style={styles.codeContainer}>
                                <Text style={styles.codeLabel}>Code:</Text>
                                <Text style={styles.codeText}>{item.discount_code}</Text>
                            </View>
                        )}
                    </View>
                    {item.valid_until && (
                        <View style={styles.expiryContainer}>
                            <Clock size={12} color="#718096" />
                            <Text style={styles.expiryText}>Valid until: {formatDisplayDate(item.valid_until)}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {renderHeader()}
            {renderTabs()}

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Theme.colors.brandOrange} />
                </View>
            ) : displayData.length === 0 ? (
                <View style={styles.center}>
                    <Image
                        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1182/1182718.png' }}
                        style={styles.emptyIcon}
                    />
                    <Text style={styles.emptyText}>No {activeTab === 'JOB' ? 'jobs' : 'offers'} available.</Text>
                    <Text style={styles.emptySubtext}>Check back later!</Text>
                </View>
            ) : (
                <FlatList
                    data={displayData}
                    renderItem={renderOffer}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshing={loading}
                    onRefresh={fetchOffers}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    logoContainer: { flexDirection: 'row', alignItems: 'center' },
    logoIcon: { width: 40, height: 40, backgroundColor: "transparent", borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    logoIconText: { fontSize: 24, color: 'white' },
    headerTitle: { fontSize: 22, fontWeight: 'bold' },
    titleOlfix: { color: Theme.colors.brandOrange, fontWeight: '900', fontStyle: 'italic' },
    notificationButton: { width: 40, height: 40, backgroundColor: Theme.colors.searchBg, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    notificationIcon: { width: 20, height: 20, tintColor: Theme.colors.textLight },

    titleContainer: { paddingHorizontal: 20, marginBottom: 20 },
    title: { fontSize: 28, fontWeight: 'bold', color: Theme.colors.textDark },
    subtitle: { fontSize: 14, color: Theme.colors.textLight },

    listContent: { paddingHorizontal: 20, paddingBottom: 20 },

    offerCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        overflow: 'hidden'
    },
    offerImage: { width: '100%', height: 180 },
    offerContent: { padding: 15 },
    vendorBadge: { position: 'absolute', top: -165, left: 15, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    vendorName: { color: 'white', fontSize: 12, fontWeight: 'bold' },

    offerTitle: { fontSize: 20, fontWeight: 'bold', color: Theme.colors.textDark, marginBottom: 5 },
    offerDescription: { fontSize: 14, color: Theme.colors.textLight, marginBottom: 15, lineHeight: 20 },

    offerFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    discountBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F56565', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 5 },
    discountText: { color: 'white', fontWeight: 'bold', fontSize: 14 },

    codeContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDF2F7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E0' },
    codeLabel: { fontSize: 12, color: '#718096', marginRight: 5 },
    codeText: { fontSize: 14, fontWeight: 'bold', color: Theme.colors.textDark, letterSpacing: 1 },

    expiryContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 5 },
    expiryText: { fontSize: 12, color: '#A0AEC0' },

    emptyIcon: { width: 80, height: 80, marginBottom: 20, opacity: 0.5 },
    emptyText: { fontSize: 18, color: '#A0AEC0', fontWeight: 'bold' },
    emptySubtext: { fontSize: 14, color: '#CBD5E0' },

    // Tabs
    tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15 },
    tabButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#EDF2F7', marginRight: 10, gap: 6 },
    activeTabButton: { backgroundColor: Theme.colors.brandOrange },
    tabText: { fontWeight: 'bold', fontSize: 12, color: '#718096' },
    activeTabText: { color: '#FFF' },

    // Job Card
    jobCard: { backgroundColor: 'white', borderRadius: 20, marginBottom: 15, padding: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, borderLeftWidth: 4, borderLeftColor: Theme.colors.brandOrange },
    jobHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    companyLogo: { width: 50, height: 50, borderRadius: 10, marginRight: 15, backgroundColor: '#eee' },
    jobTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.textDark },
    companyName: { fontSize: 12, color: '#A0AEC0', fontWeight: '600' },
    activeTag: { backgroundColor: '#E6FFFA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, marginLeft: 'auto' },
    activeTagText: { fontSize: 10, color: '#38B2AC', fontWeight: 'bold' },
    jobDesc: { fontSize: 14, color: '#4A5568', lineHeight: 20, marginBottom: 15 },
    jobMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 },
    jobMetaItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FAFC', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 5 },
    jobMetaText: { fontSize: 12, fontWeight: '600', color: '#2D3748' },
    jobFooter: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 15 },
    applyButton: { backgroundColor: Theme.colors.brandOrange, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    applyButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 }
});

export default AdsScreen;
