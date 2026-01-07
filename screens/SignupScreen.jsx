// screens/SignupScreen.jsx
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
  ScrollView,
  Dimensions,
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

const { width } = Dimensions.get("window");
const scale = width / 400;

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

  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await fetchRestaurants();
        if (isMounted) setRestaurants(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setRestaurantsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const validateForm = () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!name.trim()) return "Full name is required.";
    if (!email.trim()) return "Email is required.";
    if (!emailRegex.test(email)) return "Enter valid Gmail address (@gmail.com).";
    if (!phone.trim()) return "Phone number is required.";
    if (!password.trim()) return "Password is required.";
    if (password.length < 6) return "Password must be 6+ characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    if (!preferredRestaurant) return "Select your preferred restaurant.";
    if (!dob) return "Please select your Date of Birth.";
    if (!termsAccepted) return "Please accept Terms & Conditions.";
    return null;
  };

  const handleSignup = async () => {
    const err = validateForm();
    if (err) return Alert.alert("Required", err);

    try {
      await registerUser({
        full_name: name,
        email,
        mobile_number: phone,
        country_code: `+${callingCode}`,
        password,
        preferred_restaurant: preferredRestaurant,
        date_of_birth: dob ? dob.toISOString().split("T")[0] : null,
        referral_code: referralCode || null,
        gender: gender || null,
      });
      Alert.alert("Success", "Welcome to Crispy Dosa!");
      navigation.navigate("Login");
    } catch (e) {
      Alert.alert("Signup Failed", e.message || "Something went wrong.");
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 60 }}>

        <LinearGradient
          colors={["#16a34a", "#15803d"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Image source={require("../assets/logo.png")} style={styles.logo} />
            <Text style={styles.title}>Create Account</Text>

            {/* SIGNUP BONUS PILL */}
            <View style={styles.bonusBadge}>
              <Ionicons name="gift" size={16} color="#FFD700" />
              <Text style={styles.bonusText}>GET <Text style={{ fontWeight: '900' }}>£0.25</Text> SIGNUP BONUS</Text>
            </View>
          </View>
          {/* Decorative shapes */}
          <View style={styles.decor1} />
          <View style={styles.decor2} />
        </LinearGradient>

        <View style={styles.formCard}>

          <InputItem icon="person-outline" placeholder="Full Name" value={name} onChangeText={setName} />

          <InputItem icon="mail-outline" placeholder="Gmail Address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <View style={styles.phoneContainer}>
            <CountryPicker
              countryCode={countryCode}
              withFlag
              withCallingCode
              onSelect={(c) => {
                setCountryCode(c.cca2);
                setCallingCode(c.callingCode[0]);
              }}
            />
            <Text style={styles.callingCodeText}>+{callingCode}</Text>
            <TextInput
              placeholder="Mobile Number"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              style={styles.phoneInput}
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <InputItem icon="lock-closed-outline" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

          <InputItem icon="lock-closed-outline" placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

          {/* RESTAURANT PICKER */}
          <View style={styles.pickerWrapper}>
            <Ionicons name="restaurant-outline" size={20} color="#16a34a" style={styles.pickerIcon} />
            <View style={{ flex: 1 }}>
              <Picker
                selectedValue={preferredRestaurant}
                onValueChange={setPreferredRestaurant}
                style={styles.picker}
                dropdownIconColor="#16a34a"
              >
                <Picker.Item label="Preferred Restaurant" value="" color="#94A3B8" />
                {restaurants.map(r => (
                  <Picker.Item key={r.id} label={r.name} value={r.name} />
                ))}
              </Picker>
            </View>
          </View>

          {/* DOB */}
          <TouchableOpacity style={styles.dobBtn} onPress={() => setShowDobPicker(true)}>
            <Ionicons name="calendar-outline" size={20} color="#16a34a" />
            <Text style={[styles.dobText, !dob && { color: "#94A3B8" }]}>
              {dob ? dob.toDateString() : "Date of Birth"}
            </Text>
          </TouchableOpacity>

          {showDobPicker && (
            <DateTimePicker
              value={dob || new Date()}
              mode="date"
              display="spinner"
              onChange={(e, date) => {
                setShowDobPicker(false);
                if (date) setDob(date);
              }}
            />
          )}

          {/* GENDER */}
          <View style={styles.pickerWrapper}>
            <Ionicons name="transgender-outline" size={20} color="#16a34a" style={styles.pickerIcon} />
            <View style={{ flex: 1 }}>
              <Picker
                selectedValue={gender}
                onValueChange={setGender}
                style={styles.picker}
                dropdownIconColor="#16a34a"
              >
                <Picker.Item label="Gender (Optional)" value="" color="#94A3B8" />
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Female" value="female" />
                <Picker.Item label="Other" value="other" />
              </Picker>
            </View>
          </View>

          <InputItem icon="gift-outline" placeholder="Referral Code (Optional)" value={referralCode} onChangeText={setReferralCode} />

          <TouchableOpacity style={styles.termsRow} onPress={() => setTermsAccepted(!termsAccepted)}>
            <Ionicons name={termsAccepted ? "checkbox" : "square-outline"} size={22} color={termsAccepted ? "#16a34a" : "#CBD5E1"} />
            <Text style={styles.termsText}>
              I agree to the <Text style={styles.link} onPress={() => navigation.navigate("TermsConditions")}>Terms</Text> & <Text style={styles.link} onPress={() => navigation.navigate("PrivacyPolicy")}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainBtn, !termsAccepted && { opacity: 0.6 }]}
            onPress={handleSignup}
            disabled={!termsAccepted}
          >
            <LinearGradient colors={["#16a34a", "#15803d"]} style={styles.btnGradient}>
              <Text style={styles.btnText}>Create Account</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>

        </View>

        <TouchableOpacity style={styles.footer} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.footerText}>Already have an account? <Text style={styles.footerLink}>Sign In</Text></Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const InputItem = ({ icon, ...props }) => (
  <View style={styles.inputContainer}>
    <Ionicons name={icon} size={18} color="#16a34a" />
    <TextInput
      placeholderTextColor="#475569"
      style={styles.input}
      {...props}
    />
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  headerGradient: {
    paddingTop: 30,
    paddingBottom: 65,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    alignItems: 'center',
    zIndex: 10,
  },
  logo: { width: 140, height: 60, resizeMode: 'contain' },
  title: { fontSize: 22 * scale, fontFamily: "PoppinsBold", color: "#FFF", marginTop: 2, fontWeight: '900' },

  bonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  bonusText: {
    color: '#FFF',
    fontSize: 11 * scale,
    fontFamily: 'PoppinsBold',
    marginLeft: 6,
    letterSpacing: 0.5,
  },

  decor1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decor2: {
    position: 'absolute',
    bottom: 20,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  formCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: -45, // Moved significantly higher
    borderRadius: 24,
    padding: 16,
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 52,
    marginBottom: 10,
    borderWidth: 1.2,
    borderColor: "#94A3B8"
  },
  input: { flex: 1, marginLeft: 12, fontSize: 14 * scale, color: "#000000", fontFamily: "PoppinsBold", paddingVertical: 0 },

  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 52,
    marginBottom: 10,
    borderWidth: 1.2,
    borderColor: "#94A3B8"
  },
  callingCodeText: { fontSize: 14 * scale, fontFamily: "PoppinsBold", color: "#000000", marginLeft: 5 },
  phoneInput: { flex: 1, marginLeft: 10, fontSize: 14 * scale, color: "#000000", fontFamily: "PoppinsBold", paddingVertical: 0 },

  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 52,
    marginBottom: 10,
    borderWidth: 1.2,
    borderColor: "#94A3B8"
  },
  pickerIcon: { marginRight: 2 },
  picker: { flex: 1, marginLeft: 2, height: 52, color: "#000000" },

  dobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 52,
    marginBottom: 10,
    borderWidth: 1.2,
    borderColor: "#94A3B8"
  },
  dobText: { marginLeft: 12, fontSize: 14 * scale, color: "#000000", fontFamily: "PoppinsBold" },

  termsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginTop: 4 },
  termsText: { flex: 1, marginLeft: 10, fontSize: 12 * scale, color: "#475569", lineHeight: 18 },
  link: { color: "#16a34a", fontFamily: "PoppinsBold" },

  mainBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 5 },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  btnText: { color: "#FFF", fontSize: 16 * scale, fontFamily: "PoppinsBold", marginRight: 8 },

  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { fontSize: 14 * scale, color: "#64748B" },
  footerLink: { color: "#16a34a", fontFamily: "PoppinsBold" }
});
