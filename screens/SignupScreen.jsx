import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  SafeAreaView,
  Platform,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import CountryPicker from "react-native-country-picker-modal";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { registerUser } from "../services/authService";

export default function SignupScreen({ navigation }) {
  const [countryCode, setCountryCode] = useState("GB");
  const [callingCode, setCallingCode] = useState("44");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [preferredRestaurant, setPreferredRestaurant] = useState("");
  const [dob, setDob] = useState(new Date());
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [gender, setGender] = useState("");

  const validateForm = () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!name.trim()) return "Full name is required.";
    if (!email.trim()) return "Email is required.";
    if (!emailRegex.test(email)) return "Enter valid Gmail address.";
    if (!phone.trim()) return "Phone number is required.";
    if (!password.trim()) return "Password is required.";
    if (password.length < 6) return "Password must be 6+ chars.";
    if (password !== confirmPassword) return "Passwords do not match.";
    if (!preferredRestaurant) return "Select your preferred restaurant.";
    return null;
  };

  const handleSignup = async () => {
    const err = validateForm();
    if (err) return Alert.alert("Validation Error", err);
    try {
      await registerUser({
        full_name: name,
        email,
        mobile_number: phone,
        country_code: `+${callingCode}`,
        password,
        preferred_restaurant: preferredRestaurant,
        date_of_birth: dob.toISOString().split("T")[0],
        referral_code: referralCode || null,
        gender: gender || null,
      });
      Alert.alert("Success", "Account created!");
      navigation.navigate("Login");
    } catch (e) {
      Alert.alert("Error", e.message || "Signup failed");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fff8" }}>
      <LinearGradient
        colors={["#eaffea", "#ffffff"]}
        style={styles.container}
      >

        {/* LOGO */}
        <Image source={require("../assets/logo.png")} style={styles.logo} />

        
        {/* <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Welcome to the Green Community</Text> */}

        {/* FULL NAME */}
        <View style={styles.inputRow}>
          <Ionicons name="person-outline" size={20} color="#1b5e20" />
          <TextInput
            placeholder="Full Name"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* EMAIL */}
        <View style={styles.inputRow}>
          <Ionicons name="mail-outline" size={20} color="#1b5e20" />
          <TextInput
            placeholder="Email (Gmail only)"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* PHONE */}
        <View style={styles.inputRow}>
          <CountryPicker
            countryCode={countryCode}
            withFlag
            withCallingCode
            onSelect={(c) => {
              setCountryCode(c.cca2);
              setCallingCode(c.callingCode[0]);
            }}
          />
          <Text style={styles.countryCode}>+{callingCode}</Text>
          <TextInput
            placeholder="Phone Number"
            keyboardType="number-pad"
            style={[styles.input, { flex: 1 }]}
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        {/* PASSWORD */}
        <View style={styles.inputRow}>
          <Ionicons name="lock-closed-outline" size={20} color="#1b5e20" />
          <TextInput
            placeholder="Password"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* CONFIRM PASSWORD */}
        <View style={styles.inputRow}>
          <Ionicons name="lock-closed-outline" size={20} color="#1b5e20" />
          <TextInput
            placeholder="Confirm Password"
            secureTextEntry
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        {/* PREFERRED RESTAURANT */}
        <View style={styles.pickerBox}>
          <Picker
            selectedValue={preferredRestaurant}
            onValueChange={setPreferredRestaurant}
            style={{ width: "100%" }}
          >
            <Picker.Item label="Preferred Restaurant" value="" />
            <Picker.Item label="Restaurant A" value="Restaurant A" />
            <Picker.Item label="Restaurant B" value="Restaurant B" />
            <Picker.Item label="Restaurant C" value="Restaurant C" />
          </Picker>
        </View>

        {/* DOB */}
        <TouchableOpacity
          style={styles.dateRow}
          onPress={() => setShowDobPicker(true)}
        >
          <Text style={styles.dateText}>{dob.toDateString()}</Text>
          <Ionicons name="calendar-outline" size={20} color="#1b5e20" />
        </TouchableOpacity>

        {showDobPicker && (
          <DateTimePicker
            value={dob}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={(e, d) => {
              setShowDobPicker(false);
              if (d) setDob(d);
            }}
          />
        )}

        {/* GENDER */}
        <View style={styles.pickerBox}>
          <Picker
            selectedValue={gender}
            onValueChange={setGender}
            style={{ width: "100%" }}
          >
            <Picker.Item label="Gender (Optional)" value="" />
            <Picker.Item label="Male" value="male" />
            <Picker.Item label="Female" value="female" />
            <Picker.Item label="Other" value="other" />
          </Picker>
        </View>

        {/* REFERRAL CODE */}
        <View style={styles.inputRow}>
          <Ionicons name="gift-outline" size={20} color="#1b5e20" />
          <TextInput
            placeholder="Referral Code (Optional)"
            style={styles.input}
            value={referralCode}
            onChangeText={setReferralCode}
          />
        </View>

        {/* SIGNUP BUTTON */}
        <TouchableOpacity style={styles.signupBtn} onPress={handleSignup}>
          <LinearGradient
            colors={["#4caf50", "#2e7d32"]}
            style={styles.signupGradient}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={22}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.signupText}>Sign Up</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Already have an account?{" "}
          <Text
            style={styles.loginLink}
            onPress={() => navigation.navigate("Login")}
          >
            Login
          </Text>
        </Text>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 10},
  logo: { width: 160, height: 80, resizeMode: "contain", alignSelf: "center"},
  // title: { fontSize: 26, fontWeight: "800", color: "#1b5e20", textAlign: "center",},
  // subtitle: { textAlign: "center", color: "#4caf50",},

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 7,
    borderBottomWidth: 1.2,
    borderColor: "#cde8d0",

  },

  input: { flex: 1, fontSize: 16, marginLeft: 8, color: "#1b5e20" },
  countryCode: { marginHorizontal: 6, fontWeight: "700", color: "#1b5e20" },

  pickerBox: {
    borderBottomWidth: 1.2,
    borderColor: "#cde8d0",
    marginBottom: 7,
    paddingVertical: Platform.OS === "ios" ? 6 : 0,
  },

  dateRow: {
    borderBottomWidth: 1.2,
    borderColor: "#cde8d0",
    paddingVertical: 7,
    marginBottom: 7,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  dateText: { fontSize: 16, color: "#1b5e20" },

  signupBtn: { marginTop: 10, borderRadius: 7, overflow: "hidden" },

  signupGradient: {
    paddingVertical: 14,
    borderRadius: 7,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  signupText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  footer: {
    textAlign: "center",
    marginTop: 18,
    color: "#1b5e20",
    fontSize: 14,
  },

  loginLink: {
    color: "#2e7d32",
    fontWeight: "800",
    textDecorationLine: "underline",
  },
});
