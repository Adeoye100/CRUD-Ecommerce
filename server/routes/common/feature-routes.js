const express = require("express");
const multer = require("multer");

const {
  addFeatureImage,
  getFeatureImages,
} = require("../../controllers/common/feature-controller");

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.post("/add", upload.single("image"), addFeatureImage);
router.get("/get", getFeatureImages);

module.exports = router;
