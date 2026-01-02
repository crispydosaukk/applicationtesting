import messaging from "@react-native-firebase/messaging";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveFcmToken } from "../services/notificationService";

export const initAndSaveFcmToken = async () => {
  try {
    const userStr = await AsyncStorage.getItem("user");
    if (!userStr) return;

    const user = JSON.parse(userStr);

    const token = await messaging().getToken();

    await saveFcmToken({
      userType: "customer",
      userId: user.id || user.customer_id,
      token
    });

  } catch (err) {
    console.log("FCM init error:", err);
  }
};
