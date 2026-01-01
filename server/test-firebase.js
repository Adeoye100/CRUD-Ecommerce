require("dotenv").config();
const { db } = require("./helpers/firebase");

async function testFirebaseConnection() {
  try {
    console.log("Testing Firebase connection...");

    // Test basic Firestore connection
    console.log("Testing Firestore connection...");
    const testDoc = db.collection("test").doc("connection-test");
    await testDoc.set({
      timestamp: new Date().toISOString(),
      status: "connected",
    });

    console.log("✓ Firestore connection successful!");

    // Test reading the document back
    const doc = await testDoc.get();
    if (doc.exists) {
      console.log("✓ Document read successful:", doc.data());
    }

    // Clean up test document
    await testDoc.delete();
    console.log("✓ Test document cleaned up");

    // Test users collection access (this is what's used in auth controller)
    console.log("Testing users collection access...");
    const usersRef = db.collection("users");
    const snapshot = await usersRef.limit(1).get();
    console.log(
      "✓ Users collection accessible, found",
      snapshot.size,
      "documents"
    );

    console.log("\n🎉 All Firebase tests passed successfully!");
  } catch (error) {
    console.error("❌ Firebase connection test failed:");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Full error:", error);
  }
}

testFirebaseConnection();
