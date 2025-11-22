import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const swingAnim = useRef(new Animated.Value(0)).current;

  // Swing logo
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
    "Loyalty points earn £0.25 on referring a friend",
    "Earn £0.25 welcome gift on first sign up",
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
      setMsgIndex((prev) => (prev + 1) % messages.length);
      slideAnim.setValue(20);
      scaleAnim.setValue(0.95);
    });
  };

  useEffect(() => {
    startOfferAnimation();
  }, [msgIndex]);

  return (
    <LinearGradient
      colors={["#ffdfdf", "#ffeceb", "#e9ffee", "#d7f8d7"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.rope} />

      <Animated.Image
        source={require("../assets/logo.png")}
        style={[
          styles.brandLogoImage,
          { transform: [{ rotate: swing }] },
        ]}
      />

      <View style={styles.mainTitleWrap}>
        <Text style={styles.mainTitleBlack}>Your Healthy Favorite</Text>
        <Text style={styles.mainTitleOrange}>FOOD HERE</Text>
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
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btnGradient}
          >
            <Ionicons
              name="restaurant-outline"
              size={20}
              color="#2D1B0F"
              style={styles.btnIcon}
            />
            <Text style={styles.primaryBtnText}>Explore</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate("Login")}
        >
          <Ionicons
            name="log-in-outline"
            size={20}
            color="#2D1B0F"
            style={styles.btnIcon}
          />
          <Text style={styles.secondaryBtnText}>Sign In</Text>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", paddingTop: 40 },

  brandLogoImage: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginTop: -60,
  },

  mainTitleWrap: { marginTop: -70, alignItems: "center" },
  mainTitleBlack: { fontSize: 27, fontWeight: "800", color: "#2D1B0F" },
  mainTitleOrange: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FF8A00",
    marginTop: -4,
  },

  imageWrapper: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "#FFE9C9",
    marginTop: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  foodImage: { width: "99%", height: "99%", borderRadius: 125 },

  subtitle: {
    marginTop: 28,
    fontSize: 17,
    color: "#2D1B0F",
    fontWeight: "500",
  },

  offerPill: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2faa3fff",
    elevation: 8,
  },

  offerText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 8,
  },

  buttonArea: { width: "100%", alignItems: "center", marginTop: 30 },

  primaryBtn: {
    width: "75%",
    borderRadius: 14,
    overflow: "hidden",
    borderColor: "#2D1B0F",
    borderWidth: 2,
    marginBottom: 18,
  },
  btnGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryBtnText: { fontSize: 18, fontWeight: "600", color: "#000" },

  secondaryBtn: {
    flexDirection: "row",
    width: "75%",
    borderWidth: 2,
    borderColor: "#2D1B0F",
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  secondaryBtnText: { fontSize: 18, fontWeight: "600", color: "#2D1B0F" },

  btnIcon: { marginRight: 8 },

  bottomLine: { fontSize: 15, color: "#2D1B0F", marginTop: 6 },
  linkText: { fontWeight: "700", textDecorationLine: "underline" },

  rope: {
    width: 2,
    height: 40,
    backgroundColor: "#45b255ff",
    marginTop: -20,
  },
});
