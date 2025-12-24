// restaurantService.js
import api from "../config/api";

// Fetch all restaurants
export const fetchRestaurants = async () => {
  try {
    const res = await api.get("/restaurants");
    if (res.data.status === 1) {
      return res.data.data.map(r => ({
        id: r.id,
        userId: r.userid,
        name: r.name,
        address: r.address,
        photo: r.photo,
        instore: r.instore,
        kerbside: r.kerbside,
      }));
    }
    return [];
  } catch (error) {
    console.error("Restaurant API Error:", error.response?.data || error.message);
    return [];
  }
};

// Fetch single restaurant by userId
export const fetchRestaurantDetails = async (userId) => {
  try {
    const res = await api.get(`/restaurant/${userId}`);
    if (res.data.status === 1 && res.data.data.length > 0) {
      // restaurant_photo here is already a full URL
      return res.data.data[0];
    }
    return null;
  } catch (error) {
    console.error("Restaurant Details API Error:", error.response?.data || error.message);
    return null;
  }
};

export const fetchRestaurantTimings = async (restaurantId) => {
  try {
    const res = await api.get(`/restaurant-timings/${restaurantId}`);
    if (res.data.status === 1) {
      return res.data.data; // array of timings
    }
    return [];
  } catch (error) {
    console.error("Fetch Timings Error:", error.response?.data || error.message);
    return [];
  }
};
