// SplashScreen.js
import React, { useEffect, useRef } from "react";
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
  Dimensions,
  Text,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

// All sizes relative to width so it’s responsive
const HALO_SIZE = width * 0.5;                // circle behind dosa
const HERO_HEIGHT = HALO_SIZE * 1.3;          // area for circle + dosa + logo

const DOSA_W = width * 0.55;
const DOSA_H = DOSA_W * 0.55;
const LOGO_W = width * 0.78;
const LOGO_H = LOGO_W * 0.3;

export default function SplashScreen({ navigation }) {
  const mainTranslateY = useRef(new Animated.Value(40)).current;
  const mainScale = useRef(new Animated.Value(0.9)).current;

  const haloScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(15)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. hero block + halo animate in
    Animated.parallel([
      Animated.timing(mainTranslateY, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(mainScale, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(haloScale, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // 2. logo fade + slide
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        delay: 450,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        delay: 450,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // 3. dosa gentle float
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 4. progress bar
    Animated.timing(progress, {
      toValue: 1,
      duration: 2600,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();

    // 5. navigation after splash
    const timeout = setTimeout(async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) navigation.replace("Resturent");
        else navigation.replace("Home");
      } catch (e) {
        navigation.replace("Login");
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <>
      <StatusBar backgroundColor="#ffdfdf" barStyle="dark-content" />

      <LinearGradient
        colors={["#ffdfdf", "#ffeceb", "#e9ffee", "#d7f8d7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* top/left/right safe; bottom full-bleed */}
        <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
          <View style={styles.content}>
            {/* CENTER HERO BLOCK */}
            <Animated.View
              style={[
                styles.centerBlock,
                {
                  transform: [
                    { translateY: mainTranslateY },
                    { scale: mainScale },
                  ],
                },
              ]}
            >
              <View style={styles.heroWrapper}>
                {/* circle exactly behind dosa */}
                <Animated.View
                  style={[
                    styles.halo,
                    { transform: [{ scale: haloScale }] },
                  ]}
                />

                {/* dosa */}
                <Animated.View
                  style={[
                    styles.dosaWrapper,
                    { transform: [{ translateY: floatTranslate }] },
                  ]}
                >
                  <Image
                    source={require("../assets/topDosa.png")}
                    resizeMode="contain"
                    style={styles.dosa}
                  />
                </Animated.View>

                {/* logo below circle */}
                <Animated.Image
                  source={require("../assets/logo.png")}
                  resizeMode="contain"
                  style={[
                    styles.logo,
                    {
                      opacity: logoOpacity,
                      transform: [{ translateY: logoTranslateY }],
                    },
                  ]}
                />
              </View>
            </Animated.View>

            {/* FOOTER */}
            <View style={styles.footer}>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[styles.progressFill, { width: progressWidth }]}
                />
              </View>
              <Text style={styles.footerText}>Preparing your experience…</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },

  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: height * 0.06,
  },

  centerBlock: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center", // hero stays centered on all screens
  },

  heroWrapper: {
    width: "100%",
    height: HERO_HEIGHT,
    alignItems: "center",
    justifyContent: "flex-end",
  },

  // soft white circle behind dosa only
  halo: {
    position: "absolute",
    width: HALO_SIZE,
    height: HALO_SIZE,
    borderRadius: HALO_SIZE / 2,
    backgroundColor: "rgba(255,255,255,0.8)",
    shadowColor: "rgba(0,0,0,0.15)",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    // placed so the dosa sits nicely inside the lower half of the circle
    top: HERO_HEIGHT * 0.05,
    alignSelf: "center",
  },

  dosaWrapper: {
    marginBottom: 10, // distance from circle to logo
  },

  dosa: {
    width: DOSA_W,
    height: DOSA_H,
  },

  logo: {
    width: LOGO_W,
    height: LOGO_H,
  },

  footer: {
    width: "100%",
    alignItems: "center",
  },

  progressTrack: {
    width: "60%",
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.55)",
    overflow: "hidden",
    marginBottom: 10,
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#2faa3f",
  },

  footerText: {
    fontSize: 12,
    color: "#48605a",
  },
});
