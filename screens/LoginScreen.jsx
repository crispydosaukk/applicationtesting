// screens/LoginScreen.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import CountryPicker from "react-native-country-picker-modal";

export default function LoginScreen({ navigation }) {
  const [countryCode, setCountryCode] = useState("GB");
  const [callingCode, setCallingCode] = useState("44");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  return (
    <LinearGradient
      colors={["#ffdfdf", "#ffeceb", "#e9ffee", "#d7f8d7"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Image source={require("../assets/logo.png")} style={styles.logo} />

      <View style={styles.card}>
        <Text style={styles.loginTitle}>Welcome Back...!</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <View style={styles.inputBox}>
          <Text style={styles.label}>Mobile Number</Text>

          <View style={styles.phoneRow}>
            <CountryPicker
              countryCode={countryCode}
              withFilter
              withFlag
              withCallingCode
              withAlphaFilter
              withEmoji
              onSelect={(country) => {
                setCountryCode(country.cca2);
                setCallingCode(country.callingCode[0]);
              }}
            />

            <Text style={styles.countryCodeText}>+{callingCode}</Text>

            <TextInput
              placeholder="Enter mobile number"
              keyboardType="number-pad"
              style={[styles.input, { flex: 1 }]}
              value={phone}
              onChangeText={setPhone}
            />
          </View>
        </View>

        <View style={styles.inputBox}>
          <Text style={styles.label}>Password</Text>

          <View style={styles.passwordRow}>
            <Ionicons name="lock-closed-outline" size={20} color="#8A6C54" />
            <TextInput
              placeholder="Enter password"
              secureTextEntry
              style={[styles.input, { flex: 1, marginLeft: 8 }]}
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.primaryBtn}>
          <LinearGradient
            colors={["#ffdfdf", "#ffeceb", "#e9ffee", "#d7f8d7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btnGradient}
          >
            <Ionicons name="log-in-outline" size={22} color="#2D1B0F" style={{ marginRight: 8 }} />
            <Text style={styles.primaryText}>Login</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Don't have an account?{" "}
          <Text style={styles.signupText} onPress={() => navigation.navigate("Signup")}>
            Create an account
          </Text>
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },

  logo: {
    width: 250,
    height: 120,
    resizeMode: "contain",
    marginBottom: -20,
  },

  card: {
    width: "85%",
    backgroundColor: "#FFFFFFDD",
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 24,
    borderWidth: 3,
    borderColor: "#FFB678",
    elevation: 10,
    marginBottom: 30,
  },

  loginTitle: { fontSize: 26, fontWeight: "800", color: "#2D1B0F", textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center", color: "#8A6C54", marginBottom: 25 },

  inputBox: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: "600", color: "#2D1B0F", marginBottom: 6 },

  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#C6A17A",
    borderRadius: 12,
    backgroundColor: "#FFF5EA",
    paddingHorizontal: 8,
  },

  countryCodeText: { fontSize: 16, fontWeight: "700", marginHorizontal: 6, color: "#2D1B0F" },

  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#C6A17A",
    borderRadius: 12,
    backgroundColor: "#FFF5EA",
    paddingHorizontal: 12,
  },

  input: { paddingVertical: 12, fontSize: 16, color: "#2D1B0F" },

  primaryBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 10,
    borderColor: "#2D1B0F",
    borderWidth: 2,
  },

  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },

  primaryText: { fontSize: 18, fontWeight: "700", color: "#000000" },

  footerText: { marginTop: 18, textAlign: "center", fontSize: 15, color: "#2D1B0F" },
  signupText: { fontWeight: "700", textDecorationLine: "underline" },
});
