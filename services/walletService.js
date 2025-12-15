// services/walletService.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../config/api";

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getWalletSummary = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await api.get("/wallet/summary", { headers });
    return res.data;
  } catch (err) {
    console.log("getWalletSummary error:", err?.response?.data || err?.message);
    return {
      wallet_balance: 0,
      loyalty_points: 0,
      loyalty_pending_points: 0,
      loyalty_pending_list: [],
      referral_credits: 0,
      history: [],
      loyalty_redeem_points: 10,
      loyalty_redeem_value: 1,
      loyalty_available_after_hours: 24,
    };
  }
};

export const redeemLoyaltyToWallet = async () => {
  try {
    const headers = await getAuthHeaders();
    const res = await api.post("/loyalty/redeem", {}, { headers });
    return res.data;
  } catch (err) {
    console.log(
      "redeemLoyaltyToWallet error:",
      err?.response?.data || err?.message
    );
    return {
      status: 0,
      message: err?.response?.data?.message || "Redeem failed",
    };
  }
};
