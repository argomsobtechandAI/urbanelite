import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VendorHomeScreen from '../screens/vendor/VendorHomeScreen';
import VendorBookingsScreen from '../screens/vendor/VendorBookingsScreen';
import VendorRevenueScreen from '../screens/vendor/VendorRevenueScreen';
import VendorProfileScreen from '../screens/vendor/VendorProfileScreen';
import VendorCreateOfferScreen from '../screens/vendor/VendorCreateOfferScreen';
import { Theme } from '../theme';

import { LayoutDashboard, Calendar, IndianRupee, User, PlusSquare } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
    const color = focused ? Theme.colors.activeTab : Theme.colors.inactiveTab;
    const size = 24;

    if (name === 'Dashboard') return <LayoutDashboard size={size} color={color} />;
    if (name === 'Bookings') return <Calendar size={size} color={color} />;
    if (name === 'Ads/Promo') return <PlusSquare size={size} color={color} />;
    if (name === 'Revenue') return <IndianRupee size={size} color={color} />;
    if (name === 'Profile') return <User size={size} color={color} />;

    return <LayoutDashboard size={size} color={color} />;
};

const VendorTabNavigator = () => {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: true,
                tabBarActiveTintColor: Theme.colors.activeTab,
                tabBarInactiveTintColor: Theme.colors.inactiveTab,
                tabBarStyle: {
                    backgroundColor: Theme.colors.background,
                    borderTopWidth: 1,
                    borderTopColor: Theme.colors.border,
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom,
                    paddingTop: 5,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarIcon: ({ focused }: { focused: boolean }) => <TabIcon name={route.name} focused={focused} />,
            })}
        >
            <Tab.Screen name="Dashboard" component={VendorHomeScreen} />
            <Tab.Screen name="Bookings" component={VendorBookingsScreen} />
            <Tab.Screen name="Ads/Promo" component={VendorCreateOfferScreen} options={{ tabBarLabel: 'New Ads/Promo' }} />
            <Tab.Screen name="Revenue" component={VendorRevenueScreen} />
            <Tab.Screen name="Profile" component={VendorProfileScreen} />
        </Tab.Navigator>
    );
};

export default VendorTabNavigator;
