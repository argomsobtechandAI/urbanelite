import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { Theme } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { userAPI } from '../services/api';
import { Bell } from 'lucide-react-native';

const WalletScreen = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [balance, setBalance] = useState('₹0');
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchWalletData = async () => {
        try {
            const response = await userAPI.getWallet();
            const cleanBalance = response.data.balance ? response.data.balance.toString().replace(/₹/g, '').trim() : '0';
            setBalance(`₹${cleanBalance}`);
            setTransactions(response.data.transactions);
        } catch (error) {
            console.error('Failed to fetch wallet data', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchWalletData();
        }, [])
    );

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity activeOpacity={0.7} style={styles.logoContainer} onPress={() => navigation.navigate("MainTabs" as any, { screen: "Explore" } as any)}>
                <View style={styles.logoIcon}>
                    <Text style={styles.logoIconText}>🛠️</Text>
                </View>
                <Text style={styles.headerTitle}>
                    <Text style={styles.titleOlfix}>OLFIX</Text>
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => navigation.navigate('Notifications')}
            >
                <Bell size={22} color={Theme.colors.textDark} />
                <View style={styles.notificationBadge} />
            </TouchableOpacity>
        </View>
    );




    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Theme.colors.brandOrange} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {renderHeader()}

                <View style={styles.contentContainer}>
                    {/* Wallet Title */}
                    <View style={styles.titleSection}>
                        <Text style={styles.pageTitle}>WALLET</Text>
                        <Text style={styles.pageSubtitle}>TRACK SPENDS</Text>
                    </View>

                    {/* Balance Card */}
                    <View style={styles.balanceCard}>
                        <View style={styles.balanceHeader}>
                            <View>
                                <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
                                <Text style={styles.balanceAmount}>{balance}</Text>
                            </View>
                            <View style={styles.cardIconBox}>
                                <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/633/633611.png' }} style={styles.cardIcon} />
                            </View>
                        </View>

                        <View style={styles.cardActions}>
                            <TouchableOpacity
                                style={styles.topUpBtn}
                                onPress={() => navigation.navigate('Topup' as any)}
                            >
                                <Text style={styles.topUpText}>+ Top up</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.historyBtn}
                                onPress={() => navigation.navigate('WalletHistory' as any)}
                            >
                                <Text style={styles.historyText}>History</Text>
                            </TouchableOpacity>
                        </View>
                    </View>



                    {/* Recent Activity */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
                    </View>

                    <View style={styles.activityList}>
                        {transactions.map(item => (
                            <View key={item.id} style={styles.activityCard}>
                                <View style={[styles.activityIconBox, { backgroundColor: item.type === 'credit' ? '#F0FFF4' : '#F7FAFC' }]}>
                                    <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                                </View>
                                <View style={styles.activityInfo}>
                                    <Text style={styles.activityTitle}>{item.title}</Text>
                                    <View style={styles.activityMeta}>
                                        <Text style={styles.activityDate}>{item.date}</Text>
                                        <Text style={styles.activityDot}>•</Text>
                                        <Text style={styles.activityTag}>{item.tag}</Text>
                                    </View>
                                </View>
                                <View style={styles.activityAmountBox}>
                                    <Text style={[styles.activityAmount, { color: item.type === 'credit' ? '#48BB78' : '#1A202C' }]}>
                                        {item.amount}
                                    </Text>
                                    <Text style={styles.activityStatus}>SUCCESSFUL</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Bottom Spacer */}
                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },

    // Header
    header: { paddingHorizontal: 20, paddingTop: 10, marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    logoContainer: { flexDirection: 'row', alignItems: 'center' },
    logoIcon: { width: 40, height: 40, backgroundColor: Theme.colors.brandOrange, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    logoIconText: { fontSize: 24, color: 'white' },
    headerTitle: { fontSize: 22, fontWeight: 'bold' },
    titleOlfix: { color: Theme.colors.brandOrange, fontWeight: '900', fontStyle: 'italic' },
    notificationButton: { width: 40, height: 40, backgroundColor: Theme.colors.searchBg, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    notificationIcon: { width: 20, height: 20, tintColor: Theme.colors.textLight },
    notificationBadge: { width: 8, height: 8, backgroundColor: Theme.colors.brandOrange, borderRadius: 4, position: 'absolute', top: 10, right: 10, borderWidth: 1, borderColor: '#FFF' },

    // Search
    searchContainer: { paddingHorizontal: 20, marginBottom: 10 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.searchBg, borderRadius: 15, paddingHorizontal: 15, paddingVertical: 12 },
    searchInput: { marginLeft: 10, flex: 1, fontSize: 16, color: Theme.colors.textDark },
    filterIcon: { width: 20, height: 20, tintColor: Theme.colors.textLight },

    contentContainer: { paddingHorizontal: 20 },

    // Wallet Title
    titleSection: { marginVertical: 20 },
    pageTitle: { fontSize: 28, fontWeight: '900', color: '#1A202C', fontStyle: 'italic' },
    pageSubtitle: { fontSize: 12, fontWeight: 'bold', color: '#A0AEC0', letterSpacing: 2, marginTop: 5 },

    // Balance Card
    balanceCard: { backgroundColor: Theme.colors.brandOrange, borderRadius: 25, padding: 25, marginBottom: 30 },
    balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 },
    balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 5 },
    balanceAmount: { color: 'white', fontSize: 42, fontWeight: 'bold' },
    cardIconBox: { width: 50, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    cardIcon: { width: 24, height: 24, tintColor: 'white' },
    cardActions: { flexDirection: 'row' },
    topUpBtn: { backgroundColor: '#1A1025', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12, marginRight: 15 },
    topUpText: { color: 'white', fontWeight: 'bold' },
    historyBtn: { borderColor: 'rgba(255,255,255,0.3)', borderWidth: 1, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12 },
    historyText: { color: 'white', fontWeight: 'bold' },

    // Sections
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
    sectionTitle: { fontSize: 12, fontWeight: '900', color: '#2D3748', letterSpacing: 1 },



    // Activity
    activityList: { marginTop: 10 },
    activityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 15, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#F7FAFC', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
    activityIconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    activityInfo: { flex: 1 },
    activityTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D3748', marginBottom: 5 },
    activityMeta: { flexDirection: 'row', alignItems: 'center' },
    activityDate: { fontSize: 11, color: '#A0AEC0', fontWeight: 'bold' },
    activityDot: { marginHorizontal: 5, color: '#CBD5E0' },
    activityTag: { fontSize: 10, color: '#A0AEC0', fontWeight: 'bold' },
    activityAmountBox: { alignItems: 'flex-end' },
    activityAmount: { fontSize: 16, fontWeight: '900' },
    activityStatus: { fontSize: 9, color: '#CBD5E0', fontWeight: 'bold', marginTop: 5 },

    seeAllButton: { alignItems: 'center', paddingVertical: 20 },
    seeAllText: { color: '#A0AEC0', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
});

export default WalletScreen;
