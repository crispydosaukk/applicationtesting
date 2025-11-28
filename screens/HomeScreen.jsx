import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const swingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(swingAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(swingAnim, { toValue: -1, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const swing = swingAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-6deg", "6deg"],
  });

  const messages = [
    "Earn £0.25 on every order",
    "Loyalty points earn £0.25",
    "Earn £0.25 welcome gift",
  ];

  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const [msgIndex, setMsgIndex] = useState(0);

  const startOfferAnimation = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, bounciness: 6, useNativeDriver: true }),
      ]),
      Animated.delay(1800),
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -20, duration: 400, useNativeDriver: true }),
      ]),
    ]).start(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
      slideAnim.setValue(20);
      scaleAnim.setValue(0.95);
    });
  };

  useEffect(() => {
    startOfferAnimation();
  }, [msgIndex]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={["#ffdfdf", "#ffeceb", "#e9ffee", "#d7f8d7"]}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: "center",
            paddingTop: 5,    // FIXED GAP ISSUE
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.rope} />

          <Animated.Image
            source={require("../assets/logo.png")}
            style={[styles.brandLogoImage, { transform: [{ rotate: swing }] }]}
          />

          <View style={styles.mainTitleWrap}>
            <Text style={styles.mainTitleBlack}>UK’s FINEST PURE</Text>
            <Text style={styles.mainTitleOrange}>Vegetarian Food Chain</Text>
          </View>

          <View style={styles.imageWrapper}>
            <Image
              source={require("../assets/yourFoodImage.png")}
              style={styles.foodImage}
              resizeMode="cover"
            />
          </View>

          <Text style={styles.subtitle}>Fresh • Authentic • Pure Veg</Text>

          <Animated.View
            style={[
              styles.offerPill,
              {
                opacity: opacityAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            <Ionicons name="gift-outline" size={18} color="#fff" />
            <Text style={styles.offerText}>{messages[msgIndex]}</Text>
          </Animated.View>

          <View style={styles.buttonArea}>
            <TouchableOpacity
              onPress={() => navigation.navigate("Resturent")}
              style={styles.primaryBtn}
            >
              <LinearGradient
                colors={["#ffdfdf", "#ffeceb", "#e9ffee", "#d7f8d7"]}
                style={styles.btnGradient}
              >
                <Ionicons name="restaurant-outline" size={20} color="#2D1B0F" style={styles.btnIcon} />
                <Text style={styles.primaryBtnText}>Explore</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate("Login")}
            >
              <Ionicons name="log-in-outline" size={20} color="#2D1B0F" style={styles.btnIcon} />
              <Text style={styles.secondaryBtnText}>Sign In</Text>
            </TouchableOpacity>

            <Text style={styles.bottomLine}>
              New here?{" "}
              <Text style={styles.linkText} onPress={() => navigation.navigate("Signup")}>
                Create an account
              </Text>
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, // removed paddingTop

  brandLogoImage: {
    width: width * 0.60,
    height: width * 0.40,
    resizeMode: "contain",
  },

  mainTitleWrap: { marginTop: -16, alignItems: "center" }, // tightened
  mainTitleBlack: { fontSize: 26, fontWeight: "800", color: "#2D1B0F" },
  mainTitleOrange: { fontSize: 30, fontWeight: "900", color: "#FF8A00", marginTop: -3 },

  imageWrapper: {
    width: width * 0.62,
    height: width * 0.62,
    borderRadius: (width * 0.62) / 2,
    backgroundColor: "#FFE9C9",
    marginTop: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  foodImage: { width: "100%", height: "100%", borderRadius: width * 0.31 },

  subtitle: { marginTop: 10, fontSize: 16, color: "#2D1B0F", fontWeight: "500" },

  offerPill: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2faa3fff",
  },

  offerText: { color: "#fff", fontSize: 14, fontWeight: "700", marginLeft: 8 },

  buttonArea: { width: "100%", alignItems: "center", marginTop: 15 },

  primaryBtn: {
    width: width * 0.75,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#2D1B0F",
    marginBottom: 14,
  },

  btnGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },

  primaryBtnText: { fontSize: 17, fontWeight: "600", color: "#000" },

  secondaryBtn: {
    flexDirection: "row",
    width: width * 0.75,
    borderWidth: 2,
    borderColor: "#2D1B0F",
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  secondaryBtnText: { fontSize: 17, fontWeight: "600", color: "#2D1B0F" },

  btnIcon: { marginRight: 8 },

  bottomLine: { fontSize: 15, color: "#2D1B0F", marginTop: 6 },

  linkText: { fontWeight: "700", textDecorationLine: "underline" },

  rope: { width: 2, height: 40, backgroundColor: "#45b255ff" },
});
