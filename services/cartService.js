import api from "../config/api";

// Add or update cart item (quantity change or notes update)
export const addToCart = async (cartData) => {
  try {
    /**
     cartData must include:
     - customer_id
     - user_id
     - product_id
     - restaurant_id
     - product_name
     - product_price
     - product_tax
     - product_quantity  (delta: +1, -1)
     - textfield (notes)
    */

    const res = await api.post("/cart/add", cartData);
    if (res && res.data) return res.data;

    return { status: 0, message: "Unknown API error" };
  } catch (err) {
    console.log("Add to Cart Error:", err.response?.data || err.message || err);
    return { status: 0, message: "API Error" };
  }
};

// Get full cart for a user
export const getCart = async (customerId) => {
  try {
    const res = await api.get(`/cart?customer_id=${customerId}`);
    if (res && res.data) return res.data;

    return { status: 0, data: [] };
  } catch (err) {
    console.log("Get Cart Error:", err.response?.data || err.message || err);
    return { status: 0, data: [] };
  }
};

// Remove item from cart
export const removeFromCart = async (cartId) => {
  try {
    const res = await api.post("/cart/remove", { id: cartId });
    if (res && res.data) return res.data;

    return { status: 0, message: "Unknown API error" };
  } catch (err) {
    console.log("Remove Cart Error:", err.response?.data || err.message || err);
    return { status: 0, message: "API Error" };
  }
};
