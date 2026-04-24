import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { vendorAPI } from '../../services/api';
import { IndianRupee, TrendingUp, CreditCard } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { formatDisplayDate } from '../../utils/dateUtils';

const VendorRevenueScreen = () => {
    const [loading, setLoading] = useState(true);
    const [revenueData, setRevenueData] = useState<any>(null);

    useFocusEffect(
        useCallback(() => {
            fetchRevenue();
        }, [])
    );

    const fetchRevenue = async () => {
        try {
            const response = await vendorAPI.getRevenue();
            setRevenueData(response.data.data);
        } catch (error) {
            console.error('Failed to fetch revenue:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Theme.colors.brandOrange} />
            </SafeAreaView>
        );
    }

    const { totalEarnings, thisMonthEarnings, totalBookings, transactions } = revenueData || {};

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.headerTitle}>Revenue & Earnings</Text>
                    </View>
                    <Text style={styles.headerSubtitle}>Track your income</Text>
                </View>

                {/* Summary Cards */}
                <View style={styles.summaryContainer}>
                    <View style={[styles.summaryCard, { backgroundColor: Theme.colors.brandOrange }]}>
                        <IndianRupee size={32} color="#FFF" />
                        <Text style={styles.summaryValue}>{totalEarnings || '₹0'}</Text>
                        <Text style={styles.summaryLabel}>Total Earnings</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <View style={[styles.smallCard, { backgroundColor: '#DBEAFE' }]}>
                            <TrendingUp size={24} color="#3B82F6" />
                            <Text style={styles.smallCardValue}>{thisMonthEarnings || '₹0'}</Text>
                            <Text style={styles.smallCardLabel}>This Month</Text>
                        </View>

                        <View style={[styles.smallCard, { backgroundColor: '#D1FAE5' }]}>
                            <CreditCard size={24} color="#10B981" />
                            <Text style={styles.smallCardValue}>{totalBookings || 0}</Text>
                            <Text style={styles.smallCardLabel}>Total Bookings</Text>
                        </View>
                    </View>
                </View>

                {/* Transaction History */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Transaction History</Text>
                    {!transactions || transactions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No transactions yet</Text>
                        </View>
                    ) : (
                        transactions.map((transaction: any) => (
                            <View key={transaction.id} style={styles.transactionCard}>
                                <View style={styles.transactionLeft}>
                                    <Text style={styles.transactionService}>{transaction.serviceName}</Text>
                                    <Text style={styles.transactionDate}>
                                        {formatDisplayDate(transaction.date)}
                                    </Text>
                                </View>
                                <View style={styles.transactionRight}>
                                    <Text style={styles.transactionAmount}>{transaction.amount}</Text>
                                    <Text style={styles.transactionStatus}>{transaction.status}</Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    header: { paddingHorizontal: 20, paddingTop: 20, marginBottom: 30 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: Theme.colors.textDark },
    headerSubtitle: { fontSize: 14, color: Theme.colors.textLight, marginTop: 5 },

    summaryContainer: { paddingHorizontal: 20, marginBottom: 30 },
    summaryCard: { padding: 25, borderRadius: 20, marginBottom: 15 },
    summaryValue: { fontSize: 36, fontWeight: 'bold', color: '#FFF', marginVertical: 10 },
    summaryLabel: { fontSize: 14, color: '#FFF', opacity: 0.9 },

    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    smallCard: { flex: 1, padding: 20, borderRadius: 15, marginHorizontal: 5 },
    smallCardValue: { fontSize: 20, fontWeight: 'bold', color: Theme.colors.textDark, marginVertical: 8 },
    smallCardLabel: { fontSize: 12, color: Theme.colors.textLight, fontWeight: '600' },

    section: { paddingHorizontal: 20 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: Theme.colors.textDark, marginBottom: 15 },

    transactionCard: { backgroundColor: '#FFFFFF', borderRadius: 15, padding: 15, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#F3F4F6' },
    transactionLeft: { flex: 1 },
    transactionService: { fontSize: 16, fontWeight: 'bold', color: Theme.colors.textDark, marginBottom: 5 },
    transactionDate: { fontSize: 13, color: Theme.colors.textLight },
    transactionRight: { alignItems: 'flex-end' },
    transactionAmount: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.brandOrange, marginBottom: 5 },
    transactionStatus: { fontSize: 12, color: '#10B981', fontWeight: '600' },

    emptyState: { padding: 40, alignItems: 'center' },
    emptyStateText: { fontSize: 14, color: Theme.colors.textLight },
});

export default VendorRevenueScreen;
