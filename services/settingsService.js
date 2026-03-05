import api from "../config/api";
import { Alert } from "react-native";

export const fetchAppSettings = async () => {
    try {
        const res = await api.get("/app-settings");
        if (res.data.status === 1) {
            return res.data.data;
        }
        return null;
    } catch (error) {
        console.error("Fetch App Settings Error:", error.response?.data?.message || error.message);
        return null;
    }
};
