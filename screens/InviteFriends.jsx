// InviteFriends.jsx
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Share,
    TextInput,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Clipboard from "@react-native-clipboard/clipboard";

export default function InviteFriends({ navigation }) {
    const [user, setUser] = useState(null);

    // Load user data
    useEffect(() => {
        const loadUser = async () => {
            try {
                const stored = await AsyncStorage.getItem("user");
                if (stored) setUser(JSON.parse(stored));
            } catch (e) {
                console.log("Failed to load user:", e);
            }
        };
        loadUser();
    }, []);

    const referralCode = user?.referral_code || "—";

    const handleCopy = () => {
        if (!user?.referral_code) return;
        Clipboard.setString(user.referral_code);
        Alert.alert("Copied", "Referral code copied to clipboard");
    };

    const handleShare = async () => {
        if (!user?.referral_code) return;

        try {
            const result = await Share.share({
                message: `Join me on CrispyDosa! Use my referral code ${user.referral_code} to get special offers.Download the app now!`,
                title: "Invite Friends to CrispyDosa",
            });
            if (result.action === Share.sharedAction) {
                console.log("Shared successfully");
            }
        } catch (error) {
            console.error("Error sharing:", error);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <LinearGradient colors={["#d7f7df", "#ffffff"]} style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                >
                    <Ionicons name="arrow-back" size={28} color="#222" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Invite Friends</Text>
                <View style={{ width: 28 }} />
            </LinearGradient>

            <ScrollView style={styles.content}>
                <View style={styles.heroCard}>
                    <Ionicons name="gift" size={64} color="#0b7a2a" />
                    <Text style={styles.heroTitle}>Share the Love!</Text>
                    <Text style={styles.heroSubtitle}>
                        Invite your friends and earn rewards when they make their first order
                    </Text>
                </View>

                <View style={styles.codeCard}>
                    <Text style={styles.codeLabel}>Your Referral Code</Text>
                    <View style={styles.codeBox}>
                        <TextInput
                            style={styles.codeText}
                            value={referralCode}
                            editable={false}
                            selectTextOnFocus
                        />
                        <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                            <Ionicons name="copy-outline" size={20} color="#0b7a2a" />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                    <Ionicons name="share-social" size={24} color="#ffffff" />
                    <Text style={styles.shareBtnText}>Share with Friends</Text>
                </TouchableOpacity>

                <View style={styles.benefitsSection}>
                    <Text style={styles.benefitsTitle}>How it works</Text>
                    <View style={styles.benefitItem}>
                        <View style={styles.benefitIcon}>
                            <Text style={styles.benefitNumber}>1</Text>
                        </View>
                        <Text style={styles.benefitText}>
                            Share your unique referral code with friends
                        </Text>
                    </View>
                    <View style={styles.benefitItem}>
                        <View style={styles.benefitIcon}>
                            <Text style={styles.benefitNumber}>2</Text>
                        </View>
                        <Text style={styles.benefitText}>
                            They sign up and place their first order
                        </Text>
                    </View>
                    <View style={styles.benefitItem}>
                        <View style={styles.benefitIcon}>
                            <Text style={styles.benefitNumber}>3</Text>
                        </View>
                        <Text style={styles.benefitText}>
                            You both get rewards and special discounts!
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#222",
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    heroCard: {
        alignItems: "center",
        backgroundColor: "#e8f5e9",
        borderRadius: 16,
        padding: 32,
        marginTop: 20,
        marginBottom: 24,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#222",
        marginTop: 16,
    },
    heroSubtitle: {
        fontSize: 14,
        color: "#555",
        textAlign: "center",
        marginTop: 8,
        lineHeight: 20,
    },
    codeCard: {
        backgroundColor: "#f8f8f8",
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
    },
    codeLabel: {
        fontSize: 14,
        color: "#666",
        marginBottom: 8,
        fontWeight: "600",
    },
    codeBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 8,
        borderWidth: 2,
        borderColor: "#0b7a2a",
        paddingHorizontal: 12,
    },
    codeText: {
        flex: 1,
        fontSize: 20,
        fontWeight: "700",
        color: "#0b7a2a",
        letterSpacing: 2,
        paddingVertical: 12,
    },
    copyBtn: {
        padding: 8,
    },
    shareBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0b7a2a",
        borderRadius: 12,
        paddingVertical: 16,
        marginBottom: 32,
    },
    shareBtnText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#ffffff",
        marginLeft: 8,
    },
    benefitsSection: {
        marginBottom: 32,
    },
    benefitsTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#222",
        marginBottom: 16,
    },
    benefitItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    benefitIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#0b7a2a",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    benefitNumber: {
        fontSize: 18,
        fontWeight: "700",
        color: "#ffffff",
    },
    benefitText: {
        flex: 1,
        fontSize: 14,
        color: "#555",
        lineHeight: 20,
    },
});
