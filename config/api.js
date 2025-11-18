import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./baseURL";

const api = axios.create({
  baseURL: API_BASE_URL,
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
