const express = require("express");
const { handlePaystackWebhook, verifyPayment } = require("../../controllers/shop/paystack-webhook-controller");

const router = express.Router();

// Paystack webhook endpoint
router.post("/webhook", handlePaystackWebhook);

// Manual payment verification endpoint
router.get("/verify/:reference", verifyPayment);

module.exports = router;