const { upload, imageUploadUtil } = require("./firebase");

// Re-export the Firebase storage functionality to maintain compatibility
module.exports = { upload, imageUploadUtil };
