// Firebase Firestore Product Seeder
// This script seeds the Firestore database with sample products
// Run with: node helpers/seed-firebase-products.js

require("dotenv").config();
const { db } = require("./firebase");
const {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} = require("firebase/firestore");

const products = [
  {
    title: "Men's Classic T-Shirt",
    description:
      "A premium cotton t-shirt designed for comfort and style. Features a relaxed fit and durable stitching.",
    price: 29.99,
    salePrice: 19.99,
    category: "men",
    brand: "Urban Essentials",
    totalStock: 100,
    averageReview: 4.5,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop&q=60",
    imagePath: "products/mens-classic-tshirt.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    title: "Men's Slim Fit Jeans",
    description:
      "Classic denim jeans with a modern slim fit cut. Made from stretchable fabric for maximum comfort.",
    price: 59.99,
    salePrice: 49.99,
    category: "men",
    brand: "Denim Co.",
    totalStock: 50,
    averageReview: 4.3,
    image:
      "https://images.unsplash.com/photo-1542272617-08f086302542?w=500&auto=format&fit=crop&q=60",
    imagePath: "products/mens-slim-jeans.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    title: "Women's Summer Floral Dress",
    description:
      "Lightweight and breathable floral dress, perfect for summer outings and casual events.",
    price: 45.0,
    salePrice: 35.0,
    category: "women",
    brand: "Chic Boutique",
    totalStock: 75,
    averageReview: 4.7,
    image:
      "https://images.unsplash.com/photo-1618932260643-ebe4f83b9269?w=500&auto=format&fit=crop&q=60",
    imagePath: "products/womens-floral-dress.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    title: "Elegant Leather Handbag",
    description:
      "Sophisticated leather handbag with ample storage space. A perfect accessory for any outfit.",
    price: 89.99,
    salePrice: 79.99,
    category: "women",
    brand: "Luxe Bags",
    totalStock: 30,
    averageReview: 4.6,
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=60",
    imagePath: "products/elegant-handbag.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    title: "Kids' Puffer Jacket",
    description:
      "Warm and cozy puffer jacket to keep your little ones comfortable during colder days.",
    price: 39.99,
    salePrice: 29.99,
    category: "kids",
    brand: "Kiddo Wear",
    totalStock: 60,
    averageReview: 4.4,
    image:
      "https://images.unsplash.com/photo-1519241047957-bbe4f1f29e71?w=500&auto=format&fit=crop&q=60",
    imagePath: "products/kids-puffer-jacket.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    title: "Kids' Sport Sneakers",
    description:
      "Durable and colorful sneakers designed for active kids. Features non-slip soles.",
    price: 34.99,
    salePrice: 24.99,
    category: "kids",
    brand: "Active Kids",
    totalStock: 80,
    averageReview: 4.5,
    image:
      "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=500&auto=format&fit=crop&q=60",
    imagePath: "products/kids-sport-sneakers.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    title: "Pro Running Shoes",
    description:
      "High-performance running shoes with advanced cushioning technology for athletes.",
    price: 79.99,
    salePrice: 69.99,
    category: "footwear",
    brand: "SportX",
    totalStock: 40,
    averageReview: 4.8,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60",
    imagePath: "products/pro-running-shoes.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    title: "Classic Leather Watch",
    description:
      "Minimalist wristwatch with a genuine leather strap. Water-resistant and durable.",
    price: 120.0,
    salePrice: 99.99,
    category: "accessories",
    brand: "Timeless",
    totalStock: 25,
    averageReview: 4.6,
    image:
      "https://images.unsplash.com/photo-1627123424574-181ce5171c98?w=500&auto=format&fit=crop&q=60",
    imagePath: "products/classic-leather-watch.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    title: "Cotton Baseball Cap",
    description:
      "Adjustable cotton baseball cap. Provides excellent sun protection and style.",
    price: 19.99,
    salePrice: 14.99,
    category: "accessories",
    brand: "Headwear Co.",
    totalStock: 100,
    averageReview: 4.2,
    image:
      "https://images.unsplash.com/photo-1551028919-ac7bcb7d715a?w=500&auto=format&fit=crop&q=60",
    imagePath: "products/cotton-baseball-cap.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    title: "Running Sport Shoes",
    description:
      "Lightweight running shoes perfect for daily jogging and gym sessions.",
    price: 65.0,
    salePrice: 55.0,
    category: "footwear",
    brand: "RunFast",
    totalStock: 45,
    averageReview: 4.4,
    image:
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500&auto=format&fit=crop&q=60",
    imagePath: "products/running-sport-shoes.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function seedFirebaseProducts() {
  try {
    console.log("🔄 Seeding Firebase Firestore with products...\n");

    // Check if products already exist
    const existingProducts = await getDocs(collection(db, "products"));
    if (!existingProducts.empty) {
      console.log(`⚠️  Found ${existingProducts.size} existing products.`);
      console.log("Clearing existing products...\n");

      // Delete all existing products
      const deletePromises = [];
      existingProducts.forEach((docSnapshot) => {
        deletePromises.push(deleteDoc(doc(db, "products", docSnapshot.id)));
      });
      await Promise.all(deletePromises);
      console.log("✅ Cleared existing products\n");
    }

    console.log(`📤 Seeding ${products.length} new products...\n`);

    // Add all products
    const addPromises = products.map((product) =>
      addDoc(collection(db, "products"), product)
    );

    const results = await Promise.all(addPromises);

    console.log("✅ Successfully seeded all products!\n");

    // Summary
    console.log("--- Seed Summary ---");
    console.log(`Total Products Seeded: ${results.length}`);

    const categoryCount = {};
    products.forEach((p) => {
      categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
    });

    console.log("\nCategory Breakdown:");
    Object.entries(categoryCount).forEach(([cat, count]) => {
      console.log(`- ${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${count}`);
    });

    console.log("\nProduct IDs:");
    results.slice(0, 3).forEach((id, index) => {
      console.log(`- ${products[index].title}: ${id.id}`);
    });

    console.log("\n🎉 Firebase seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding Firebase:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    process.exit(1);
  }
}

seedFirebaseProducts();
