import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/",
});

// Attach token for every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["Content-Type"] =
      config.headers["Content-Type"] || "application/json";

    // DEBUG: show outgoing auth header in console (remove in production)
    // This helps confirm the access_token is being attached
    // You will see "AUTH HEADER: Bearer ..." before making the POST
    console.debug("AUTH HEADER:", config.headers.Authorization);

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
