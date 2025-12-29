// App.jsx
import React, { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import messaging from "@react-native-firebase/messaging";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StripeProvider } from "@stripe/stripe-react-native";
import { STRIPE_PUBLISHABLE_KEY } from "@env";

import SplashScreen from "./screens/SplashScreen.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import Resturent from "./screens/Resturent.jsx";
import LoginScreen from "./screens/LoginScreen.jsx";
import SignupScreen from "./screens/SignupScreen.jsx";
import NetworkErrorScreen from "./screens/NetworkErrorScreen.jsx";
import Categories from "./screens/Categories/index.jsx";
import Products from "./screens/Products/index.jsx";
import CartSummary from "./screens/CartSummary.jsx";
import CheckoutScreen from "./screens/CheckoutScreen.jsx";
import Orders from "./screens/Orders.jsx";
import Credits from "./screens/Credits/index.jsx";
import Profile from "./screens/Profile.jsx";
import PaymentHistory from "./screens/PaymentHistory.jsx";
import FAQ from "./screens/FAQ.jsx";
import InviteFriends from "./screens/InviteFriends.jsx";
import EditProfile from "./screens/EditProfile.jsx";
import HelpCenter from "./screens/HelpCenter.jsx";

const Stack = createNativeStackNavigator();

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log("📩 FCM BACKGROUND:", remoteMessage);
});


export default function App() {
  const [isOffline, setIsOffline] = useState(false);

  // ===============================
  // 🌐 NETWORK STATUS
  // ===============================
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // ===============================
  // 🔔 FIREBASE PUSH NOTIFICATIONS
  // STEP 5.3 & 5.4
  // ===============================
  useEffect(() => {
    const initFCM = async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          const token = await messaging().getToken();
          console.log("🔥 FCM TOKEN:", token);
        } else {
          Alert.alert("Notification permission not granted");
        }
      } catch (error) {
        console.log("❌ FCM init error:", error);
      }
    };

    initFCM();
  }, []);


  // ===============================
// 🔄 FCM TOKEN AUTO REFRESH
// STEP 5.5 (ADD HERE)
// ===============================
useEffect(() => {
  const unsubscribe = messaging().onTokenRefresh(async (token) => {
    try {
      console.log("🔁 FCM TOKEN REFRESHED:", token);

      await api.post("/mobile/save-fcm-token", {
        fcm_token: token,
        user_type: "customer",
        device_type: Platform.OS
      });
    } catch (err) {
      console.log("❌ Token refresh save failed", err);
    }
  });

  return unsubscribe;
}, []);


useEffect(() => {
  // 🔔 Foreground notification listener
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    console.log("📩 FCM FOREGROUND:", remoteMessage);

    if (remoteMessage?.data?.order_number) {
      // broadcast event inside app
      global.lastOrderUpdate = {
        order_number: remoteMessage.data.order_number,
        status: Number(remoteMessage.data.status)
      };
    }
  });

  return unsubscribe;
}, []);


  // ===============================
  // ❌ OFFLINE SCREEN
  // ===============================
  if (isOffline) {
    return (
      <SafeAreaProvider>
        <NetworkErrorScreen />
      </SafeAreaProvider>
    );
  }

  // ===============================
  // 🚀 MAIN APP
  // ===============================
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Resturent" component={Resturent} />
            <Stack.Screen name="Categories" component={Categories} />
            <Stack.Screen name="Products" component={Products} />
            <Stack.Screen name="CartSummary" component={CartSummary} />
            <Stack.Screen name="CheckoutScreen" component={CheckoutScreen} />
            <Stack.Screen name="Orders" component={Orders} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="Credits" component={Credits} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="PaymentHistory" component={PaymentHistory} />
            <Stack.Screen name="FAQ" component={FAQ} />
            <Stack.Screen name="InviteFriends" component={InviteFriends} />
            <Stack.Screen name="EditProfile" component={EditProfile} />
            <Stack.Screen name="HelpCenter" component={HelpCenter} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </StripeProvider>
  );
}
