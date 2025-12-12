import api from "../config/api";

export const getWalletSummary = async () => {
  try {
    const res = await api.get("/wallet/summary");
    return res.data; 
  } catch (err) {
    console.log("getWalletSummary error:", err);
    return {
      wallet_balance: 0,
      loyalty_points: 0,
      referral_credits: 0,
      history: [],
    };
  }
};
