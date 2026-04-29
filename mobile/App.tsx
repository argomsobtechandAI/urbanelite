import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, ActivityIndicator, View, BackHandler, Alert } from 'react-native';
import { authService } from './src/services/authService';

import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import InstaHelpScreen from './src/screens/InstaHelpScreen';
import WomensSalonScreen from './src/screens/WomensSalonScreen';
import MensSalonScreen from './src/screens/MensSalonScreen';
import CleaningScreen from './src/screens/CleaningScreen';
import ElectricianScreen from './src/screens/ElectricianScreen';
import NativeWaterPurifierScreen from './src/screens/NativeWaterPurifierScreen';
import NativeSmartHomeScreen from './src/screens/NativeSmartHomeScreen';
import PaintingScreen from './src/screens/PaintingScreen';
import ACRepairScreen from './src/screens/ACRepairScreen';
import RevampScreen from './src/screens/RevampScreen';
import ServiceDetailScreen from './src/screens/ServiceDetailScreen';
import BookingOverviewScreen from './src/screens/BookingOverviewScreen';
import BookingScheduleScreen from './src/screens/BookingScheduleScreen';
import BookingLocationScreen from './src/screens/BookingLocationScreen';
import BookingInstructionsScreen from './src/screens/BookingInstructionsScreen';
import BookingReviewScreen from './src/screens/BookingReviewScreen';
import SavedAddressesScreen from './src/screens/SavedAddressesScreen';
import AddAddressScreen from './src/screens/AddAddressScreen';
import PaymentMethodsScreen from './src/screens/PaymentMethodsScreen';
import AddPaymentMethodScreen from './src/screens/AddPaymentMethodScreen';
import PushNotificationsScreen from './src/screens/PushNotificationsScreen';
import SupportHelpScreen from './src/screens/SupportHelpScreen';
import TopupScreen from './src/screens/TopupScreen';
import WalletHistoryScreen from './src/screens/WalletHistoryScreen';
import ChatScreen from './src/screens/ChatScreen';
import PersonalInformationScreen from './src/screens/PersonalInformationScreen';
import VendorSelectionScreen from './src/screens/VendorSelectionScreen';
import BookingDetailsScreen from './src/screens/BookingDetailsScreen';
import TabNavigator from './src/navigation/TabNavigator';
import VendorTabNavigator from './src/navigation/VendorTabNavigator';
import VendorCreateOfferScreen from './src/screens/vendor/VendorCreateOfferScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import VerifyOTPScreen from './src/screens/VerifyOTPScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import SubCategoryScreen from './src/screens/SubCategoryScreen';
import ServiceListingScreen from './src/screens/ServiceListingScreen';
import OthersServiceRequestScreen from './src/screens/OthersServiceRequestScreen';
import OthersRequestSuccessScreen from './src/screens/OthersRequestSuccessScreen';
import MyOthersRequestsScreen from './src/screens/MyOthersRequestsScreen';
import TermsConditionsScreen from './src/screens/TermsConditionsScreen';
import RatingFeedbackScreen from './src/screens/RatingFeedbackScreen';

const Stack = createStackNavigator();

// ── Shared navigation ref — lets BackHandler reach the active navigator ────────
export const navigationRef = React.createRef<NavigationContainerRef<any>>();

// ── Stack navigator (all screens) ─────────────────────────────────────────────
export const RootNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    const authenticated = await authService.isAuthenticated();
    if (authenticated) {
      const role = await authService.getUserRole();
      setUserRole(role);
    }
    setIsAuthenticated(authenticated);
  };

  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  const initialRoute = !isAuthenticated ? 'Login' : (userRole === 'VENDOR' ? 'VendorTabs' : 'MainTabs');

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#FFFFFF' } }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="VendorTabs" component={VendorTabNavigator} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="InstaHelp" component={InstaHelpScreen} />
      <Stack.Screen name="WomensSalon" component={WomensSalonScreen} />
      <Stack.Screen name="MensSalon" component={MensSalonScreen} />
      <Stack.Screen name="Cleaning" component={CleaningScreen} />
      <Stack.Screen name="Electrician" component={ElectricianScreen} />
      <Stack.Screen name="NativeWaterPurifier" component={NativeWaterPurifierScreen} />
      <Stack.Screen name="NativeSmartHome" component={NativeSmartHomeScreen} />
      <Stack.Screen name="Painting" component={PaintingScreen} />
      <Stack.Screen name="ACRepair" component={ACRepairScreen} />
      <Stack.Screen name="Revamp" component={RevampScreen} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
      <Stack.Screen name="BookingOverview" component={BookingOverviewScreen} />
      <Stack.Screen name="BookingSchedule" component={BookingScheduleScreen} />
      <Stack.Screen name="BookingLocation" component={BookingLocationScreen} />
      <Stack.Screen name="BookingInstructions" component={BookingInstructionsScreen} />
      <Stack.Screen name="BookingReview" component={BookingReviewScreen} />
      <Stack.Screen name="PersonalInformation" component={PersonalInformationScreen} />
      <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
      <Stack.Screen name="AddAddress" component={AddAddressScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="AddPaymentMethod" component={AddPaymentMethodScreen} />
      <Stack.Screen name="PushNotifications" component={PushNotificationsScreen} />
      <Stack.Screen name="SupportHelp" component={SupportHelpScreen} />
      <Stack.Screen name="Topup" component={TopupScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="ServiceListing" component={ServiceListingScreen} />
      <Stack.Screen name="VendorSelection" component={VendorSelectionScreen} />
      <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
      <Stack.Screen name="SubCategory" component={SubCategoryScreen} />
      <Stack.Screen name="WalletHistory" component={WalletHistoryScreen} />
      <Stack.Screen name="VendorCreateOffer" component={VendorCreateOfferScreen} />
      <Stack.Screen name="VendorServices" component={require('./src/screens/vendor/VendorServicesScreen').default} />
      <Stack.Screen name="VendorPersonalInformation" component={require('./src/screens/vendor/VendorPersonalInformationScreen').default} />
      <Stack.Screen name="VendorNotificationSettings" component={require('./src/screens/vendor/VendorNotificationSettingsScreen').default} />
      <Stack.Screen name="VendorSupportHelp" component={require('./src/screens/vendor/VendorSupportHelpScreen').default} />
      <Stack.Screen name="VendorQuestionnaire" component={require('./src/screens/vendor/VendorQuestionnaireScreen').default} />
      <Stack.Screen name="OthersServiceRequest" component={OthersServiceRequestScreen} />
      <Stack.Screen name="OthersRequestSuccess" component={OthersRequestSuccessScreen} options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="MyOthersRequests" component={MyOthersRequestsScreen} />
      <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
      <Stack.Screen name="RatingFeedback" component={RatingFeedbackScreen} />
    </Stack.Navigator>
  );
};

// ── Root App ──────────────────────────────────────────────────────────────────
const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  // Android hardware back button handler
  useEffect(() => {
    const onBackPress = () => {
      const nav = navigationRef.current;
      if (!nav) return false;

      // If we can go back within the navigation stack, do so
      if (nav.canGoBack()) {
        nav.goBack();
        return true; // prevent default (app close)
      }

      // At root (MainTabs / VendorTabs) — confirm exit
      Alert.alert(
        'Exit App',
        'Are you sure you want to exit?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => {} },
          { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
        ],
        { cancelable: true }
      );
      return true; // prevent default while alert is shown
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;