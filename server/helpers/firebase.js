const admin = require("firebase-admin");
const multer = require("multer");

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const db = admin.firestore();
const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);

const imageUploadUtil = (file, folderName) => {
  return new Promise((resolve, reject) => {
    const fileName = `${folderName}/${Date.now()}-${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    blobStream.on("error", (error) => {
      reject(error);
    });

    blobStream.on("finish", () => {
      // Construct the public URL
      // Note: bucket.name returns just the bucket name, we need to append .firebasestorage.app
      const bucketName = process.env.FIREBASE_STORAGE_BUCKET || bucket.name;
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(
        bucketName
      )}/o/${encodeURIComponent(fileName)}?alt=media`;
      resolve({ url: publicUrl });
    });

    blobStream.end(file.buffer);
  });
};

module.exports = { db, imageUploadUtil, upload };
