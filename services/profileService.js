import api from "../config/api";

export async function fetchProfile() {
  const res = await api.get("/profile");
  return res.data;
}
