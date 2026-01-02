import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { loginUser } from "../services/authService";
import messaging from "@react-native-firebase/messaging";
import { saveFcmToken } from "../services/notificationService";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter Email / Mobile Number and Password");
      return;
    }

    // 🔥 Detect if input is valid email or mobile number
    const trimmed = email.trim();
    const isMobile = /^[0-9]{8,15}$/.test(trimmed);
    const isEmailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);

    if (!isMobile && !isEmailFormat) {
      Alert.alert("Invalid Input", "Please enter a valid Email or Mobile Number");
      return;
    }

    setLoading(true);
    try {
      const { user, token } = await loginUser(trimmed, password);

      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(user));

      /* =======================
        🔔 STEP 6.3 – FCM TOKEN
      ======================= */
      const fcmToken = await messaging().getToken();
      // console.log("🔥 CUSTOMER FCM TOKEN:", fcmToken);

      if (fcmToken && user?.id) {
        await saveFcmToken({
          userType: "customer",
          userId: user.id,
          token: fcmToken
        });
      }
      /* ======================= */

      Alert.alert("Login Successful", `Welcome back ${user.full_name}`);
      navigation.replace("Resturent");

    } catch (e) {
      Alert.alert("Login Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>

          {/* TOP GREEN WAVE */}
          <LinearGradient
            colors={["#1d8f52", "#27b36a", "#41d48a"]}
            style={styles.topWave}
          />

          {/* LOGO */}
          <View style={styles.logoWrap}>
            <Image
              source={require("../assets/logo.png")}
              style={styles.logo}
            />
          </View>

          {/* MAIN CARD AREA */}
          <View style={styles.card}>
            <Text style={styles.title}>Hello 👋</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

            {/* Email / Mobile */}
            <View style={styles.box}>
              <Text style={styles.label}>Email or Mobile Number</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={20} color="#1f4d35" />
                <TextInput
                  placeholder="Enter email or mobile number"
                  placeholderTextColor="#88a796"
                  autoCapitalize="none"
                  keyboardType="default"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                />
              </View>

              <Text style={styles.helperText}>
                You can login using your Email or Mobile Number.
              </Text>
            </View>

            {/* Password */}
            <View style={styles.box}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#1f4d35"
                />
                <TextInput
                  placeholder="Enter password"
                  placeholderTextColor="#88a796"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                />
              </View>

              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* LOGIN BUTTON */}
            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
              <LinearGradient
                colors={["#1a8b50", "#21a863", "#34c87c"]}
                style={styles.loginGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.loginText}>Login</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Signup Link */}
            <Text style={styles.bottomText}>
              Don’t have an account?{" "}
              <Text
                style={styles.signup}
                onPress={() => navigation.navigate("Signup")}
              >
                Register Now
              </Text>
            </Text>
          </View>

          {/* BOTTOM GREEN WAVE */}
          <LinearGradient
            colors={["#1d8f52", "#27b36a", "#41d48a"]}
            style={styles.bottomWave}
          />

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ====================== STYLES ====================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },

  topWave: {
    height: "32%",
    width: "140%",
    borderBottomLeftRadius: 220,
    borderBottomRightRadius: 220,
    position: "absolute",
    top: -100,
    alignSelf: "center",
  },

  bottomWave: {
    height: "28%",
    width: "140%",
    borderTopLeftRadius: 220,
    borderTopRightRadius: 220,
    position: "absolute",
    bottom: -100,
    alignSelf: "center",
  },

  logoWrap: {
    marginTop: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    width: 180,
    height: 90,
    resizeMode: "contain",
  },

  card: {
    flex: 1,
    paddingHorizontal: 28,
    marginTop: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1f4d35",
  },

  subtitle: {
    fontSize: 15,
    color: "#4a7f65",
    marginBottom: 30,
  },

  box: { marginBottom: 20 },

  label: {
    color: "#1f4d35",
    marginBottom: 6,
    fontWeight: "600",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5ee",
    borderRadius: 12,
    paddingHorizontal: 12,
  },

  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#000",
    marginLeft: 8,
  },

  helperText: {
    color: "#4a7f65",
    fontSize: 13,
    marginTop: 5,
  },

  forgotBtn: { alignSelf: "flex-end", marginTop: 4 },
  forgotText: { color: "#1a8b50", fontWeight: "600" },

  loginBtn: { marginTop: 10 },

  loginGradient: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  loginText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },

  bottomText: {
    textAlign: "center",
    marginTop: 25,
    color: "#2c6e49",
    fontSize: 15,
  },

  signup: {
    color: "#1a8b50",
    fontWeight: "800",
    textDecorationLine: "underline",
  },
});
