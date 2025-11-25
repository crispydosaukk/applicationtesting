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
