import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SectionList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { Theme } from '../theme';
import { userAPI } from '../services/api';
import { formatDisplayDate } from '../utils/dateUtils';

const WalletHistoryScreen = () => {
    const navigation = useNavigation();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadTransactions();
        }, [])
    );

    const loadTransactions = async () => {
        try {
            const response = await userAPI.getWalletTransactions();
            setTransactions(response.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Group transactions by date
    const groupTransactionsByDate = () => {
        const grouped: any = {};

        transactions.forEach((tx) => {
            const date = new Date(tx.date || tx.created_at);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            let dateLabel;
            if (date.toDateString() === today.toDateString()) {
                dateLabel = 'Today';
            } else if (date.toDateString() === yesterday.toDateString()) {
                dateLabel = 'Yesterday';
            } else {
                dateLabel = formatDisplayDate(date);
            }

            if (!grouped[dateLabel]) {
                grouped[dateLabel] = [];
            }
            grouped[dateLabel].push(tx);
        });

        return Object.keys(grouped).map(title => ({
            title,
            data: grouped[title]
        }));
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.transactionCard}>
            <View style={[styles.iconBox, { backgroundColor: item.type === 'credit' ? '#F0FFF4' : '#FFF5F5' }]}>
                {item.type === 'credit' ? (
                    <ArrowDownLeft size={24} color="#48BB78" />
                ) : (
                    <ArrowUpRight size={24} color="#F56565" />
                )}
            </View>
            <View style={styles.details}>
                <Text style={styles.txTitle}>{item.title}</Text>
                <Text style={styles.txTime}>
                    {formatTime(item.date || item.created_at)} • {item.tag || 'Transaction'}
                </Text>
                {item.type === 'debit' && <Text style={styles.debitLabel}>Paid for service</Text>}
            </View>
            <Text style={[styles.amount, { color: item.type === 'credit' ? '#48BB78' : '#1A202C' }]}>
                {item.type === 'credit' ? '+' : '-'}₹{Math.abs(item.amount)}
            </Text>
        </View>
    );

    const sections = groupTransactionsByDate();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Transaction History</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Theme.colors.brandOrange} />
                </View>
            ) : transactions.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                    <Text style={{ fontSize: 16, color: '#94A3B8', textAlign: 'center' }}>
                        No transactions yet
                    </Text>
                    <Text style={{ fontSize: 14, color: '#CBD5E0', textAlign: 'center', marginTop: 10 }}>
                        Your wallet transactions will appear here
                    </Text>
                </View>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    renderSectionHeader={({ section: { title } }) => (
                        <Text style={styles.sectionHeader}>{title}</Text>
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    stickySectionHeadersEnabled={false}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: 'white' },
    backButton: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.textDark },
    listContent: { padding: 20 },

    sectionHeader: { fontSize: 14, fontWeight: 'bold', color: '#94A3B8', marginTop: 15, marginBottom: 10 },

    transactionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    iconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    details: { flex: 1 },
    txTitle: { fontSize: 16, fontWeight: 'bold', color: Theme.colors.textDark },
    txTime: { fontSize: 12, color: '#A0AEC0', marginTop: 2 },
    debitLabel: { fontSize: 10, color: '#CBD5E0', marginTop: 2 },
    amount: { fontSize: 16, fontWeight: 'bold' }
});

export default WalletHistoryScreen;
