const { db, imageUploadUtil } = require("../../helpers/firebase");

const addFeatureImage = async (req, res) => {
  try {
    let imageUrl;

    if (req.file) {
      // Upload file to Firebase Storage
      const uploadResult = await imageUploadUtil(req.file, "features");
      imageUrl = uploadResult.url;
    } else if (req.body.image) {
      // Use provided image URL directly
      imageUrl = req.body.image;
    } else {
      return res.status(400).json({
        success: false,
        message: "No image provided",
      });
    }

    console.log(imageUrl, "imageUrl");

    const newFeature = {
      image: imageUrl,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("features").add(newFeature);

    res.status(201).json({
      success: true,
      data: { id: docRef.id, ...newFeature },
    });
  } catch (e) {
    console.error("Feature image upload error:", e);
    res.status(500).json({
      success: false,
      message: "Some error occured: " + e.message,
    });
  }
};

const getFeatureImages = async (req, res) => {
  try {
    const snapshot = await db.collection("features").get();
    const images = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      success: true,
      data: images,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

module.exports = { addFeatureImage, getFeatureImages };
