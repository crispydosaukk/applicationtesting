// HomeScreen.js
import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Alert } from "react-native";

const { width, height } = Dimensions.get("window");
const isVerySmallScreen = height <= 640;
const isSmallScreen = height > 640 && height <= 720;
const FONT_FAMILY = Platform.select({ ios: "System", android: "System" });

export default function HomeScreen({ navigation }) {
  const swingAnim = useRef(new Animated.Value(0)).current;
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const checkAuth = async () => {
        const token = await AsyncStorage.getItem("token");
        setIsLoggedIn(!!token);
      };
      checkAuth();
    }, [])
  );

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove([
            "token",
            "user",
            "profile_cache",
            "wallet_summary_cache",
          ]);
          setIsLoggedIn(false);
          Alert.alert("Success", "You have been signed out.");
        },
      },
    ]);
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(swingAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(swingAnim, {
          toValue: -1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const swing = swingAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-6deg", "6deg"],
  });

  const messages = [
    "Earn £0.25 on every order",
    "Loyalty credits earn £0.25",
    "Earn £0.25 welcome gift",
  ];

  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const [msgIndex, setMsgIndex] = useState(0);

  const startOfferAnimation = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          bounciness: 6,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1800),
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setMsgIndex((p) => (p + 1) % messages.length);
      slideAnim.setValue(20);
      scaleAnim.setValue(0.95);
    });
  };

  useEffect(() => {
    startOfferAnimation();
  }, [msgIndex]);

  const logoWidth = isVerySmallScreen
    ? width * 0.5
    : isSmallScreen
      ? width * 0.55
      : width * 0.6;
  const logoHeight = logoWidth * 0.66;
  const imageCircleSize = isVerySmallScreen
    ? width * 0.5
    : isSmallScreen
      ? width * 0.56
      : width * 0.62;
  const verticalPadding = isVerySmallScreen ? 4 : isSmallScreen ? 8 : 12;

  const highlightOffer = (text) => {
    const parts = text.split("£0.25");
    return (
      <Text style={styles.offerText}>
        {parts[0].toUpperCase()}
        <Text style={styles.offerAmount}>£0.25</Text>
        {parts[1]?.toUpperCase()}
      </Text>
    );
  };

  return (
    <>
      <StatusBar backgroundColor="#F7CB45" barStyle="dark-content" />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#F7CB45" }}
        edges={["top"]}
      >
        <LinearGradient
          colors={["#F7CB45", "#F7CB45"]}
          style={styles.container}
        >
          <View style={[styles.mainContent, { paddingVertical: verticalPadding }]}>
            <View style={styles.topSection}>
              <View style={styles.rope} />
              <Animated.Image
                source={require("../assets/logo.png")}
                style={[
                  styles.brandLogoImage,
                  {
                    width: logoWidth,
                    height: logoHeight,
                    transform: [{ rotate: swing }],
                  },
                ]}
              />
              {/* <View style={{ width: "100%", alignItems: "center", marginVertical: 6, }}>
                <Animated.View
                  style={[
                    styles.offerPill,
                    {
                      opacity: opacityAnim,
                      transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                    },
                  ]}
                >
                    <Ionicons name="gift-outline" size={18} color="#fff" />
                    <Text style={styles.offerText}>
                      {highlightOffer(messages[msgIndex])}
                    </Text>
                </Animated.View>
              </View> */}

              <View style={styles.mainTitleWrap}>
                <Text style={styles.mainTitleBlack}>UK’S FINEST PURE</Text>
                <Text style={styles.mainTitleOrange}>
                  VEGETARIAN FOOD CHAIN
                </Text>
              </View>

              <View
                style={[
                  styles.imageWrapper,
                  {
                    width: imageCircleSize,
                    height: imageCircleSize,
                    borderRadius: imageCircleSize / 2,
                  },
                ]}
              >
                <Image
                  source={require("../assets/yourFoodImage.png")}
                  style={styles.foodImage}
                  resizeMode="cover"
                />
              </View>

              <Text style={styles.subtitle}>Fresh • Authentic • Pure Veg</Text>
            </View>

            <View style={{ width: "100%", alignItems: "center", marginTop: 8 }}>
              <Animated.View
                style={[
                  styles.offerPill,
                  {
                    opacity: opacityAnim,
                    transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                  },
                ]}
              >
                <Ionicons name="gift-outline" size={18} color="#fff" />
                <Text style={styles.offerText}>
                  {highlightOffer(messages[msgIndex])}
                </Text>
              </Animated.View>
            </View>

            {/* 🔻 Buttons brought closer under subtitle */}
            <View style={styles.bottomSection}>
              <View style={styles.buttonArea}>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Resturent")}
                  style={styles.primaryBtn}
                  activeOpacity={0.9}
                >
                  <Ionicons
                    name="restaurant-outline"
                    size={20}
                    color="#1c1c1c"
                    style={styles.btnIcon}
                  />
                  <Text style={styles.primaryBtnText}>Explore</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => {
                    if (isLoggedIn) handleLogout();
                    else navigation.navigate("Login");
                  }}
                  activeOpacity={0.9}
                >
                  <Ionicons
                    name={isLoggedIn ? "log-out-outline" : "log-in-outline"}
                    size={20}
                    color="#1c1c1c"
                    style={styles.btnIcon}
                  />
                  <Text style={styles.secondaryBtnText}>
                    {isLoggedIn ? "Sign Out" : "Sign In"}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.bottomLine}>
                  New here?{" "}
                  <Text
                    style={styles.linkText}
                    onPress={() => navigation.navigate("Signup")}
                  >
                    Create an account
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  offerAmount: {
    fontFamily: "PoppinsSemiBold",
    fontWeight: "900",
    color: "#fff700",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // ⬇️ mainContent no more space-between (this was causing big gap)
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "flex-start",
  },

  topSection: {
    alignItems: "center",
    marginTop: -40, // Shifted further up
  },

  // small margin so buttons sit just under subtitle
  bottomSection: {
    width: "100%",
    paddingTop: 6,
    paddingBottom: 10,
    marginTop: 12,
  },

  brandLogoImage: {
    resizeMode: "contain",
  },
  mainTitleWrap: {
    marginTop: 4,
    alignItems: "center",
  },
  mainTitleBlack: {
    fontSize: 22,
    fontFamily: "PoppinsSemiBold",
    color: "#1c1c1c",
  },
  mainTitleOrange: {
    fontSize: 24,
    fontFamily: "PoppinsSemiBold",
    color: "#C62828",
    marginTop: -4,
  },
  imageWrapper: {
    marginTop: 4,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  foodImage: {
    width: "100%",
    height: "100%",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#1c1c1c",
    fontFamily: "PoppinsSemiBold",
  },
  offerPill: {

    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
  },
  offerText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "PoppinsSemiBold",
    marginLeft: 8,
  },
  buttonArea: {
    width: "100%",
    alignItems: "center",
  },
  primaryBtn: {
    flexDirection: "row",
    width: width * 0.75,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#1c1c1c",
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: "PoppinsSemiBold",
    color: "#1c1c1c",
  },
  secondaryBtn: {
    flexDirection: "row",
    width: width * 0.75,
    borderWidth: 2,
    borderColor: "#2D1B0F",
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontFamily: "PoppinsSemiBold",
    color: "#1c1c1c",
  },
  btnIcon: {
    marginRight: 8,
  },
  bottomLine: {
    fontSize: 14,
    color: "#1c1c1c",
    marginTop: 2,
    fontFamily: "PoppinsSemiBold",
  },
  linkText: {
    fontFamily: "PoppinsSemiBold",
    textDecorationLine: "underline",
    color: "#C62828",
  },
  rope: {
    width: 2,
    height: 28,
    backgroundColor: "#45b255ff",
    marginBottom: 6,
  },
});
