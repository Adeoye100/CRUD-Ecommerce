// Firebase products service
// Handles fetching product metadata and images via server API
// This approach keeps Firebase credentials secure in server/.env

import axios from "axios";

const API_URL = "http://localhost:5000/api/shop/products";

/**
 * Fetches all products from Firebase via server API with optional filtering and sorting
 * @param {Object} options - Filter and sort options
 * @returns {Promise<{success: boolean, data: Array, error: string|null}>}
 */
export async function fetchProductsFromFirebase(options = {}) {
  const { 
    category = null, 
    brand = null, 
    sortBy = "price-lowtohigh",
    page = 1,
    pageSize = 20 
  } = options;

  try {
    const query = new URLSearchParams({
      ...(category && { category: Array.isArray(category) ? category.join(",") : category }),
      ...(brand && { brand: Array.isArray(brand) ? brand.join(",") : brand }),
      sortBy,
      page,
      limit: pageSize
    });

    const result = await axios.get(
      `${API_URL}/firebase/get?${query}`,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Products fetched from Firebase:", result.data);
    return {
      success: true,
      data: result.data.data || [],
      total: result.data.total || 0,
      page: result.data.page || 1,
      totalPages: result.data.totalPages || 1
    };
  } catch (error) {
    console.error("Error fetching products from Firebase:", error);
    
    // Return structured error
    return {
      success: false,
      data: [],
      error: error.response?.data?.message || error.message || "Failed to fetch products"
    };
  }
}

/**
 * Fetches a single product by ID from Firebase via server API
 * @param {string} productId - The product ID
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export async function fetchProductByIdFromFirebase(productId) {
  try {
    const result = await axios.get(
      `${API_URL}/firebase/get/${productId}`,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      data: result.data.data || null,
      error: null
    };
  } catch (error) {
    console.error("Error fetching product from Firebase:", error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || error.message || "Failed to fetch product"
    };
  }
}

/**
 * Fetches image URL - returns the image URL from product data
 * Images are already included in the product data from the server
 * @param {string} imagePath - The image URL or path
 * @returns {Promise<{success: boolean, url: string, error: string|null}>}
 */
export async function fetchImageFromFirebaseStorage(imagePath) {
  try {
    // If it's already a full URL, return it directly
    if (imagePath && imagePath.startsWith("http")) {
      return {
        success: true,
        url: imagePath,
        error: null
      };
    }

    // If no image path, return error
    if (!imagePath) {
      return {
        success: false,
        url: "",
        error: "No image path provided"
      };
    }

    // For storage paths, we would need server-side resolution
    // But in our implementation, the server returns full URLs in product.image
    return {
      success: true,
      url: imagePath,
      error: null
    };
  } catch (error) {
    console.error("Error with image:", error);
    return {
      success: false,
      url: "",
      error: error.message || "Failed to process image"
    };
  }
}

/**
 * Fetches products with their images in a coordinated manner
 * Ensures images are loaded only after product data is available
 * @param {Object} options - Filter and sort options
 * @returns {Promise<{success: boolean, data: Array, errors: Array, error: string|null}>}
 */
export async function fetchProductsWithImages(options = {}) {
  try {
    // First, fetch product metadata from Firestore via server
    const productsResult = await fetchProductsFromFirebase(options);
    
    if (!productsResult.success) {
      return {
        success: false,
        data: [],
        errors: [],
        error: productsResult.error
      };
    }

    // Products already have image URLs from the server
    // Just validate and return them
    const productsWithImages = productsResult.data.map((product) => ({
      ...product,
      image: product.image || "",
      imageError: product.image ? null : "No image available"
    }));

    return {
      success: true,
      data: productsWithImages,
      errors: [],
      error: null
    };
  } catch (error) {
    console.error("Error fetching products with images:", error);
    return {
      success: false,
      data: [],
      errors: [],
      error: error.message || "Failed to fetch products"
    };
  }
}

/**
 * Prefetches images for a list of products
 * In our architecture, images are already full URLs from the server
 * This can be used for browser image prefetching
 * @param {Array} products - Array of product objects
 * @returns {Promise<Array>} - Array of prefetch results
 */
export async function prefetchProductImages(products) {
  const prefetchPromises = products.map(async (product) => {
    if (product.image) {
      try {
        // Create a link element for browser prefetching
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = product.image;
        document.head.appendChild(link);
        
        return { 
          productId: product.id || product._id, 
          url: product.image, 
          success: true 
        };
      } catch (error) {
        return { 
          productId: product.id || product._id, 
          url: product.image, 
          success: false,
          error: error.message
        };
      }
    }
    return { 
      productId: product.id || product._id, 
      url: null, 
      success: false,
      error: "No image URL"
    };
  });

  return Promise.all(prefetchPromises);
}

/**
 * Utility to validate and preload a single image
 * @param {string} url - Image URL to preload
 * @returns {Promise<{success: boolean, url: string}>}
 */
export async function preloadImage(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve({ success: false, url: "" });
      return;
    }

    const img = new Image();
    img.onload = () => {
      resolve({ success: true, url });
    };
    img.onerror = () => {
      resolve({ success: false, url });
    };
    img.src = url;
  });
}

/**
 * Preload multiple images and return load status
 * @param {Array<string>} urls - Array of image URLs
 * @returns {Promise<Array<{url: string, loaded: boolean}>>}
 */
export async function preloadImages(urls) {
  const preloadPromises = urls.map(url => preloadImage(url));
  const results = await Promise.all(preloadPromises);
  
  return results.map((result, index) => ({
    url: urls[index],
    loaded: result.success
  }));
}
