import React, { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from './screens/SplashScreen.jsx';
import HomeScreen from './screens/HomeScreen.jsx';
import Resturent from './screens/Resturent.jsx';
import LoginScreen from './screens/LoginScreen.jsx';
import SignupScreen from './screens/SignupScreen.jsx';
import NetworkErrorScreen from "./screens/NetworkErrorScreen";
import Categories from './screens/Categories/index.jsx';
import Products from './screens/Products/index.jsx';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  if (isOffline) {
    return <NetworkErrorScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Resturent" component={Resturent} />
        <Stack.Screen name="Categories" component={Categories} />

        {/* ⭐ ADD PRODUCTS SCREEN BELOW CATEGORIES */}
        <Stack.Screen name="Products" component={Products} />

        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
