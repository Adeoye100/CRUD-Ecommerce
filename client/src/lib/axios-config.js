// Axios configuration with interceptors for authentication
// This file provides automatic token attachment and token refresh handling

import axios from "axios";
import { store } from "@/store/store";
import { logoutUser, checkAuth } from "@/store/auth-slice";

// Create axios instance with default config
const axiosClient = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - attaches authentication token to requests
axiosClient.interceptors.request.use(
  (config) => {
    // Get auth state from Redux store
    const state = store.getState();
    const { isAuthenticated, user } = state.auth;

    // Log request details for debugging (remove in production)
    console.log("🚀 API Request:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      isAuthenticated,
      userId: user?.id,
      timestamp: new Date().toISOString(),
    });

    // If we have a Firebase user, try to get their ID token
    // This is useful for Firebase-protected endpoints
    if (isAuthenticated && user?.id) {
      // Add user ID to headers for server-side verification
      config.headers["X-User-ID"] = user.id;
      config.headers["X-User-Email"] = user.email || "";
    }

    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor - handles errors and token refresh
axiosClient.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging (remove in production)
    console.log("✅ API Response:", {
      url: response.config.url,
      status: response.status,
      timestamp: new Date().toISOString(),
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      console.warn("⚠️ 401 Unauthorized - Attempting to refresh token...");

      try {
        // Try to refresh the authentication state
        const refreshResult = await store.dispatch(checkAuth());

        if (refreshResult.payload?.success) {
          // Token refreshed successfully, retry the original request
          console.log("🔄 Token refreshed, retrying request...");
          return axiosClient(originalRequest);
        } else {
          // Refresh failed, logout user
          console.error("❌ Token refresh failed, logging out...");
          await store.dispatch(logoutUser());
          window.location.href = "/auth/login";
        }
      } catch (refreshError) {
        console.error("❌ Error during token refresh:", refreshError);
        await store.dispatch(logoutUser());
        window.location.href = "/auth/login";
      }
    }

    // Log error details for debugging
    console.error("❌ API Error:", {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString(),
    });

    return Promise.reject(error);
  }
);

// Helper function to get current auth token (for debugging)
export const getAuthHeaders = () => {
  const state = store.getState();
  return {
    isAuthenticated: state.auth.isAuthenticated,
    user: state.auth.user,
  };
};

// Export configured axios instance
export default axiosClient;
