import api from "../config/api";

export const saveFcmToken = async ({ userType, userId, token }) => {
  try {
    await api.post("/save-fcm-token", {
      user_type: userType,   // "customer"
      user_id: userId,       // customers.id
      device_type: "android",
      fcm_token: token
    });
  } catch (err) {
  console.log(
    "Save FCM token failed:",
    err.response?.data || err
  );
}
};
