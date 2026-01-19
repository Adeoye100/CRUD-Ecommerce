const Product = require("../../models/Product");
const { db } = require("../../helpers/firebase");

// Import additional Firestore functions from firebase-admin
const {
  collection,
  getDocs,
  getDoc,
  doc,
  orderBy,
  limit,
  where,
  query
} = require("firebase-admin/firestore");

/**
 * Authentication middleware helper
 * Verifies user is authenticated via session/JWT
 */
const verifyAuthentication = (req, res) => {
  if (!req.user || !req.user.id) {
    return { authenticated: false, error: "User not authenticated" };
  }
  return { authenticated: true, userId: req.user.id };
};

/**
 * Fetches products from Firestore with proper authentication
 * Uses firebase-admin for server-side Firestore operations
 */
const getFilteredProductsFromFirebase = async (req, res) => {
  try {
    // Verify authentication first
    const authCheck = verifyAuthentication(req, res);
    if (!authCheck.authenticated) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to access products",
        error: authCheck.error
      });
    }

    const { 
      category = [], 
      brand = [], 
      sortBy = "price-lowtohigh",
      page = 1,
      limit: pageLimit = 20 
    } = req.query;

    // Parse query parameters
    const categories = typeof category === "string" ? category.split(",").filter(Boolean) : category;
    const brands = typeof brand === "string" ? brand.split(",").filter(Boolean) : brand;

    // Build Firestore query using firebase-admin
    let productsQuery = collection(db, "products");
    const constraints = [];

    // Apply category filter
    if (categories.length > 0) {
      // Note: Firestore "in" queries support up to 10 values
      const validCategories = categories.slice(0, 10);
      constraints.push(where("category", "in", validCategories));
    }

    // Apply brand filter
    if (brands.length > 0) {
      const validBrands = brands.slice(0, 10);
      constraints.push(where("brand", "in", validBrands));
    }

    // Apply sorting
    switch (sortBy) {
      case "price-lowtohigh":
        constraints.push(orderBy("price", "asc"));
        break;
      case "price-hightolow":
        constraints.push(orderBy("price", "desc"));
        break;
      case "title-atoz":
        constraints.push(orderBy("title", "asc"));
        break;
      case "title-ztoa":
        constraints.push(orderBy("title", "desc"));
        break;
      default:
        constraints.push(orderBy("price", "asc"));
    }

    // Apply pagination limits
    constraints.push(limit(parseInt(pageLimit) * parseInt(page)));

    const q = query(...constraints);
    const querySnapshot = await getDocs(q);

    const products = [];
    querySnapshot.forEach((docSnapshot) => {
      products.push({
        id: docSnapshot.id,
        _id: docSnapshot.id, // For compatibility with existing frontend
        ...docSnapshot.data()
      });
    });

    // Handle client-side pagination
    const startIndex = (parseInt(page) - 1) * parseInt(pageLimit);
    const endIndex = startIndex + parseInt(pageLimit);
    const paginatedProducts = products.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: paginatedProducts,
      total: products.length,
      page: parseInt(page),
      totalPages: Math.ceil(products.length / parseInt(pageLimit))
    });
  } catch (error) {
    console.error("Error fetching products from Firebase:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message
    });
  }
};

/**
 * Fetches a single product from Firestore using firebase-admin
 */
const getProductDetailsFromFirebase = async (req, res) => {
  try {
    // Verify authentication first
    const authCheck = verifyAuthentication(req, res);
    if (!authCheck.authenticated) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to access product details",
        error: authCheck.error
      });
    }

    const { id } = req.params;

    const productDoc = await getDoc(doc(db, "products", id));

    if (!productDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: productDoc.id,
        _id: productDoc.id,
        ...productDoc.data()
      }
    });
  } catch (error) {
    console.error("Error fetching product from Firebase:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product details",
      error: error.message
    });
  }
};

/**
 * Original MongoDB-based product fetching (fallback)
 */
const getFilteredProducts = async (req, res) => {
  try {
    const { category = [], brand = [], sortBy = "price-lowtohigh" } = req.query;

    let filters = {};

    if (category.length) {
      filters.category = { $in: category.split(",") };
    }

    if (brand.length) {
      filters.brand = { $in: brand.split(",") };
    }

    let sort = {};

    switch (sortBy) {
      case "price-lowtohigh":
        sort.price = 1;
        break;
      case "price-hightolow":
        sort.price = -1;
        break;
      case "title-atoz":
        sort.title = 1;
        break;
      case "title-ztoa":
        sort.title = -1;
        break;
      default:
        sort.price = 1;
        break;
    }

    const products = await Product.find(filters).sort(sort);

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured",
    });
  }
};

const getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found!",
      });

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured",
    });
  }
};

module.exports = { 
  getFilteredProducts, 
  getProductDetails,
  getFilteredProductsFromFirebase,
  getProductDetailsFromFirebase
};
