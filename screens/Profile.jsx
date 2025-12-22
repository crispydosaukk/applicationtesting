import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Share,
  Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Clipboard from "@react-native-clipboard/clipboard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RefreshControl } from "react-native";
import BottomBar from "./BottomBar.jsx";
import AppHeader from "./AppHeader";
import { AuthRequiredInline, AuthRequiredModal } from "./AuthRequired";
import { fetchProfile } from "../services/profileService";
import { getWalletSummary } from "../services/walletService";


const { width } = Dimensions.get("window");
const scale = width / 400;

export default function Profile({ navigation }) {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // local user to determine if authenticated
  const [userLocal, setUserLocal] = useState(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const stored = await AsyncStorage.getItem("user");
        const parsed = stored ? JSON.parse(stored) : null;
        setUserLocal(parsed);

        if (!parsed) {
          // not signed in — avoid API calls and stop loading
          setLoading(false);
          return;
        }

        // Show screen immediately while fetching
        setLoading(false);

        // signed in: fetch profile and wallet
        const [profileData, walletData] = await Promise.all([fetchProfile(), getWalletSummary()]);
        setProfile(profileData);
        setWallet(walletData);
      } catch (err) {
        console.log("Profile error", err);
      }
      // finally block removed as setLoading(false) is handled earlier
    };

    init();
  }, []);


  const copyReferralCode = () => {
    if (!profile?.referral_code) {
      Alert.alert("No referral code", "Please sign in to access your referral code.");
      return;
    }

    Clipboard.setString(profile.referral_code);
    Alert.alert("Copied", "Referral code copied to clipboard");
  };

  const shareReferral = async () => {
    if (!profile?.referral_code) {
      Alert.alert("No referral code", "Please sign in to access and share your referral code.");
      return;
    }

    try {
      await Share.share({
        message: `Use my referral code *${profile.referral_code}* and get rewards on your first order 🚀`,
      });
    } catch (err) {
      console.log("Share error", err);
    }
  };



  const onRefresh = async () => {
    if (!userLocal) {
      setRefreshing(false);
      return;
    }

    try {
      setRefreshing(true);

      const [profileData, walletData] = await Promise.all([
        fetchProfile(),
        getWalletSummary(),
      ]);

      setProfile(profileData);
      setWallet(walletData);
    } catch (err) {
      console.log("Profile refresh error", err);
    } finally {
      setRefreshing(false);
    }
  };


  const logout = async () => {
    await AsyncStorage.removeItem("token");
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  // If not signed in, show the inline prompt (with header + bottom bar) immediately
  if (!userLocal) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f6f7fb" }}>
        <AppHeader
          user={null}
          navigation={navigation}
          cartItems={{}}
          onMenuPress={() => setAuthModalVisible(true)}
        />

        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <AuthRequiredInline onSignIn={() => navigation.replace("Login")} description={"Sign in to view your profile, orders and rewards."} />

          <AuthRequiredModal
            visible={authModalVisible}
            onClose={() => setAuthModalVisible(false)}
            onSignIn={() => { setAuthModalVisible(false); navigation.replace("Login"); }}
          />
        </View>

        <BottomBar navigation={navigation} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f6f7fb" }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        {/* HEADER */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Ionicons name="person-outline" size={34} color="#28a745" />
            </View>

            <View style={{ marginLeft: 14 }}>
              <Text style={styles.name}>{profile?.full_name || "—"}</Text>
              <Text style={styles.phone}>
                {profile?.country_code || ""} {profile?.mobile_number || ""}
              </Text>
            </View>
          </View>
        </View>

        {/* WALLET */}
        <View style={styles.walletCard}>
          <Ionicons name="wallet-outline" size={26} color="#28a745" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.walletLabel}>Wallet Balance</Text>
            <Text style={styles.walletAmount}>£{wallet?.wallet_balance}</Text>
          </View>
        </View>

        {/* REFERRAL */}
        <View style={styles.referralCard}>
          <View>
            <Text style={styles.refTitle}>Your Referral Code</Text>
            <Text style={styles.refCode}>{profile?.referral_code || "—"}</Text>
            <Text style={styles.refSub}>
              Invite friends & earn credits
            </Text>
          </View>

          <View style={{ gap: 8 }}>
            <TouchableOpacity style={styles.copyBtn} onPress={copyReferralCode}>
              <Ionicons name="copy-outline" size={18} color="#28a745" />
              <Text style={styles.copyText}>Copy</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareBtn} onPress={shareReferral}>
              <Ionicons name="logo-whatsapp" size={18} color="#fff" />
              <Text style={styles.shareText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.quickRow}>
          <QuickItem
            icon="receipt-outline"
            label="Orders"
            onPress={() => navigation.navigate("Orders")}
          />
          <QuickItem
            icon="wallet-outline"
            label="Credits"
            onPress={() => navigation.navigate("Credits")}
          />
          <QuickItem
            icon="headset-outline"
            label="Support"
            onPress={() => navigation.navigate("HelpCenter")}
          />
        </View>

        {/* MENU */}
        <View style={styles.menuCard}>
          <MenuItem
            icon="card-outline"
            label="Payment History"
            onPress={() => {
              if (!userLocal) setAuthModalVisible(true);
              else navigation.navigate("PaymentHistory");
            }}
          />
          <MenuItem
            icon="person-outline"
            label="Edit Profile"
            onPress={() => navigation.navigate("EditProfile")}
          />
          <MenuItem
            icon="log-out-outline"
            label="Logout"
            danger
            onPress={logout}
          />
        </View>
      </ScrollView>

      <BottomBar navigation={navigation} />
    </View>
  );
}

/* ---------- SMALL COMPONENTS ---------- */

const QuickItem = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.quickItem} onPress={onPress}>
    <Ionicons name={icon} size={22} color="#28a745" />
    <Text style={styles.quickText}>{label}</Text>
  </TouchableOpacity>
);

const MenuItem = ({ icon, label, danger, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Ionicons
      name={icon}
      size={22}
      color={danger ? "#e53935" : "#333"}
    />
    <Text style={[styles.menuText, danger && { color: "#e53935" }]}>
      {label}
    </Text>
    {!danger && (
      <Ionicons name="chevron-forward" size={18} color="#aaa" />
    )}
  </TouchableOpacity>
);

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    backgroundColor: "#28a745",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  profileRow: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },

  name: { fontSize: 18 * scale, fontWeight: "700", color: "#fff" },
  phone: { fontSize: 13 * scale, color: "#eaffef" },

  walletCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 4,
  },
  walletLabel: { fontSize: 12, color: "#777" },
  walletAmount: { fontSize: 20, fontWeight: "800", color: "#000" },

  referralCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    elevation: 4,
  },
  refTitle: { fontSize: 12, color: "#777" },
  refCode: { fontSize: 20, fontWeight: "800" },
  refSub: { fontSize: 11, color: "#888" },

  copyBtn: {
    flexDirection: "row",
    backgroundColor: "#eaf8ef",
    padding: 6,
    borderRadius: 20,
    alignItems: "center",
  },
  copyText: { marginLeft: 6, color: "#28a745", fontSize: 12 },

  shareBtn: {
    flexDirection: "row",
    backgroundColor: "#25D366",
    padding: 6,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  shareText: { marginLeft: 6, color: "#fff", fontSize: 12 },

  quickRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 22,
  },
  quickItem: {
    backgroundColor: "#fff",
    width: width * 0.28,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    elevation: 4,
  },
  quickText: { marginTop: 6, fontSize: 12, fontWeight: "600" },

  menuCard: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 0.5,
    borderColor: "#eee",
  },
  menuText: { flex: 1, marginLeft: 14, fontSize: 14 },
});
