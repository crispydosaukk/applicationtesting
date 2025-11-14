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
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import CountryPicker from "react-native-country-picker-modal";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { registerUser } from "../services/authService";

export default function SignupScreen({ navigation }) {
  // Default country set to UK
  const [countryCode, setCountryCode] = useState("GB");
  const [callingCode, setCallingCode] = useState("44");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // New fields
  const [preferredRestaurant, setPreferredRestaurant] = useState("");
  const [dob, setDob] = useState(new Date());
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [referralCode, setReferralCode] = useState(""); // optional
  const [gender, setGender] = useState(""); // optional

  // ✅ Validation
  const validateForm = () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    const phoneRegex = /^[0-9]+$/;

    if (!name.trim()) return "Full name is required.";
    if (!email.trim()) return "Email is required.";
    if (!emailRegex.test(email))
      return "Please enter a valid Gmail address (e.g., example@gmail.com).";

    if (!phone.trim()) return "Phone number is required.";
    if (!phoneRegex.test(phone))
      return "Phone number should contain digits only.";

    if (callingCode === "91" && phone.length !== 10)
      return "Indian phone numbers must be 10 digits.";
    if (callingCode === "44" && (phone.length < 10 || phone.length > 11))
      return "UK phone numbers should be 10–11 digits.";
    if (callingCode === "1" && phone.length !== 10)
      return "US phone numbers must be 10 digits.";

    if (!password.trim()) return "Password is required.";
    if (password.length < 6)
      return "Password must be at least 6 characters long.";
    if (password !== confirmPassword) return "Passwords do not match.";

    if (!preferredRestaurant) return "Please select your preferred restaurant.";

    return null;
  };

  const handleSignup = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert("Validation Error", validationError);
      return;
    }

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
      Alert.alert("Success", "Account created successfully!");
      navigation.navigate("Login");
    } catch (error) {
      console.log("Signup Error:", error);
      Alert.alert("Error", error.message || "Signup failed");
    }
  };

  return (
    <LinearGradient
      colors={["#fff7f3", "#fffefb", "#f0fff4"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
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

            {/* Email */}
            <View style={styles.inputBox}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={20} color="#8A6C54" />
                <TextInput
                  placeholder="Enter Gmail address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Mobile Number */}
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

            {/* Confirm Password */}
            <View style={styles.inputBox}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={20} color="#8A6C54" />
                <TextInput
                  placeholder="Re-enter password"
                  secureTextEntry
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            {/* Preferred Restaurant */}
            <View style={styles.inputBox}>
              <Text style={styles.label}>Preferred Restaurant</Text>
              <View style={styles.inputRow}>
                <Picker
                  selectedValue={preferredRestaurant}
                  style={{ flex: 1 }}
                  onValueChange={(itemValue) => setPreferredRestaurant(itemValue)}
                >
                  <Picker.Item label="Select Restaurant" value="" />
                  <Picker.Item label="Restaurant A" value="Restaurant A" />
                  <Picker.Item label="Restaurant B" value="Restaurant B" />
                  <Picker.Item label="Restaurant C" value="Restaurant C" />
                </Picker>
              </View>
            </View>

           {/* DOB */}
<View style={styles.inputBox}>
  <Text style={styles.label}>Date of Birth</Text>
  <TouchableOpacity
    style={[styles.inputRow, { paddingVertical: 12 }]} // match other inputs
    onPress={() => setShowDobPicker(true)}
  >
    <Text style={{ flex: 1, fontSize: 16, color: dob ? "#2D1B0F" : "#8A6C54" }}>
      {dob ? dob.toDateString() : "Select date of birth"}
    </Text>
    <Ionicons name="calendar-outline" size={20} color="#8A6C54" />
  </TouchableOpacity>
  {showDobPicker && (
    <DateTimePicker
      value={dob}
      mode="date"
      display="default"
      maximumDate={new Date()}
      onChange={(event, selectedDate) => {
        setShowDobPicker(false);
        if (selectedDate) setDob(selectedDate);
      }}
    />
  )}
</View>


            {/* Referral Code (Optional) */}
            <View style={styles.inputBox}>
              <Text style={styles.label}>Referral Code (Optional)</Text>
              <View style={styles.inputRow}>
                <Ionicons name="gift-outline" size={20} color="#8A6C54" />
                <TextInput
                  placeholder="Enter referral code"
                  style={styles.input}
                  value={referralCode}
                  onChangeText={setReferralCode}
                />
              </View>
            </View>

            {/* Gender (Optional) */}
            <View style={styles.inputBox}>
              <Text style={styles.label}>Gender (Optional)</Text>
              <View style={styles.inputRow}>
                <Picker
                  selectedValue={gender}
                  style={{ flex: 1 }}
                  onValueChange={(itemValue) => setGender(itemValue)}
                >
                  <Picker.Item label="Select Gender" value="" />
                  <Picker.Item label="Male" value="male" />
                  <Picker.Item label="Female" value="female" />
                  <Picker.Item label="Other" value="other" />
                </Picker>
              </View>
            </View>

            {/* Signup Button */}
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSignup}>
              <LinearGradient
                colors={["#ffe8e8", "#fff2f2", "#e3ffe3"]}
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
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingBottom: 100,
  },
  inputRow: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#FFF9F0",
  borderWidth: 1.8,
  borderColor: "#D9A875",
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 12, // add this if not already
},

  logo: {
    width: 220,
    height: 110,
    resizeMode: "contain",
    marginBottom: -5,
  },
  card: {
    width: "88%",
    backgroundColor: "#FFFFFFEE",
    borderRadius: 24,
    paddingVertical: 30,
    paddingHorizontal: 26,
    borderWidth: 2.5,
    borderColor: "#FFB678",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
  },
  title: { fontSize: 26, fontWeight: "800", color: "#2D1B0F", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#8A6C54", textAlign: "center", marginBottom: 25 },
  inputBox: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: "600", color: "#2D1B0F", marginBottom: 6 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9F0",
    borderWidth: 1.8,
    borderColor: "#D9A875",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.8,
    borderColor: "#D9A875",
    borderRadius: 12,
    backgroundColor: "#FFF9F0",
    paddingHorizontal: 8,
  },
  codeText: { fontSize: 16, fontWeight: "700", color: "#2D1B0F", marginHorizontal: 6 },
  input: { paddingVertical: 12, fontSize: 16, color: "#2D1B0F", flex: 1 },
  primaryBtn: { borderRadius: 16, overflow: "hidden", marginTop: 10, borderWidth: 2, borderColor: "#2D1B0F" },
  btnGradient: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 14, borderRadius: 14 },
  primaryText: { fontSize: 18, fontWeight: "700", color: "#2D1B0F" },
  footerText: { marginTop: 16, textAlign: "center", fontSize: 15, color: "#2D1B0F" },
  link: { fontWeight: "700", textDecorationLine: "underline" },
});
