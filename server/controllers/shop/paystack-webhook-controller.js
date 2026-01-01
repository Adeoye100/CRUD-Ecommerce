const paystack = require("../../helpers/paystack");
const Order = require("../../models/Order");
const Product = require("../../models/Product");
const Cart = require("../../models/Cart");

// Handle Paystack webhook events
const handlePaystackWebhook = async (req, res) => {
  try {
    // Get the signature from the header
    const signature = req.headers['x-paystack-signature'];
    const payload = JSON.stringify(req.body);

    // Verify webhook signature for security
    if (!paystack.verifyWebhookSignature(signature, payload)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    const { event, data } = req.body;

    console.log('Paystack webhook received:', event);

    // Handle different webhook events
    switch (event) {
      case 'charge.success':
        await handleSuccessfulPayment(data);
        break;
      
      case 'charge.failed':
        await handleFailedPayment(data);
        break;
      
      case 'transfer.success':
        await handleTransferSuccess(data);
        break;
      
      case 'subscription.create':
        await handleSubscriptionCreate(data);
        break;
      
      case 'subscription.disable':
        await handleSubscriptionDisable(data);
        break;
      
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
};

// Handle successful payment
const handleSuccessfulPayment = async (paymentData) => {
  try {
    const { reference, amount, status, customer, channel, fees, paid_at } = paymentData;
    
    // Find the order by payment reference
    const order = await Order.findOne({ paymentId: reference });
    
    if (!order) {
      console.error(`Order not found for reference: ${reference}`);
      return;
    }

    // Update order status
    order.paymentStatus = 'paid';
    order.orderStatus = 'confirmed';
    order.payerId = customer?.email || order.payerId;
    order.orderUpdateDate = new Date();

    await order.save();

    // Update product stock
    for (let item of order.cartItems) {
      let product = await Product.findById(item.productId);
      
      if (product && product.totalStock >= item.quantity) {
        product.totalStock -= item.quantity;
        await product.save();
      }
    }

    // Clear cart if it exists
    if (order.cartId) {
      await Cart.findByIdAndDelete(order.cartId);
    }

    console.log(`Order ${order._id} confirmed via webhook for reference: ${reference}`);
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
};

// Handle failed payment
const handleFailedPayment = async (paymentData) => {
  try {
    const { reference } = paymentData;
    
    // Find the order by payment reference
    const order = await Order.findOne({ paymentId: reference });
    
    if (!order) {
      console.error(`Order not found for reference: ${reference}`);
      return;
    }

    // Update order status
    order.paymentStatus = 'failed';
    order.orderStatus = 'cancelled';
    order.orderUpdateDate = new Date();

    await order.save();

    console.log(`Order ${order._id} marked as failed via webhook for reference: ${reference}`);
  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
};

// Handle transfer success (for refunds or payouts)
const handleTransferSuccess = async (transferData) => {
  console.log('Transfer success:', transferData);
  // Implement transfer success logic if needed
};

// Handle subscription creation
const handleSubscriptionCreate = async (subscriptionData) => {
  console.log('Subscription created:', subscriptionData);
  // Implement subscription logic if needed
};

// Handle subscription disable
const handleSubscriptionDisable = async (subscriptionData) => {
  console.log('Subscription disabled:', subscriptionData);
  // Implement subscription logic if needed
};

// Verify payment endpoint (for manual verification)
const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    const verificationResult = await paystack.verifyPayment(reference);

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        error: verificationResult.error,
      });
    }

    // Find the order by reference
    const order = await Order.findOne({ paymentId: reference });

    res.status(200).json({
      success: true,
      message: 'Payment verified',
      data: {
        payment: verificationResult,
        order: order,
      },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message,
    });
  }
};

module.exports = {
  handlePaystackWebhook,
  verifyPayment,
};