import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ScrollView, ActivityIndicator, Animated, Keyboard, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, NavigationProp } from '@react-navigation/native';
import { Theme } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { homeAPI } from '../services/api';
import { Bell, Search, ArrowLeft, X } from 'lucide-react-native';
import NotificationBell from '../components/NotificationBell';

const ServiceListingScreen = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const route = useRoute<any>();
    const { slug, name, isOthers } = route.params || { slug: 'all', name: 'Services', isOthers: false };

    const [activeFilter, setActiveFilter] = useState('ALL');
    const [filters, setFilters] = useState<string[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const searchInputRef = useRef<TextInput>(null);
    const searchAnim = useRef(new Animated.Value(0)).current;

    // Filter by both search query and active filter chip
    const filteredServices = services.filter(s => {
        const matchesSearch = searchQuery.trim()
            ? (s.title || s.name || '').toLowerCase().includes(searchQuery.toLowerCase())
            : true;
        const matchesFilter = activeFilter === 'ALL' ? true :
            (s.category || s.filter || '').toLowerCase() === activeFilter.toLowerCase();
        return matchesSearch && matchesFilter;
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await homeAPI.getServiceListing(slug);
                if (response.data) {
                    setFilters(response.data.filters || []);
                    setServices(response.data.services || []);
                }
            } catch (error) {
                console.error(`Failed to fetch data for ${slug}`, error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [slug]);

    const openSearch = () => {
        setSearchOpen(true);
        Animated.spring(searchAnim, {
            toValue: 1,
            useNativeDriver: false,
            tension: 80,
            friction: 10,
        }).start(() => {
            searchInputRef.current?.focus();
        });
    };

    const closeSearch = () => {
        Keyboard.dismiss();
        setSearchQuery('');
        Animated.spring(searchAnim, {
            toValue: 0,
            useNativeDriver: false,
            tension: 80,
            friction: 10,
        }).start(() => {
            setSearchOpen(false);
        });
    };

    const searchBarWidth = searchAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '70%'],
    });

    const renderServiceCard = useCallback(({ item }: { item: any }) => {
        // For Others category: navigate to request form instead of service detail
        const handlePress = () => {
            if (isOthers) {
                navigation.navigate('OthersServiceRequest', {
                    serviceName: item.title || item.name || name,
                    serviceItemId: item.id,
                    subcategoryName: name,
                });
            } else {
                navigation.navigate('ServiceDetail', { item });
            }
        };

        return (
            <TouchableOpacity
                style={[styles.card, isOthers && styles.cardOthers]}
                onPress={handlePress}
            >
                <View style={[styles.cardIconBox, { backgroundColor: item.color || (isOthers ? '#F5F0FF' : '#FFF5F0') }]}>
                    {item.image ? (
                        <Image source={{ uri: item.image }} style={{ width: 60, height: 60, borderRadius: 16, resizeMode: 'contain' }} />
                    ) : (
                        <Text style={{ fontSize: 32 }}>🛠️</Text>
                    )}
                </View>

                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDuration}>{isOthers ? 'ON DEMAND' : item.duration}</Text>
                        {isOthers ? (
                            <View style={styles.onDemandBadge}>
                                <Text style={styles.onDemandText}>📋 Request Admin</Text>
                            </View>
                        ) : null}
                </View>

                {!isOthers && (
                    <View style={styles.ratingBadge}>
                        <Text style={styles.star}>★</Text>
                        <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                )}
                {isOthers && (
                    <View style={[styles.ratingBadge, styles.adminBadge]}>
                        <Text style={styles.adminBadgeText}>ADMIN</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    }, [navigation, isOthers, name]);

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Theme.colors.brandOrange} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header Cluster - Fixed above FlatList */}
            <View style={styles.header}>
                {!searchOpen && (
                    <TouchableOpacity activeOpacity={0.7} style={styles.logoContainer} onPress={() => navigation.navigate("MainTabs" as any, { screen: "Explore" } as any)}>
                        <View style={styles.logoIcon}>
                            <Image source={require('../assets/images/logo.png')} style={{ width: '100%', height: '100%', borderRadius: 10, resizeMode: 'cover' }} />
                        </View>
                        <Text style={styles.headerTitle}>
                            <Text style={styles.titleOlfix}>OLFIX</Text>
                        </Text>
                    </TouchableOpacity>
                )}

                <View style={styles.headerRight}>
                    {searchOpen && (
                        <Animated.View style={[styles.inlineSearchBar, { width: searchBarWidth }]}>
                            <Search size={16} color={Theme.colors.textLight} />
                            <TextInput
                                ref={searchInputRef}
                                placeholder={`Search in ${name}...`}
                                placeholderTextColor={Theme.colors.textLight}
                                style={styles.inlineSearchInput}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                returnKeyType="search"
                                autoCorrect={false}
                                autoCapitalize="none"
                            />
                        </Animated.View>
                    )}

                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={searchOpen ? closeSearch : openSearch}
                    >
                        {searchOpen
                            ? <X size={20} color={Theme.colors.textDark} />
                            : <Search size={20} color={Theme.colors.textDark} />
                        }
                    </TouchableOpacity>

                    {!searchOpen && (
                        <NotificationBell navigation={navigation} />
                    )}
                </View>
            </View>

            {/* Page Title Row */}
            <View style={styles.pageTitleContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={22} color="#2D3748" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.pageTitle}>{name.toUpperCase()}</Text>
                    <Text style={styles.resultsText}>
                        {filteredServices.length} {searchQuery.trim() ? 'RESULTS FOUND' : 'SERVICES'}
                    </Text>
                </View>
            </View>

            {/* Non-scrolling components (Filters & Sort) sit above FlatList */}
            <View>
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

                <View style={styles.sortContainer}>
                    <TouchableOpacity style={styles.sortButton}>
                        <Text style={styles.sortText}>TOP RATED ★</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sortButton}>
                        <Text style={styles.sortText}>LOWEST PRICE ₹</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={filteredServices}
                renderItem={renderServiceCard}
                keyExtractor={item => String(item.id)}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Search size={36} color="#CBD5E0" />
                        <Text style={styles.emptyTitle}>
                            {searchQuery.trim() ? `No results for "${searchQuery}"` : 'No services found'}
                        </Text>
                        <Text style={styles.emptySubtitle}>Try a different search or filter</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },

    // Header
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
    },
    logoContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    logoIcon: { width: 40, height: 40, backgroundColor: "transparent", borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    logoIconText: { fontSize: 24, color: 'white' },
    headerTitle: { fontSize: 22, fontWeight: 'bold' },
    titleOlfix: { color: Theme.colors.brandOrange, fontWeight: '900' },

    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconButton: {
        width: 40,
        height: 40,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    notificationBadge: { width: 8, height: 8, backgroundColor: Theme.colors.brandOrange, borderRadius: 4, position: 'absolute', top: 8, right: 8, borderWidth: 1, borderColor: '#FFF' },

    // Inline animated search bar
    inlineSearchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 10,
        height: 40,
        borderWidth: 1,
        borderColor: Theme.colors.brandOrange,
        overflow: 'hidden',
    },
    inlineSearchInput: {
        flex: 1,
        marginLeft: 6,
        fontSize: 14,
        color: Theme.colors.textDark,
        height: 40,
    },

    listContent: { paddingBottom: 100 },

    // Page Title
    pageTitleContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20, marginTop: 10 },
    backButton: { width: 45, height: 45, backgroundColor: '#F7FAFC', borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#1A1025', fontStyle: 'italic', marginLeft: 5, flexShrink: 1 },
    resultsText: { fontSize: 10, fontWeight: 'bold', color: '#A0AEC0', letterSpacing: 1, marginLeft: 5, marginTop: 5 },

    // Filters
    filtersScroll: { paddingHorizontal: 20, marginBottom: 20 },
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
    cardOthers: { borderLeftWidth: 3, borderLeftColor: '#805AD5' },
    cardIconBox: { width: 100, height: 100, borderRadius: 20, marginRight: 20, justifyContent: 'center', alignItems: 'center' },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1025', marginBottom: 5 },
    cardDuration: { fontSize: 10, fontWeight: 'bold', color: '#A0AEC0', letterSpacing: 1, marginBottom: 10 },
    cardPrice: { fontSize: 20, fontWeight: '900', color: Theme.colors.brandOrange },

    // Others / On-demand variants
    onDemandBadge: { backgroundColor: '#FAF5FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
    onDemandText: { fontSize: 11, fontWeight: '700', color: '#805AD5' },

    ratingBadge: { position: 'absolute', bottom: 20, right: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFAF0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    star: { color: '#ECC94B', fontSize: 12, marginRight: 4 },
    ratingText: { fontSize: 12, fontWeight: 'bold', color: '#D69E2E' },
    adminBadge: { backgroundColor: '#EDE9FE' },
    adminBadgeText: { fontSize: 10, fontWeight: '800', color: '#6B46C1', letterSpacing: 0.5 },

    // Empty state
    emptyContainer: { alignItems: 'center', paddingTop: 50, paddingBottom: 20 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#4A5568', marginTop: 12, marginBottom: 4 },
    emptySubtitle: { fontSize: 13, color: '#A0AEC0' },
});

export default ServiceListingScreen;
