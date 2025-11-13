import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Logs out user by clearing token & user data, then redirecting to Home.
 */
export const logoutUser = async (navigation) => {
  try {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");

    // Reset navigation stack and go to Home screen
    navigation.reset({
      index: 0,
      routes: [{ name: "Home" }],
    });
  } catch (error) {
    console.error("Logout error:", error);
  }
};
