import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your PC's local IP address (from ipconfig)
const API_URL = "http://192.168.1.10:4000/mobile";

const api = axios.create({
  baseURL: API_URL,
});

// Add token automatically if available
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔥 Detect network error globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.isNetworkError = true;
    }
    return Promise.reject(error);
  }
);

export default api;
