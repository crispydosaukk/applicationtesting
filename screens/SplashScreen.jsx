import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export default function SplashScreen({ navigation }) {

  const slideAnim = useRef(new Animated.Value(-320)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;

  // New bottom image animation values
  const bottomOpacity = useRef(new Animated.Value(0)).current;
  const bottomTranslate = useRef(new Animated.Value(50)).current; // comes up from below
  const bottomScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 2600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start(() => {
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1.09,
          duration: 450,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true
        })
      ]).start();
    });

    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 2200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start();

    // Bottom-right image smooth entrance
    Animated.parallel([
      Animated.timing(bottomOpacity, {
        toValue: 1,
        duration: 1700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(bottomTranslate, {
        toValue: 0,
        duration: 1700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(bottomScale, {
        toValue: 1,
        duration: 1700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ]).start();

    const timeout = setTimeout(() => {
      navigation.replace("Home");
    }, 7000);

    return () => clearTimeout(timeout);
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg']
  });

  return (
    <LinearGradient
      colors={[
        '#e6f6f1',
        '#fdf4f4',
        '#f0e6f9',
        '#e8f3fd',
        '#e6faec'
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>

        <Animated.Image
          source={require('../assets/topDosa.png')}
          style={[
            styles.topImage,
            {
              transform: [
                { translateX: slideAnim },
                { rotate },
                { scale: bounceAnim }
              ]
            }
          ]}
          resizeMode="contain"
        />

        <Animated.Image
          source={require('../assets/logo.png')}
          style={[
            styles.logo,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] }
          ]}
          resizeMode="contain"
        />

        {/* Bottom-right floating image */}
        <Animated.Image
          source={require('../assets/plate.png')} // Put your image here
          style={[
            styles.bottomImage,
            {
              opacity: bottomOpacity,
              transform: [
                { translateY: bottomTranslate },
                { scale: bottomScale }
              ]
            }
          ]}
          resizeMode="cover"
        />

      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topImage: {
    width: 180,
    height: 180,
    marginBottom: -30,
  },
  logo: {
    width: 300,
    height: 100,
    marginBottom: 120,
  },
  bottomImage: {
    position: 'absolute',
    bottom: -90,
    right: -60,
    width: 300,
    height: 300,
    borderRadius: 20,
    overflow: 'hidden'
  }
});
