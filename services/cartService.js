import api from "../config/api";

// Add to cart
export const addToCart = async (cartData) => {
  try {
    const res = await api.post("/cart/add", cartData);
    return res.data;
  } catch (err) {
    console.error("Add to Cart Error:", err.response?.data || err);
    return { status: 0, message: "API Error" };
  }
};

// Get cart items for a customer
export const getCart = async (customerId) => {
  try {
    const res = await api.get(`/cart?customer_id=${customerId}`);
    return res.data;
  } catch (err) {
    console.error("Get Cart Error:", err.response?.data || err);
    return { status: 0, data: [] };
  }
};

// Remove cart item
export const removeFromCart = async (cartId) => {
  try {
    const res = await api.post("/cart/remove", { cart_id: cartId });
    return res.data;
  } catch (err) {
    console.error("Remove Cart Error:", err.response?.data || err);
    return { status: 0, message: "API Error" };
  }
};
