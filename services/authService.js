import api from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 🔹 Login User
export const loginUser = async (email, password) => {
  try {
    const res = await api.post("/login", { email, password });
    const { token, user } = res.data;

    // Save token for future requests
    await AsyncStorage.setItem("token", token);

    return { user, token };
  } catch (error) {
    console.log("Login error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Login failed");
  }
};

export const registerUser = async (data) => {
  try {
    const res = await api.post("/register", data); // 👈 changed from /signup
    return res.data;
  } catch (error) {
    console.log("Register error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Signup failed");
  }
};
