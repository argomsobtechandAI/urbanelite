import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Image, TouchableOpacity, FlatList, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Theme } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { homeAPI } from '../services/api';

const ACRepairScreen = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [filters, setFilters] = useState<string[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await homeAPI.getServiceDetails('ACRepair');
                setFilters(response.data.filters);
                setServices(response.data.services);
            } catch (error) {
                console.error('Failed to fetch ACRepair data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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
                <Image
                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3602/3602145.png' }}
                    style={styles.notificationIcon}
                />
                <View style={styles.notificationBadge} />
            </TouchableOpacity>
        </View>
    );

    const renderSearchBar = () => (
        <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
                <Text style={{ fontSize: 18, color: Theme.colors.textLight }}>🔍</Text>
                <TextInput
                    placeholder="Search for services..."
                    placeholderTextColor={Theme.colors.textLight}
                    style={styles.searchInput}
                />
                <Image
                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3018/3018442.png' }}
                    style={styles.filterIcon}
                />
            </View>
        </View>
    );

    const renderServiceCard = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ServiceDetail', { item })}
        >
            {item.isImage ? (
                <Image source={{ uri: item.image }} style={styles.cardImage} />
            ) : (
                <View style={[styles.cardPlaceholder, { backgroundColor: item.color || '#F7FAFC' }]}>
                    <Image source={{ uri: item.image }} style={{ width: 50, height: 50, resizeMode: 'contain' }} />
                </View>
            )}

            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode='tail'>{item.titleFull || item.title}</Text>
                <Text style={styles.cardDuration}>{item.duration}</Text>
                <Text style={styles.cardPrice}>{item.price}</Text>
            </View>

            <View style={styles.ratingBadge}>
                <Text style={styles.star}>★</Text>
                <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
        </TouchableOpacity>
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
            <FlatList
                data={services}
                renderItem={renderServiceCard}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <>
                        {renderHeader()}
                        {renderSearchBar()}

                        {/* Page Title & Back */}
                        <View style={styles.pageTitleContainer}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                                <Text style={styles.backArrow}>‹</Text>
                            </TouchableOpacity>
                            <View>
                                <Text style={styles.pageTitle}>AC & APPLIANCE</Text>
                                <Text style={[styles.pageTitle, { marginTop: 0 }]}>REPAIR</Text>
                                <Text style={styles.resultsText}>{services.length} RESULTS FOUND</Text>
                            </View>
                        </View>

                        {/* Filters */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
                            {filters.map((filter) => (
                                <TouchableOpacity
                                    key={filter}
                                    style={[styles.filterChip, activeFilter === filter && styles.activeFilterChip]}
                                    onPress={() => setActiveFilter(filter)}
                                >
                                    <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>
                                        {filter}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Sort Options */}
                        <View style={styles.sortContainer}>
                            <TouchableOpacity style={styles.sortButton}>
                                <Text style={styles.sortText}>TOP RATED ★</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.sortButton}>
                                <Text style={styles.sortText}>LOWEST PRICE ₹</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                }
            />
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

    listContent: { paddingBottom: 100 },

    // Page Title
    pageTitleContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 25 },
    backButton: { width: 45, height: 45, backgroundColor: '#F7FAFC', borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    backArrow: { fontSize: 28, color: '#2D3748', fontWeight: 'bold', marginTop: -2 },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#1A1025', fontStyle: 'italic', marginLeft: 5 },
    resultsText: { fontSize: 10, fontWeight: 'bold', color: '#A0AEC0', letterSpacing: 1, marginLeft: 5, marginTop: 5 },

    // Filters
    filtersScroll: { paddingHorizontal: 20, marginBottom: 25 },
    filterChip: { width: 90, height: 90, borderRadius: 45, borderWidth: 1, borderColor: '#EDF2F7', justifyContent: 'center', alignItems: 'center', marginRight: 15, backgroundColor: '#FFFFFF' },
    activeFilterChip: { backgroundColor: Theme.colors.brandOrange, borderColor: Theme.colors.brandOrange, elevation: 5, shadowColor: Theme.colors.brandOrange, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 },
    filterText: { fontSize: 10, fontWeight: 'bold', color: '#718096', textAlign: 'center', lineHeight: 14 },
    activeFilterText: { color: '#FFFFFF' },

    // Sort
    sortContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20 },
    sortButton: { backgroundColor: '#F7FAFC', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, marginRight: 10 },
    sortText: { fontSize: 10, fontWeight: 'bold', color: '#A0AEC0', letterSpacing: 1 },

    // Service Card
    card: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 25, marginHorizontal: 20, marginBottom: 20, padding: 15, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
    cardImage: { width: 100, height: 100, borderRadius: 20, marginRight: 20 },
    cardPlaceholder: { width: 100, height: 100, borderRadius: 20, marginRight: 20 },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1025', marginBottom: 5,  },
    cardDuration: { fontSize: 10, fontWeight: 'bold', color: '#A0AEC0', letterSpacing: 1, marginBottom: 10 },
    cardPrice: { fontSize: 20, fontWeight: '900', color: Theme.colors.brandOrange },

    ratingBadge: { position: 'absolute', bottom: 20, right: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFAF0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    star: { color: '#ECC94B', fontSize: 12, marginRight: 4 },
    ratingText: { fontSize: 12, fontWeight: 'bold', color: '#D69E2E' },
});

export default ACRepairScreen;
