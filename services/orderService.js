// services/orderService.js
import api from "../config/api";

/**
 * CREATE ORDER
 * Used in CheckoutScreen
 */
export const createOrder = async (orderData) => {
  try {
    const response = await api.post("/create-order", orderData);
    return response.data;
  } catch (err) {
    console.log("createOrder error:", err);
    return {
      status: 0,
      message: err.response?.data?.message || "Unable to place order",
    };
  }
};

/**
 * GET CUSTOMER ORDERS (ORDER HISTORY)
 * Backend: GET /orders/customer/:customer_id
 */
export const getOrders = async (customerId) => {
  try {
    const response = await api.get(`/orders/customer/${customerId}`);
    return response.data; // { status: 1, data: [...] }
  } catch (err) {
    console.log("getOrders error:", err);
    return {
      status: 0,
      message: err.response?.data?.message || "Unable to fetch orders",
      data: [],
    };
  }
};

/**
 * GET SINGLE ORDER DETAILS
 * Backend: GET /orders/:order_id
 */
export const getOrder = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return response.data; // { status: 1, data: {...} }
  } catch (err) {
    console.log("getOrder error:", err);
    return {
      status: 0,
      message: err.response?.data?.message || "Unable to fetch order details",
    };
  }
};
