import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function HomeScreen({ navigation }) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>

      <Text style={styles.smallTag}>We Provide Best Food Service</Text>

      <View style={styles.mainTitleWrap}>
        <Text style={styles.mainTitleBlack}>Your Healthy Favorite</Text>
        <Text style={styles.mainTitleOrange}>FOOD HERE</Text>
      </View>

      <Animated.View style={[styles.imageWrapper, { transform: [{ translateY: floatAnim }] }]}>
        <Image
          source={require("../assets/yourFoodImage.png")} // <-- Change image path
          style={styles.foodImage}
          resizeMode="cover"
        />
      </Animated.View>

      <Text style={styles.subtitle}>Fresh • Authentic • Pure Veg</Text>

      <View style={styles.buttonArea}>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate("Home")}>
          <Ionicons name="restaurant-outline" size={20} color="#fff" style={styles.btnIcon} />
          <Text style={styles.primaryBtnText}>Explore Menu</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate("Login")}>
          <Ionicons name="log-in-outline" size={20} color="#2D1B0F" style={styles.btnIcon} />
          <Text style={styles.secondaryBtnText}>Sign In</Text>
        </TouchableOpacity>

        <Text style={styles.bottomLine}>
          New here? <Text style={styles.linkText}>Create an account</Text>
        </Text>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF9EF",
    alignItems: "center",
    paddingTop: 60,
  },

  smallTag: {
    fontSize: 14,
    color: "#8A6C54",
    marginTop: 10,
  },

  mainTitleWrap: {
    marginTop: 8,
    alignItems: "center",
  },

  mainTitleBlack: {
    fontSize: 27,
    fontWeight: "800",
    color: "#2D1B0F",
    textAlign: "center",
  },

  mainTitleOrange: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FF8A00",
    textAlign: "center",
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
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },

  foodImage: {
    width: "90%",
    height: "90%",
    borderRadius: 125,
  },

  subtitle: {
    marginTop: 28,
    fontSize: 17,
    color: "#2D1B0F",
    fontWeight: "500",
  },

  buttonArea: {
    width: "100%",
    alignItems: "center",
    marginTop: 45,
  },

  primaryBtn: {
    flexDirection: "row",
    width: "75%",
    backgroundColor: "#2D1B0F",
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  primaryBtnText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },

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

  secondaryBtnText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2D1B0F",
  },

  btnIcon: {
    marginRight: 8,
  },

  bottomLine: {
    fontSize: 15,
    color: "#2D1B0F",
    marginTop: 6,
  },

  linkText: {
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
