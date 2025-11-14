import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";

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

      <View style={styles.buttonArea}>
        {/* Explore Menu Button */}
        <TouchableOpacity onPress={() => navigation.navigate("Resturent")} style={styles.primaryBtn}>
          <LinearGradient
            colors={["#ffdfdf", "#ffeceb", "#e9ffee", "#d7f8d7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btnGradient}
          >
            <Ionicons name="restaurant-outline" size={20} color="#2D1B0F" style={styles.btnIcon} />
            <Text style={styles.primaryBtnText}>Explore</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Sign In */}
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate("Login")}>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", paddingTop: 60 },

  mainTitleWrap: { marginTop: 8, alignItems: "center" },
  mainTitleBlack: { fontSize: 27, fontWeight: "800", color: "#2D1B0F" },
  mainTitleOrange: { fontSize: 32, fontWeight: "900", color: "#FF8A00", marginTop: -4 },

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

  subtitle: { marginTop: 28, fontSize: 17, color: "#2D1B0F", fontWeight: "500" },

  buttonArea: { width: "100%", alignItems: "center", marginTop: 45 },

  primaryBtn: {
    width: "75%",
    borderRadius: 14,
    overflow: "hidden",
    borderColor: "#2D1B0F",
    borderWidth: 2,
    marginBottom: 18,
  },
  btnGradient: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 14, borderRadius: 14 },
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

  brandLogo: {
    fontSize: 44,
    fontWeight: "900",
    color: "#FF7A00",
    letterSpacing: 3,
    backgroundColor: "#FFF2D9",
    paddingHorizontal: 18,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: "#FF9A3E",
    textShadowColor: "rgba(0,0,0,0.30)",
    textShadowOffset: { width: 3, height: 4 },
    textShadowRadius: 8,
  },
  
  rope: { width: 2, height: 40, backgroundColor: "#C49A6C", marginTop: -20 },
});
