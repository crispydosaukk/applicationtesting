import api from "../config/api";

export const fetchCategories = async (userId) => {
  try {
    const res = await api.get(`/categories?user_id=${userId}`);

    if (res.data.status === 1) {
      return res.data.data.map(cat => ({
        id: cat.id,
        name: cat.name || cat.category_name || "",
        userId: cat.user_id,
        image: cat.category_image  // FIXED
          ? `http://192.168.1.7:4000/uploads/${cat.category_image}`
          : null,
      }));
    }

    return [];
  } catch (error) {
    console.log("Category Service Error:", error.response?.data || error);
    return [];
  }
};
