import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Animated, Keyboard, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { Theme } from '../theme';
import { RootStackParamList } from '../types/navigation';
import { homeAPI } from '../services/api';
import { Bell, Search, ArrowLeft, X } from 'lucide-react-native';
import NotificationBell from '../components/NotificationBell';

type SubCategoryRouteProp = RouteProp<RootStackParamList, 'SubCategory'>;

const SubCategoryScreen = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const route = useRoute<SubCategoryRouteProp>();
    const { slug, name, isOthers } = route.params || { slug: 'repair-maintenance', name: 'Repair & Maintenance', isOthers: false };

    const [subcategories, setSubcategories] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const searchInputRef = useRef<TextInput>(null);
    const searchAnim = useRef(new Animated.Value(0)).current;

    const filteredSubcategories = searchQuery.trim()
        ? subcategories.filter(s => s.name?.toLowerCase().includes(searchQuery.toLowerCase()))
        : subcategories;

    useEffect(() => {
        const fetchSubCategories = async () => {
            try {
                const response = await homeAPI.getSubCategories(slug);
                if (response.data && response.data.subcategories) {
                    setSubcategories(response.data.subcategories);
                }
            } catch (error) {
                console.error(`Failed to fetch subcategories for ${slug}`, error);
            } finally {
                setLoading(false);
            }
        };
        fetchSubCategories();
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

    const renderSubCategoryItem = useCallback(({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('ServiceListing', { slug: item.slug, name: item.name, isOthers })}
        >
            <View style={styles.iconContainer}>
                {item.image ? (
                    <Image source={{ uri: item.image }} style={{ width: 44, height: 44, borderRadius: 12, resizeMode: 'contain' }} />
                ) : (
                    <Text style={{ fontSize: 24 }}>🛠️</Text>
                )}
            </View>
            <Text style={styles.serviceText}>{item.name}</Text>
        </TouchableOpacity >
    ), [navigation, isOthers]);

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Theme.colors.brandOrange} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header - Fixed above FlatList */}
            <View style={styles.header}>
                {!searchOpen && (
                    <TouchableOpacity activeOpacity={0.7} style={styles.logoContainer} onPress={() => navigation.navigate("MainTabs" as any, { screen: "Explore" } as any)}>
                        <View style={styles.logoIcon}>
                            <Image source={require('../assets/images/logo.png')} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
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
                                placeholder={`Search ${name}...`}
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

            {/* Title Section - Also outside FlatList for stability */}
            <View style={styles.pageTitleContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={22} color="#2D3748" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.pageTitle}>{name.toUpperCase()}</Text>
                    <Text style={styles.resultsText}>
                        {filteredSubcategories.length} {searchQuery.trim() ? 'RESULTS' : 'CATEGORIES'}
                    </Text>
                </View>
            </View>

            <FlatList
                data={filteredSubcategories}
                renderItem={renderSubCategoryItem}
                keyExtractor={item => String(item.id)}
                numColumns={3}
                contentContainerStyle={styles.gridContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Search size={36} color="#CBD5E0" />
                        <Text style={[styles.emptyText, { marginTop: 12 }]}>
                            {searchQuery.trim() ? `No results for "${searchQuery}"` : 'No subcategories found.'}
                        </Text>
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
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
    },
    logoContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    logoIcon: { width: 40, height: 40, backgroundColor: "transparent", borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    logoIconText: { fontSize: 24 },
    headerTitle: { fontSize: 24, fontWeight: Theme.typography.weights.bold },
    titleOlfix: { color: Theme.colors.brandOrange, fontWeight: '900', letterSpacing: -0.5 },

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
    notificationBadge: { width: 8, height: 8, backgroundColor: Theme.colors.primary, borderRadius: 4, position: 'absolute', top: 8, right: 8, borderWidth: 1, borderColor: '#FFF' },

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

    // Page title
    pageTitleContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20, marginTop: 10 },
    backButton: { width: 45, height: 45, backgroundColor: '#F7FAFC', borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#1A1025', fontStyle: 'italic', marginLeft: 5 },
    resultsText: { fontSize: 10, fontWeight: 'bold', color: '#A0AEC0', letterSpacing: 1, marginLeft: 5, marginTop: 5 },

    // Grid
    gridContainer: { paddingHorizontal: 10, paddingBottom: 20 },
    gridItem: { flex: 1, alignItems: 'center', marginBottom: 25, marginHorizontal: 5 },
    iconContainer: { width: 80, height: 80, backgroundColor: '#FFFFFF', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    serviceText: { fontSize: 11, fontWeight: '700', color: Theme.colors.textDark, textAlign: 'center' },

    // Empty
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#A0AEC0', fontSize: 16 },
});

export default SubCategoryScreen;
