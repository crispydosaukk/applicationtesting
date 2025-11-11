// screens/SignupScreen.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import CountryPicker from "react-native-country-picker-modal";

export default function SignupScreen({ navigation }) {
  const [countryCode, setCountryCode] = useState("GB");
  const [callingCode, setCallingCode] = useState("44");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  return (
    <LinearGradient
      colors={["#ffdfdf", "#ffeceb", "#e9ffee", "#d7f8d7"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={{ alignItems: "center" }}>
        <Image source={require("../assets/logo.png")} style={styles.logo} />

        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join us to explore delicious & healthy food
          </Text>

          {/* Full Name */}
          <View style={styles.inputBox}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={20} color="#8A6C54" />
              <TextInput
                placeholder="Enter full name"
                style={styles.input}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.inputBox}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.phoneRow}>
              <CountryPicker
                countryCode={countryCode}
                withFlag
                withFilter
                withCallingCode
                withEmoji
                onSelect={(c) => {
                  setCountryCode(c.cca2);
                  setCallingCode(c.callingCode[0]);
                }}
              />
              <Text style={styles.codeText}>+{callingCode}</Text>

              <TextInput
                placeholder="Enter mobile number"
                keyboardType="number-pad"
                style={[styles.input, { flex: 1 }]}
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputBox}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={20} color="#8A6C54" />
              <TextInput
                placeholder="Create password"
                secureTextEntry
                style={styles.input}
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          {/* Signup Button */}
          <TouchableOpacity style={styles.primaryBtn}>
            <LinearGradient
              colors={["#ffdfdf", "#ffeceb", "#e9ffee", "#d7f8d7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btnGradient}
            >
              <Ionicons
                name="checkmark-done-outline"
                size={22}
                color="#2D1B0F"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.primaryText}>Signup</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Already have an account?{" "}
            <Text
              style={styles.link}
              onPress={() => navigation.navigate("Login")}
            >
              Sign in
            </Text>
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  logo: { width: 230, height: 110, resizeMode: "contain", marginBottom: -10 },

  card: {
    width: "85%",
    backgroundColor: "#FFFFFFDD",
    borderRadius: 22,
    paddingVertical: 30,
    paddingHorizontal: 26,
    borderWidth: 3,
    borderColor: "#FFB678",
    elevation: 10,
  },

  title: { fontSize: 26, fontWeight: "800", color: "#2D1B0F", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#8A6C54", textAlign: "center", marginBottom: 25 },

  inputBox: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: "600", color: "#2D1B0F", marginBottom: 6 },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5EA",
    borderWidth: 2,
    borderColor: "#C6A17A",
    borderRadius: 12,
    paddingHorizontal: 12,
  },

  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#C6A17A",
    borderRadius: 12,
    backgroundColor: "#FFF5EA",
    paddingHorizontal: 8,
  },

  codeText: { fontSize: 16, fontWeight: "700", color: "#2D1B0F", marginHorizontal: 6 },
  input: { paddingVertical: 12, fontSize: 16, color: "#2D1B0F", flex: 1 },

  primaryBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 10,
    borderWidth: 2,
    borderColor: "#2D1B0F",
  },

  btnGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },

  primaryText: { fontSize: 18, fontWeight: "700", color: "#000000" },

  footerText: { marginTop: 16, textAlign: "center", fontSize: 15, color: "#2D1B0F" },
  link: { fontWeight: "700", textDecorationLine: "underline" },
});
