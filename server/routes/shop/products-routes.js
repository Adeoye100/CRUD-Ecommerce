const express = require("express");

const {
  getFilteredProducts,
  getProductDetails,
  getFilteredProductsFromFirebase,
  getProductDetailsFromFirebase,
} = require("../../controllers/shop/products-controller");
const { authMiddleware } = require("../../controllers/auth/auth-controller");

const router = express.Router();

// MongoDB-based endpoints (fallback) - no authentication required
router.get("/get", getFilteredProducts);
router.get("/get/:id", getProductDetails);

// Firebase-based endpoints (primary) - requires authentication
router.get("/firebase/get", authMiddleware, getFilteredProductsFromFirebase);
router.get("/firebase/get/:id", authMiddleware, getProductDetailsFromFirebase);

module.exports = router;
