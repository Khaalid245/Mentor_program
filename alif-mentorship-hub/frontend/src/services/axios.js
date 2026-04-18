import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/",
});

// ─── Request Interceptor ─────────────────────────────────────────────────────
// Attach the access token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Only set Content-Type for non-FormData requests
    // For FormData (file uploads), let the browser set it with the correct boundary
    if (!config.headers["Content-Type"] && !(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Token Refresh State ─────────────────────────────────────────────────────
// Prevents multiple simultaneous refresh calls when several requests 401 at once
let isRefreshing = false;
let pendingQueue = []; // requests waiting for the new token

const resolvePending = (newToken) => {
  pendingQueue.forEach((cb) => cb(newToken));
  pendingQueue = [];
};

const rejectPending = (error) => {
  pendingQueue.forEach((cb) => cb(null, error));
  pendingQueue = [];
};

// ─── Clear session and redirect to login ─────────────────────────────────────
const forceLogout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_role");
  localStorage.removeItem("username");
  // Only redirect if not already on login page
  if (!window.location.pathname.includes("/login")) {
    window.location.href = "/login";
  }
};

// ─── Response Interceptor ────────────────────────────────────────────────────
// Silently refresh the access token on 401, then retry the original request
api.interceptors.response.use(
  (response) => response, // pass successful responses straight through

  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 errors, and only once per request (avoid infinite retry loop)
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refresh_token");

    // No refresh token stored — session is dead, send to login
    if (!refreshToken) {
      forceLogout();
      return Promise.reject(error);
    }

    // If a refresh is already in progress, queue this request until it resolves
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((newToken, err) => {
          if (err) return reject(err);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
      });
    }

    // Mark this request so it won't retry again if the refresh itself 401s
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Use plain axios here — not `api` — to avoid triggering this interceptor again
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/"}auth/refresh/`,
        { refresh: refreshToken }
      );

      const newAccessToken = res.data.access;
      localStorage.setItem("access_token", newAccessToken);

      // Update the default header for all future requests
      api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

      // Resolve all queued requests with the new token
      resolvePending(newAccessToken);

      // Retry the original failed request
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh token is expired or invalid
      rejectPending(refreshError);
      // Only force logout on GET requests (background data fetching)
      // For POST/PUT/PATCH, let the calling code handle the error
      if (originalRequest.method === "get") {
        forceLogout();
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
