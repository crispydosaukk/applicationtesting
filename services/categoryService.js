import api, { IMAGE_BASE_URL } from "../config/api";

export const fetchCategories = async (userId) => {
  try {
    const res = await api.get(`/categories?user_id=${userId}`);

    if (res.data.status === 1) {
      return res.data.data.map(cat => ({
        id: cat.id,
        userId: cat.user_id,
        name: cat.name,
        image: cat.image
          ? `${IMAGE_BASE_URL}/uploads/${cat.image}`   // SAME AS RESTAURANT
          : null,
      }));
    }

    return [];
  } catch (error) {
    console.error("Category API Error:", error.response?.data || error);
    return [];
  }
};
