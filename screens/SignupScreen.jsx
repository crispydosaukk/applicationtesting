import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import CountryPicker from "react-native-country-picker-modal";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { registerUser } from "../services/authService";
import { fetchRestaurants } from "../services/restaurantService";

const FONT_FAMILY = Platform.select({
  ios: "System",
  android: "System", // simple, matches Swiggy/Zomato style
});

export default function SignupScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [countryCode, setCountryCode] = useState("GB");
  const [callingCode, setCallingCode] = useState("44");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [preferredRestaurant, setPreferredRestaurant] = useState("");
  const [dob, setDob] = useState(null);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [gender, setGender] = useState("");

  // 🔹 New: restaurant list state
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Only for picker initial position (18 yrs back)
  const getDefaultDobForPicker = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d;
  };

  // 🔹 New: fetch restaurants on mount
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const data = await fetchRestaurants();
        if (isMounted) {
          setRestaurants(data || []);
        }
      } catch (err) {
        console.error("Failed to load restaurants:", err);
        if (isMounted) {
          Alert.alert(
            "Error",
            "Unable to load restaurants. Please try again later."
          );
        }
      } finally {
        if (isMounted) setRestaurantsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const validateForm = () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!name.trim()) return "Full name is required.";
    if (!email.trim()) return "Email is required.";
    if (!emailRegex.test(email)) return "Enter valid Gmail address.";
    if (!phone.trim()) return "Phone number is required.";
    if (!password.trim()) return "Password is required.";
    if (password.length < 6) return "Password must be 6+ characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    if (!preferredRestaurant) return "Select your preferred restaurant.";

    if (!dob) return "Please select your Date of Birth.";
    if (!termsAccepted) return "You must accept the Terms & Conditions and Privacy Policy to sign up.";
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
        // 🔹 sending restaurant NAME (same behaviour as earlier A/B/C)
        preferred_restaurant: preferredRestaurant,
        date_of_birth: dob ? dob.toISOString().split("T")[0] : null,
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
    <>
      {/* UI is drawn AFTER the status bar, icons dark */}
      <StatusBar backgroundColor="#f8fff8" barStyle="dark-content" />

      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#f8fff8",
          paddingBottom: insets.bottom, // only safe space at bottom
        }}
      >
        <LinearGradient
          colors={["#eaffea", "#ffffff"]}
          style={[styles.container, { paddingHorizontal: 24 }]}
        >
          {/* LOGO */}
          <Image source={require("../assets/logo.png")} style={styles.logo} />

          {/* FULL NAME */}
          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={20} color="#1b5e20" />
            <TextInput
              placeholder="Last Name"
              placeholderTextColor="#7a927a"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* EMAIL */}
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={20} color="#1b5e20" />
            <TextInput
              placeholder="Email"
              placeholderTextColor="#7a927a"
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
              placeholderTextColor="#7a927a"
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
              placeholderTextColor="#7a927a"
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
              placeholderTextColor="#7a927a"
              secureTextEntry
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          {/* 🔹 PREFERRED RESTAURANT (DYNAMIC) */}
          <View style={styles.pickerBox}>
            <Picker
              selectedValue={preferredRestaurant}
              onValueChange={setPreferredRestaurant}
              style={{ width: "100%", color: "#1b5e20" }}   // 🔥 MAIN FIX
              itemStyle={{ color: "#1b5e20" }}              // 🔥 Text visible everywhere
            >

              <Picker.Item label="Preferred Restaurant" value="" />

              {restaurantsLoading && (
                <Picker.Item label="Loading restaurants..." value="" />
              )}

              {!restaurantsLoading && restaurants.length === 0 && (
                <Picker.Item
                  label="No restaurants available"
                  value=""
                />
              )}

              {!restaurantsLoading &&
                restaurants.map((r) => (
                  <Picker.Item
                    key={r.id}
                    label={r.name}
                    value={r.name} // keep behaviour same as old static names
                  />
                ))}
            </Picker>
          </View>

          {/* DATE OF BIRTH */}
          <TouchableOpacity
            style={styles.dateRow}
            onPress={() => setShowDobPicker(true)}
          >
            <Text
              style={[
                styles.dateText,
                !dob && { color: "#7a927a" }, // placeholder style
              ]}
            >
              {dob ? dob.toDateString() : "Date of Birth"}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#1b5e20" />
          </TouchableOpacity>

          {showDobPicker && (
            <DateTimePicker
              mode="date"
              display="default"
              value={dob || getDefaultDobForPicker()}
              maximumDate={new Date()}
              onChange={(e, selectedDate) => {
                setShowDobPicker(false);
                if (selectedDate) setDob(selectedDate);
              }}
            />
          )}

          {/* GENDER */}
          <View style={styles.pickerBox}>
            <Picker
              selectedValue={gender}
              onValueChange={setGender}
              style={{ width: "100%", color: "#1b5e20" }}   // 🔥 MAIN FIX
              itemStyle={{ color: "#1b5e20" }}              // 🔥 Placeholder visible
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
              placeholderTextColor="#7a927a"
              style={styles.input}
              value={referralCode}
              onChangeText={setReferralCode}
            />
          </View>

          {/* TERMS CHECKBOX */}
          <View style={styles.termsContainer}>
            <TouchableOpacity onPress={() => setTermsAccepted(!termsAccepted)} style={styles.checkbox}>
              <Ionicons
                name={termsAccepted ? "checkbox" : "square-outline"}
                size={24}
                color={termsAccepted ? "#2e7d32" : "#7a927a"}
              />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.termsText}>
                I agree to the{" "}
                <Text
                  style={styles.linkText}
                  onPress={() => navigation.navigate("TermsConditions")}
                >
                  Terms & Conditions
                </Text>{" "}
                and{" "}
                <Text
                  style={styles.linkText}
                  onPress={() => navigation.navigate("PrivacyPolicy")}
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </View>

          {/* SIGN UP BUTTON */}
          <TouchableOpacity
            style={[styles.signupBtn, { opacity: termsAccepted ? 1 : 0.6 }]}
            onPress={handleSignup}
            disabled={!termsAccepted}
          >
            <LinearGradient
              colors={termsAccepted ? ["#4caf50", "#2e7d32"] : ["#a5d6a7", "#81c784"]}
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
  },

  logo: {
    width: 160,
    height: 72,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 10, // smaller gap so more space for form
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 4,
    borderBottomWidth: 1.1,
    borderColor: "#cde8d0",
  },

  input: {
    flex: 1,
    fontSize: 15,
    marginLeft: 8,
    color: "#1b5e20",
    fontFamily: FONT_FAMILY,
  },

  countryCode: {
    marginHorizontal: 6,
    fontWeight: "600",
    color: "#1b5e20",
    fontFamily: FONT_FAMILY,
    fontSize: 14,
  },

  pickerBox: {
    borderBottomWidth: 1.1,
    borderColor: "#cde8d0",
    marginBottom: 4,
    paddingVertical: Platform.OS === "ios" ? 4 : 0,
  },

  dateRow: {
    borderBottomWidth: 1.1,
    borderColor: "#cde8d0",
    paddingVertical: 8,
    marginBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  dateText: {
    fontSize: 15,
    color: "#1b5e20",
    fontFamily: FONT_FAMILY,
  },

  signupBtn: {
    marginTop: 12,
    borderRadius: 8,
    overflow: "hidden",
  },

  signupGradient: {
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  signupText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: FONT_FAMILY,
  },

  footer: {
    textAlign: "center",
    marginTop: 10,
    color: "#607163",
    fontSize: 12.5,
    fontFamily: FONT_FAMILY,
  },

  loginLink: {
    color: "#2e7d32",
    fontWeight: "700",

    textDecorationLine: "underline",
    fontFamily: FONT_FAMILY,
  },

  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 10,
  },
  checkbox: {
    padding: 2,
  },
  termsText: {
    fontSize: 13,
    color: "#444",
    fontFamily: FONT_FAMILY,
    lineHeight: 18,
  },
  linkText: {
    color: "#2e7d32",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
