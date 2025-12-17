import api from "../config/api";


export const getPaymentHistory = async () => {
  const res = await api.get("/payments/history");
  return res.data;
};
