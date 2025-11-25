import api from "../config/api";

export const fetchProducts = async (userId, categoryId) => {
  try {
    const res = await api.get(`/products?user_id=${userId}&cat_id=${categoryId}`);

    if (res.data.status === 1) {
      return res.data.data.map(product => ({
        ...product,
        restaurantId: product.user_id, // Ensure restaurantId is passed
      }));
    }
    return [];
  } catch (err) {
    console.log("Product Service Error:", err.response?.data || err);
    return [];
  }
};
