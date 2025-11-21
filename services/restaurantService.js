import api, { IMAGE_BASE_URL } from "../config/api";

export const fetchRestaurants = async () => {
  try {
    const res = await api.get("/restaurants");
    console.log("Restaurant API Response:", res.data);

    if (res.data.status === 1) {
      return res.data.data.map(r => ({
        id: r.id,
        userId: r.userid,
        name: r.name,
        address: r.address,
        photo: r.photo
          ? `${IMAGE_BASE_URL}/uploads/${r.photo}`
          : null,
      }));
    }
``
    return [];
  } catch (error) {
    console.error("Restaurant API Error:", error.response?.data || error.message);
    return [];
  }
};
