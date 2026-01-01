require("dotenv").config();
const { db } = require("./helpers/firebase");

async function testFirestoreAfterSetup() {
  try {
    console.log("🔍 Testing Firestore connection after setup...");
    
    // Test basic Firestore connection
    console.log("1. Testing basic connection...");
    const testDoc = db.collection("test").doc("connection-test");
    await testDoc.set({
      timestamp: new Date().toISOString(),
      status: "connected",
      message: "Firestore is working!"
    });
    
    console.log("✅ Firestore connection successful!");
    
    // Test reading the document back
    const doc = await testDoc.get();
    if (doc.exists) {
      console.log("✅ Document read successful:", doc.data());
    }
    
    // Clean up test document
    await testDoc.delete();
    console.log("✅ Test document cleaned up");
    
    // Test users collection (for authentication)
    console.log("2. Testing users collection...");
    const usersRef = db.collection("users");
    const snapshot = await usersRef.limit(1).get();
    console.log("✅ Users collection accessible, found", snapshot.size, "documents");
    
    console.log("\n🎉 All Firestore tests passed!");
    console.log("🚀 Your authentication system should now work properly.");
    console.log("\n📝 Next steps:");
    console.log("   1. Run: pnpm dev");
    console.log("   2. Test user registration: POST /api/auth/register");
    console.log("   3. Test user login: POST /api/auth/login");
    
  } catch (error) {
    console.error("❌ Firestore test failed:");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    if (error.code === 5) {
      console.error("\n💡 This means Firestore database is not initialized yet.");
      console.error("📖 Please follow the instructions in FIREBASE_SETUP.md");
    } else {
      console.error("\n🔧 Full error details:");
      console.error(error);
    }
  }
}

testFirestoreAfterSetup();