import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { debugAuthStateAsync, debugAuthFlow } from "@/lib/auth-debug";

const initialState = {
  isLoading: false,
  productList: [],
  productDetails: null,
  error: null,
  firebaseError: null,
  authError: null,
};

const API_URL = "http://localhost:5000/api/shop/products";

/**
 * Async thunk to fetch filtered products from Firebase
 * First authenticates the user, then fetches product data
 */
export const fetchAllFilteredProducts = createAsyncThunk(
  "/products/fetchAllProducts",
  async ({ filterParams, sortParams }, { rejectWithValue, getState }) => {
    try {
      console.log("Fetching products from Firebase...");
      
      // Debug: Check auth state before making request
      const authState = getState().auth;
      console.log("Auth state before request:", {
        isAuthenticated: authState.isAuthenticated,
        userId: authState.user?.id,
        userEmail: authState.user?.email,
      });

      // If not authenticated, try to debug and fix
      if (!authState.isAuthenticated) {
        console.warn("⚠️ User not authenticated, running auth debug...");
        await debugAuthFlow();
      }

      const query = new URLSearchParams({
        ...filterParams,
        sortBy: sortParams,
      });

      const result = await axios.get(
        `${API_URL}/firebase/get?${query}`,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            "X-User-ID": authState.user?.id || "",
            "X-User-Email": authState.user?.email || "",
          },
        }
      );

      console.log("Products fetched successfully:", result.data);
      return result.data;
    } catch (error) {
      console.error("Error fetching products:", error);
      
      // Debug: Log detailed error info
      console.error("Error details:", {
        status: error.response?.status,
        message: error.response?.data?.message,
        url: error.config?.url,
        method: error.config?.method,
      });

      // Handle different error types
      if (error.response) {
        const { status, data } = error.response;

        if (status === 401) {
          // Run auth debug to understand why auth failed
          await debugAuthStateAsync();
          
          return rejectWithValue({
            type: "AUTH_ERROR",
            message: data.message || "Authentication required. Please log in.",
            code: "UNAUTHORIZED",
          });
        }

        if (status === 404) {
          return rejectWithValue({
            type: "NOT_FOUND",
            message: "Products not found",
            code: "PRODUCTS_NOT_FOUND",
          });
        }

        if (status === 500) {
          return rejectWithValue({
            type: "SERVER_ERROR",
            message: data.error || "Server error while fetching products",
            code: "SERVER_ERROR",
          });
        }

        return rejectWithValue({
          type: "API_ERROR",
          message: data.message || "Failed to fetch products",
          code: "API_ERROR",
        });
      }

      if (error.code === "ECONNABORTED") {
        return rejectWithValue({
          type: "NETWORK_ERROR",
          message: "Request timeout. Please check your connection.",
          code: "TIMEOUT",
        });
      }

      return rejectWithValue({
        type: "NETWORK_ERROR",
        message: error.message || "Network error occurred",
        code: "NETWORK_ERROR",
      });
    }
  }
);

/**
 * Async thunk to fetch product details from Firebase
 */
export const fetchProductDetails = createAsyncThunk(
  "/products/fetchProductDetails",
  async (id, { rejectWithValue }) => {
    try {
      console.log("Fetching product details from Firebase:", id);

      const result = await axios.get(
        `${API_URL}/firebase/get/${id}`,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Product details fetched:", result.data);
      return result.data;
    } catch (error) {
      console.error("Error fetching product details:", error);

      if (error.response) {
        const { status, data } = error.response;

        if (status === 401) {
          return rejectWithValue({
            type: "AUTH_ERROR",
            message: "Authentication required to view product details",
            code: "UNAUTHORIZED",
          });
        }

        if (status === 404) {
          return rejectWithValue({
            type: "NOT_FOUND",
            message: "Product not found",
            code: "PRODUCT_NOT_FOUND",
          });
        }

        return rejectWithValue({
          type: "SERVER_ERROR",
          message: data.message || "Failed to fetch product details",
          code: "SERVER_ERROR",
        });
      }

      return rejectWithValue({
        type: "NETWORK_ERROR",
        message: error.message || "Network error occurred",
        code: "NETWORK_ERROR",
      });
    }
  }
);

/**
 * Fallback thunk to fetch products from MongoDB (original implementation)
 */
export const fetchProductsFromMongoDB = createAsyncThunk(
  "/products/fetchFromMongoDB",
  async ({ filterParams, sortParams }, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams({
        ...filterParams,
        sortBy: sortParams,
      });

      const result = await axios.get(
        `${API_URL}/get?${query}`
      );

      return result.data;
    } catch (error) {
      console.error("Error fetching from MongoDB:", error);
      return rejectWithValue({
        type: "DATABASE_ERROR",
        message: error.response?.data?.message || "Failed to fetch products",
        code: "DATABASE_ERROR",
      });
    }
  }
);

const shoppingProductSlice = createSlice({
  name: "shoppingProducts",
  initialState,
  reducers: {
    setProductDetails: (state) => {
      state.productDetails = null;
    },
    clearProductErrors: (state) => {
      state.error = null;
      state.firebaseError = null;
      state.authError = null;
    },
    clearProductList: (state) => {
      state.productList = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all filtered products
      .addCase(fetchAllFilteredProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.firebaseError = null;
        state.authError = null;
      })
      .addCase(fetchAllFilteredProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productList = action.payload.data || [];
        state.error = null;
      })
      .addCase(fetchAllFilteredProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.productList = [];
        state.error = action.payload;
        
        // Categorize error for UI handling
        if (action.payload?.type === "AUTH_ERROR") {
          state.authError = action.payload;
        } else if (action.payload?.type === "NOT_FOUND") {
          state.firebaseError = action.payload;
        } else {
          state.error = action.payload;
        }
      })
      // Fetch product details
      .addCase(fetchProductDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productDetails = action.payload.data;
        state.error = null;
      })
      .addCase(fetchProductDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.productDetails = null;
        state.error = action.payload;
      })
      // MongoDB fallback
      .addCase(fetchProductsFromMongoDB.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductsFromMongoDB.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productList = action.payload.data || [];
        state.error = null;
      })
      .addCase(fetchProductsFromMongoDB.rejected, (state, action) => {
        state.isLoading = false;
        state.productList = [];
        state.error = action.payload;
      });
  },
});

export const { setProductDetails, clearProductErrors, clearProductList } =
  shoppingProductSlice.actions;

export default shoppingProductSlice.reducer;
