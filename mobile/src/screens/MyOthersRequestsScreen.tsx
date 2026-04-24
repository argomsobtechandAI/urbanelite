import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, ClipboardList, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react-native';
import { Theme } from '../theme';
import { formatDisplayDate } from '../utils/dateUtils';
import { RootStackParamList } from '../types/navigation';
import { adminRequestAPI } from '../services/api';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
    PENDING: { color: '#D97706', bg: '#FFFBEB', icon: Clock, label: 'Pending Review' },
    REVIEWED: { color: '#4299E1', bg: '#EBF8FF', icon: AlertCircle, label: 'Under Review' },
    IN_PROGRESS: { color: '#805AD5', bg: '#FAF5FF', icon: RefreshCw, label: 'In Progress' },
    COMPLETED: { color: '#48BB78', bg: '#F0FFF4', icon: CheckCircle, label: 'Completed' },
    CANCELLED: { color: '#FC8181', bg: '#FFF5F5', icon: XCircle, label: 'Cancelled' },
};

interface AdminRequest {
    id: string;
    serviceName: string;
    categoryName: string;
    subcategoryName: string;
    description: string;
    preferredDate?: string;
    preferredTime?: string;
    status: string;
    adminNotes?: string;
    createdAt: string;
}

const MyOthersRequestsScreen = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [requests, setRequests] = useState<AdminRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRequests = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            const response = await adminRequestAPI.getMyRequests();
            setRequests(response.data.requests || []);
        } catch (error) {
            console.error('Failed to fetch requests:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchRequests();
        }, [fetchRequests])
    );

    const renderItem = useCallback(({ item }: { item: AdminRequest }) => {
        const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
        const StatusIcon = statusCfg.icon;
        const date = formatDisplayDate(item.createdAt);

        return (
            <View style={styles.card}>
                {/* Top row */}
                <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.serviceName}>{item.serviceName}</Text>
                        {item.subcategoryName ? (
                            <Text style={styles.category}>
                                {item.categoryName} › {item.subcategoryName}
                            </Text>
                        ) : (
                            <Text style={styles.category}>{item.categoryName}</Text>
                        )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                        <StatusIcon size={11} color={statusCfg.color} style={{ marginRight: 4 }} />
                        <Text style={[styles.statusText, { color: statusCfg.color }]}>
                            {statusCfg.label}
                        </Text>
                    </View>
                </View>

                {/* Description */}
                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

                {/* Meta */}
                <View style={styles.cardMeta}>
                    <Text style={styles.metaText}>📅 Submitted: {date}</Text>
                    {item.preferredDate ? (
                        <Text style={styles.metaText}>🗓 Preferred: {formatDisplayDate(item.preferredDate)}</Text>
                    ) : null}
                </View>

                {/* Admin Notes */}
                {item.adminNotes ? (
                    <View style={styles.adminNotesBox}>
                        <Text style={styles.adminNotesLabel}>Admin Response:</Text>
                        <Text style={styles.adminNotesText}>{item.adminNotes}</Text>
                    </View>
                ) : null}

                {/* Request ID */}
                <Text style={styles.requestId}>ID: #{item.id.slice(0, 8).toUpperCase()}</Text>
            </View>
        );
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Theme.colors.brandOrange} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={22} color="#2D3748" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>My Service Requests</Text>
                    <Text style={styles.headerSubtitle}>{requests.length} Request{requests.length !== 1 ? 's' : ''}</Text>
                </View>
            </View>

            <FlatList
                data={requests}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchRequests(true)}
                        colors={[Theme.colors.brandOrange]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <ClipboardList size={56} color="#CBD5E0" />
                        <Text style={styles.emptyTitle}>No Requests Yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Your service requests from the Others category will appear here.
                        </Text>
                    </View>
                }
                ListFooterComponent={<View style={{ height: 40 }} />}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7FAFC' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backButton: {
        width: 40, height: 40,
        borderRadius: 12,
        backgroundColor: '#F7FAFC',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 12,
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A202C' },
    headerSubtitle: { fontSize: 12, color: Theme.colors.brandOrange, fontWeight: '600', marginTop: 2 },

    listContent: { padding: 16 },

    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
    },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    serviceName: { fontSize: 16, fontWeight: '800', color: '#1A202C', marginBottom: 3 },
    category: { fontSize: 12, color: '#718096', fontWeight: '500' },

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginLeft: 8,
    },
    statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

    description: { fontSize: 13, color: '#4A5568', lineHeight: 19, marginBottom: 10 },

    cardMeta: { flexDirection: 'row', gap: 12, marginBottom: 8, flexWrap: 'wrap' },
    metaText: { fontSize: 11, color: '#A0AEC0', fontWeight: '500' },

    adminNotesBox: {
        backgroundColor: '#EBF8FF',
        borderRadius: 10,
        padding: 10,
        marginTop: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#4299E1',
    },
    adminNotesLabel: { fontSize: 11, fontWeight: '700', color: '#2B6CB0', marginBottom: 4 },
    adminNotesText: { fontSize: 12, color: '#2C5282', lineHeight: 17 },

    requestId: { fontSize: 10, color: '#CBD5E0', fontWeight: '600', marginTop: 8, letterSpacing: 0.5 },

    emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 30 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#4A5568', marginTop: 16, marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: '#A0AEC0', textAlign: 'center', lineHeight: 21 },
});

export default MyOthersRequestsScreen;
