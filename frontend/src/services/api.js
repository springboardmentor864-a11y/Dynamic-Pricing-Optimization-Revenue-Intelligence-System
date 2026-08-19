import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api",
});

// Request Interceptor: Attach access token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (remember me) or sessionStorage
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Handle token expiration (401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loops on refresh endpoints or login
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/login") &&
      !originalRequest.url.includes("/refresh") &&
      !originalRequest.url.includes("/register")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh_token") || sessionStorage.getItem("refresh_token");
      if (!refreshToken) {
        isRefreshing = false;
        // No refresh token, force logout
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("refresh_token");
        sessionStorage.removeItem("user");
        
        const path = window.location.pathname;
        if (path !== "/login" && path !== "/register" && path !== "/forgot-password" && path !== "/reset-password") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      try {
        // Use a clean axios instance to avoid infinite loop with interceptors
        const response = await axios.post(
          `${api.defaults.baseURL}/refresh`,
          { refresh_token: refreshToken }
        );

        if (response.data && response.data.status === "success" && response.data.token) {
          const newToken = response.data.token;
          
          // Store token in correct storage
          if (localStorage.getItem("token")) {
            localStorage.setItem("token", newToken);
          } else {
            sessionStorage.setItem("token", newToken);
          }

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          isRefreshing = false;
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        // Refresh token expired or invalid, log out
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("refresh_token");
        sessionStorage.removeItem("user");
        
        const path = window.location.pathname;
        if (path !== "/login" && path !== "/register" && path !== "/forgot-password" && path !== "/reset-password") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;