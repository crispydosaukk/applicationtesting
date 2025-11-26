// services/orderService.js
import api from "../config/api";

export const createOrder = async (orderData) => {
  try {
    // Use the axios instance to POST the order
    const response = await api.post("/create-order", orderData);

    // Axios wraps the response in `data`
    return response.data;
  } catch (err) {
    console.log("createOrder error:", err);

    // Optional: check for network error
    if (err.isNetworkError) {
      return { status: 0, message: "Network Error" };
    }

    // Return backend error message if available
    return {
      status: 0,
      message: err.response?.data?.message || "Something went wrong",
    };
  }
};

// 🔹 NEW: Fetch order history for a customer
export const getOrders = async (customerId) => {
  try {
    // TODO: if your backend uses a different URL, change it here
    // e.g. "/customer-orders", "/get-orders", etc.
    const response = await api.get(`/orders?customer_id=${customerId}`);
    return response.data; // expect { status: 1, data: [...] }
  } catch (err) {
    console.log("getOrders error:", err);
    return {
      status: 0,
      message: err.response?.data?.message || "Unable to fetch orders",
      data: [],
    };
  }
};
