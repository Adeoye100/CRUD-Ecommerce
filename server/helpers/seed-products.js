const mongoose = require("mongoose");
require("dotenv").config();

// Define the Product schema to match the application's data structure
// Note: This schema mirrors standard e-commerce fields.
// If your server/models/Product.js has different required fields, adjust accordingly.
const ProductSchema = new mongoose.Schema(
  {
    image: String,
    title: String,
    description: String,
    price: Number,
    salePrice: Number,
    category: String,
    brand: String,
    totalStock: Number,
    averageReview: Number,
  },
  { timestamps: true }
);

// Prevent OverwriteModelError if model is already compiled
const Product =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);

const products = [
  {
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop&q=60",
    title: "Men's Classic T-Shirt",
    description:
      "A premium cotton t-shirt designed for comfort and style. Features a relaxed fit and durable stitching.",
    price: 29.99,
    salePrice: 19.99,
    category: "men",
    brand: "Urban Essentials",
    totalStock: 100,
    averageReview: 0,
  },
  {
    image:
      "https://images.unsplash.com/photo-1542272617-08f086302542?w=500&auto=format&fit=crop&q=60",
    title: "Men's Slim Fit Jeans",
    description:
      "Classic denim jeans with a modern slim fit cut. Made from stretchable fabric for maximum comfort.",
    price: 59.99,
    salePrice: 49.99,
    category: "men",
    brand: "Denim Co.",
    totalStock: 50,
    averageReview: 0,
  },
  {
    image:
      "https://images.unsplash.com/photo-1618932260643-ebe4f83b9269?w=500&auto=format&fit=crop&q=60",
    title: "Women's Summer Floral Dress",
    description:
      "Lightweight and breathable floral dress, perfect for summer outings and casual events.",
    price: 45.0,
    salePrice: 35.0,
    category: "women",
    brand: "Chic Boutique",
    totalStock: 75,
    averageReview: 0,
  },
  {
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=60",
    title: "Elegant Leather Handbag",
    description:
      "Sophisticated leather handbag with ample storage space. A perfect accessory for any outfit.",
    price: 89.99,
    salePrice: 79.99,
    category: "women",
    brand: "Luxe Bags",
    totalStock: 30,
    averageReview: 0,
  },
  {
    image:
      "https://images.unsplash.com/photo-1519241047957-bbe4f1f29e71?w=500&auto=format&fit=crop&q=60",
    title: "Kids' Puffer Jacket",
    description:
      "Warm and cozy puffer jacket to keep your little ones comfortable during colder days.",
    price: 39.99,
    salePrice: 29.99,
    category: "kids",
    brand: "Kiddo Wear",
    totalStock: 60,
    averageReview: 0,
  },
  {
    image:
      "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=500&auto=format&fit=crop&q=60",
    title: "Kids' Sport Sneakers",
    description:
      "Durable and colorful sneakers designed for active kids. Features non-slip soles.",
    price: 34.99,
    salePrice: 24.99,
    category: "kids",
    brand: "Active Kids",
    totalStock: 80,
    averageReview: 0,
  },
  {
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60",
    title: "Pro Running Shoes",
    description:
      "High-performance running shoes with advanced cushioning technology for athletes.",
    price: 79.99,
    salePrice: 69.99,
    category: "footwear",
    brand: "SportX",
    totalStock: 40,
    averageReview: 0,
  },
  {
    image:
      "https://images.unsplash.com/photo-1627123424574-181ce5171c98?w=500&auto=format&fit=crop&q=60",
    title: "Classic Leather Watch",
    description:
      "Minimalist wristwatch with a genuine leather strap. Water-resistant and durable.",
    price: 120.0,
    salePrice: 99.99,
    category: "accessories",
    brand: "Timeless",
    totalStock: 25,
    averageReview: 0,
  },
  {
    image:
      "https://images.unsplash.com/photo-1551028919-ac7bcb7d715a?w=500&auto=format&fit=crop&q=60",
    title: "Cotton Baseball Cap",
    description:
      "Adjustable cotton baseball cap. Provides excellent sun protection and style.",
    price: 19.99,
    salePrice: 14.99,
    category: "accessories",
    brand: "Headwear Co.",
    totalStock: 100,
    averageReview: 0,
  },
  {
    image:
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500&auto=format&fit=crop&q=60",
    title: "Running Sport Shoes",
    description:
      "Lightweight running shoes perfect for daily jogging and gym sessions.",
    price: 65.0,
    salePrice: 55.0,
    category: "footwear",
    brand: "RunFast",
    totalStock: 45,
    averageReview: 0,
  },
];

const seedDatabase = async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Optional: Uncomment to clear existing products before seeding
    // console.log("🗑️ Clearing existing products...");
    // await Product.deleteMany({});

    console.log(`📤 Uploading ${products.length} products...`);
    const result = await Product.insertMany(products);

    console.log("\n✅ Upload Complete!");

    // Verification Summary
    console.log("\n--- Product Upload Summary ---");
    console.log(`Total Products Uploaded: ${result.length}`);

    const categoryCount = {};
    result.forEach((p) => {
      categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
    });

    console.log("\nCategory Breakdown:");
    Object.entries(categoryCount).forEach(([cat, count]) => {
      console.log(`- ${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${count}`);
    });

    console.log("\nSample Product IDs:");
    result.slice(0, 3).forEach((p) => console.log(`- ${p.title}: ${p._id}`));

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
