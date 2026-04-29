import React, { useState, useRef, useCallback } from 'react';

import {
    StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList,
    ActivityIndicator, Animated, Keyboard, Image, Platform, PermissionsAndroid
} from 'react-native';
const RNAndroidLocationEnabler = require('react-native-android-location-enabler').default || require('react-native-android-location-enabler');
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';

import { Theme } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { homeAPI, notificationsAPI } from '../services/api';
import { authService } from '../services/authService';
import { Bell, User, Search, X } from 'lucide-react-native';


const HomeScreen = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [services, setServices] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const searchInputRef = useRef<TextInput>(null);
    const searchAnim = useRef(new Animated.Value(0)).current;
    const searchDebounceTimer = useRef<any>(null);

    // Refresh unread count whenever screen comes into focus
    useFocusEffect(
        useCallback(() => {
            authService.isAuthenticated().then(isAuth => {
                if (isAuth) {
                    notificationsAPI.getUnreadCount()
                        .then(res => setUnreadCount(res.data.unreadCount || 0))
                        .catch(err => {
                            // Suppress 401 errors from unread count (avoid toast spam)
                            if (err.response && err.response.status === 401) return;
                            console.warn('Failed to fetch unread count', err);
                        });
                } else {
                    setUnreadCount(0);
                }
            });
        }, [])
    );



    // Global Search Logic
    const handleSearch = useCallback(async (query: string) => {
        setSearchQuery(query);
        if (searchDebounceTimer.current) clearTimeout(searchDebounceTimer.current);

        if (!query.trim() || query.length < 2) {
            setSearchResults([]);
            return;
        }

        searchDebounceTimer.current = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const res = await homeAPI.search(query);
                setSearchResults(res.data.results || []);
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setSearchLoading(false);
            }
        }, 300);
    }, []);

    // main home screen services stay unfiltered
    const filteredServices = services;

    useFocusEffect(
        useCallback(() => {
            checkLocationPermission();
            homeAPI.getHomeData()
                .then(res => setServices(res.data.services || []))
                .catch(err => console.error('HomeScreen fetch error:', err))
                .finally(() => setLoading(false));
        }, [])
    );

    const checkLocationPermission = async () => {
        if (Platform.OS !== 'android') return;
        try {
            await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'Location Permission Required',
                    message: 'OLFIX requires location access to provide services in your area.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                }
            );
            try {
                await RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
                    interval: 10000,
                    fastInterval: 5000,
                });
            } catch {
                // GPS enable declined — do NOT retry recursively
            }
        } catch (err) {
            console.warn('Location permission not granted:', err);
        }
    };

    const openSearch = () => {
        setSearchOpen(true);
        Animated.spring(searchAnim, { toValue: 1, useNativeDriver: false, tension: 80, friction: 10 })
            .start(() => searchInputRef.current?.focus());
    };

    const closeSearch = () => {
        Keyboard.dismiss();
        setSearchQuery('');
        Animated.spring(searchAnim, { toValue: 0, useNativeDriver: false, tension: 80, friction: 10 })
            .start(() => setSearchOpen(false));
    };

    const searchBarWidth = searchAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '72%'] });

    // renderItem is stable — no state deps that change on search
    const renderServiceItem = useCallback(({ item }: { item: any }) => {
        if (!item?.name) return null;
        return (
            <TouchableOpacity
                style={styles.gridItem}
                onPress={() => {
                    const slug = item.slug || item.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                    const isOthers = item.is_others === true || item.slug === 'others';
                    navigation.navigate('SubCategory', { slug, name: item.name, isOthers });
                }}
            >
                <View style={styles.iconContainer}>
                    {item.image ? (
                        <Image source={{ uri: item.image }} style={{ width: 44, height: 44, borderRadius: 12, resizeMode: 'contain' }} />
                    ) : (
                        <Text style={{ fontSize: 24 }}>🛠️</Text>
                    )}
                </View>
                <Text style={styles.serviceText}>{item.name}</Text>
            </TouchableOpacity>
        );
    }, [navigation]);

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Theme.colors.brandOrange} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>

            {/* ── HEADER (always mounted, never inside FlatList) ── */}
            <View style={styles.header}>
                {!searchOpen && (
                    <TouchableOpacity
                        style={styles.logoContainer}
                        onPress={() => navigation.navigate('MainTabs' as any, { screen: 'Explore' } as any)}
                        activeOpacity={0.75}
                    >
                        <View style={styles.logoIcon}>
                            <Image source={require('../assets/images/logo.png')} style={{ width: '100%', height: '100%', borderRadius: 10, resizeMode: 'cover' }} />
                        </View>
                        <Text style={styles.headerTitle}>
                            <Text style={styles.titleOlfix}>OLFIX</Text>
                        </Text>
                    </TouchableOpacity>
                )}

                <View style={styles.headerRight}>
                    {/* Animated search input — always mounted when searchOpen */}
                    {searchOpen && (
                        <Animated.View style={[styles.inlineSearchBar, { width: searchBarWidth }]}>
                            <Search size={16} color={Theme.colors.textLight} />
                            <TextInput
                                ref={searchInputRef}
                                placeholder="Search services..."
                                placeholderTextColor={Theme.colors.textLight}
                                style={styles.inlineSearchInput}
                                value={searchQuery}
                                onChangeText={handleSearch}
                                returnKeyType="search"
                                autoCorrect={false}
                                autoCapitalize="none"
                            />
                        </Animated.View>
                    )}

                    <TouchableOpacity style={styles.iconButton} onPress={searchOpen ? closeSearch : openSearch}>
                        {searchOpen ? <X size={20} color={Theme.colors.textDark} /> : <Search size={20} color={Theme.colors.textDark} />}
                    </TouchableOpacity>

                    {!searchOpen && (
                        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
                            <Bell size={22} color={Theme.colors.textDark} />
                            {unreadCount > 0 && (
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}

                </View>
            </View>

            {/* ── SEARCH RESULTS DROPDOWN ── */}
            {searchOpen && searchQuery.length >= 2 && (
                <View style={styles.searchDropdown}>
                    {searchLoading ? (
                        <ActivityIndicator style={{ padding: 20 }} color={Theme.colors.brandOrange} />
                    ) : searchResults.length > 0 ? (
                        <FlatList
                            data={searchResults}
                            keyExtractor={(item, idx) => `${item.type}-${item.id}-${idx}`}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.searchResultItem}
                                    onPress={() => {
                                        closeSearch();
                                        if (item.type === 'CATEGORY') {
                                            navigation.navigate('SubCategory', { slug: item.slug, name: item.name });
                                        } else if (item.type === 'SUBCATEGORY') {
                                            navigation.navigate('ServiceListing' as any, { slug: item.slug, name: item.name } as any);
                                        } else if (item.type === 'SERVICE') {
                                            // Construct a minimal item for VendorSelection
                                            const serviceItem = {
                                                id: item.id,
                                                title: item.name,
                                                price: item.price,
                                                image: item.image,
                                                subcategory_id: item.subcategory_id
                                            };
                                            navigation.navigate('VendorSelection', { item: serviceItem });
                                        }
                                    }}
                                >
                                    <View style={styles.searchResultIcon}>
                                        {item.image ? (
                                            <Image source={{ uri: item.image }} style={styles.searchResultImg} />
                                        ) : (
                                            <Search size={16} color="#A0AEC0" />
                                        )}
                                    </View>
                                    <View style={styles.searchResultInfo}>
                                        <Text style={styles.searchResultName}>{item.name}</Text>
                                        <Text style={styles.searchResultType}>
                                            {item.type === 'SERVICE' ? `Service • ${item.price || ''}` : item.type.toLowerCase()}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            keyboardShouldPersistTaps="handled"
                            style={{ maxHeight: 400 }}
                        />
                    ) : (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: '#A0AEC0' }}>No results for "{searchQuery}"</Text>
                        </View>
                    )}
                </View>
            )}

            {/* ── HERO BANNER (always mounted, never inside FlatList) ── */}
            <View style={styles.heroBanner}>
                <View style={styles.heroContent}>
                    <Text style={styles.heroTitle}>We</Text>
                    <Text style={styles.heroSubtitle}>Fix all</Text>
                    <TouchableOpacity style={styles.bookNowButton}>
                        <Text style={styles.bookNowText}>BOOK SERVICE</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.heroImageContainer}>
                    <User size={80} color="#0F172A" />
                </View>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Top Categories</Text>
            </View>

            {/* ── FLAT LIST — only renders grid items, no header inside ── */}
            <FlatList
                data={filteredServices}
                renderItem={renderServiceItem}
                keyExtractor={item => String(item.id)}
                numColumns={3}
                contentContainerStyle={styles.gridContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                    <View style={styles.emptySearch}>
                        <Search size={40} color="#CBD5E0" />
                        <Text style={styles.emptySearchTitle}>
                            {searchQuery.trim() ? `No results for "${searchQuery}"` : 'No services available'}
                        </Text>
                        <Text style={styles.emptySearchSub}>Try a different keyword</Text>
                    </View>
                }
                ListFooterComponent={<View style={{ height: 80 }} />}
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
        paddingBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    logoContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    logoIcon: { width: 40, height: 40, backgroundColor: "transparent", borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    logoIconText: { fontSize: 24 },
    headerTitle: { fontSize: 24, fontWeight: Theme.typography.weights.bold },
    titleOlfix: { color: Theme.colors.brandOrange, fontWeight: '900', fontStyle: 'italic', letterSpacing: -0.5 },

    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconButton: {
        width: 40, height: 40,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    notificationBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#EF4444', // Red for badge
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
        zIndex: 10,
        paddingHorizontal: 3,
    },
    badgeText: {
        color: 'white',
        fontSize: 9,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 12,
    },

    inlineSearchBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12, paddingHorizontal: 10,
        height: 40,
        borderWidth: 1, borderColor: Theme.colors.brandOrange,
        overflow: 'hidden',
    },
    inlineSearchInput: { flex: 1, marginLeft: 6, fontSize: 14, color: Theme.colors.textDark, height: 40 },

    // Hero
    heroBanner: {
        backgroundColor: Theme.colors.primary,
        marginHorizontal: 20, marginBottom: 16,
        borderRadius: 20, padding: 20,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        height: 160, overflow: 'hidden',
    },
    heroContent: { flex: 1, zIndex: 10 },
    heroTitle: { fontSize: 24, color: '#FFF', fontWeight: 'bold', fontStyle: 'italic' },
    heroSubtitle: { fontSize: 32, color: '#FFF', fontWeight: '900', marginBottom: 10 },
    bookNowButton: { backgroundColor: '#FFF', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start' },
    bookNowText: { color: Theme.colors.primary, fontWeight: 'bold', fontSize: 12 },
    heroImageContainer: { position: 'absolute', right: -10, bottom: -10, opacity: 0.9 },

    // Section header
    sectionHeader: { paddingHorizontal: 20, marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.textDark },
    resultCount: { fontSize: 12, color: Theme.colors.brandOrange, fontWeight: '700' },

    // Grid
    gridContainer: { paddingHorizontal: 10, paddingBottom: 20 },
    gridItem: { flex: 1, alignItems: 'center', marginBottom: 25, marginHorizontal: 5 },
    iconContainer: { width: 80, height: 80, backgroundColor: '#FFFFFF', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    serviceText: { fontSize: 11, fontWeight: '700', color: Theme.colors.textDark, textAlign: 'center' },

    // Search Dropdown
    searchDropdown: {
        position: 'absolute',
        top: 65,
        left: 20,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 16,
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    searchResultIcon: {
        width: 36,
        height: 36,
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    searchResultImg: {
        width: 24,
        height: 24,
        borderRadius: 4,
    },
    searchResultInfo: {
        flex: 1,
    },
    searchResultName: {
        fontSize: 14,
        fontWeight: '700',
        color: Theme.colors.textDark,
    },
    searchResultType: {
        fontSize: 11,
        color: '#A0AEC0',
        marginTop: 2,
        textTransform: 'capitalize',
    },
    emptySearch: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    emptySearchTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4A5568',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySearchSub: {
        fontSize: 13,
        color: '#A0AEC0',
        marginTop: 6,
        textAlign: 'center',
    },
});

export default HomeScreen;
