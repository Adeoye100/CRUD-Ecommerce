const paystack = require("../../helpers/paystack");
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");

const createOrder = async (req, res) => {
  try {
    const {
      userId,
      cartItems,
      addressInfo,
      orderStatus,
      paymentMethod,
      paymentStatus,
      totalAmount,
      orderDate,
      orderUpdateDate,
      cartId,
      customerEmail,
    } = req.body;

    // Generate a unique reference for the transaction
    const reference = `order_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Prepare metadata for Paystack
    const metadata = {
      userId,
      cartId,
      orderItems: cartItems.map((item) => ({
        productId: item.productId,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
      })),
      addressInfo,
      orderStatus,
      paymentMethod,
      orderDate,
      orderUpdateDate,
    };

    // Initialize Paystack payment
    const paymentResult = await paystack.initializePayment({
      email: customerEmail,
      amount: totalAmount,
      reference,
      currency: process.env.PAYSTACK_CURRENCY || "NGN",
      callback_url: process.env.PAYSTACK_CALLBACK_URL,
      metadata,
    });

    if (!paymentResult.success) {
      return res.status(500).json({
        success: false,
        message: "Error while creating payment",
        error: paymentResult.error,
      });
    }

    // Create order in database
    const newlyCreatedOrder = new Order({
      userId,
      cartId,
      cartItems,
      addressInfo,
      orderStatus,
      paymentMethod,
      paymentStatus: "pending", // Initially pending
      totalAmount,
      orderDate,
      orderUpdateDate,
      paymentId: paymentResult.data.reference,
      payerId: customerEmail, // Using email as payer ID for Paystack
    });

    await newlyCreatedOrder.save();

    // Return authorization URL for frontend redirect
    res.status(201).json({
      success: true,
      authorizationURL: paymentResult.data.authorization_url,
      accessCode: paymentResult.data.access_code,
      reference: paymentResult.data.reference,
      orderId: newlyCreatedOrder._id,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const capturePayment = async (req, res) => {
  try {
    const { reference, orderId } = req.body;

    let order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order can not be found",
      });
    }

    // Verify payment with Paystack using the reference
    const verificationResult = await paystack.verifyPayment(reference);

    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
        error: verificationResult.error,
      });
    }

    // Check if payment was successful
    if (verificationResult.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: "Payment was not successful",
        status: verificationResult.status,
        gateway_response: verificationResult.gateway_response,
      });
    }

    // Update order status
    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paymentId = verificationResult.data.reference;
    order.payerId = verificationResult.customer?.email || order.payerId;
    order.orderUpdateDate = new Date();

    // Update product stock
    for (let item of order.cartItems) {
      let product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.title}`,
        });
      }

      if (product.totalStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for product: ${product.title}`,
          availableStock: product.totalStock,
          requestedQuantity: item.quantity,
        });
      }

      product.totalStock -= item.quantity;
      await product.save();
    }

    // Clear cart
    const getCartId = order.cartId;
    await Cart.findByIdAndDelete(getCartId);

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order confirmed",
      data: order,
      paymentInfo: {
        status: verificationResult.status,
        amount: verificationResult.amount,
        currency: verificationResult.currency,
        fees: verificationResult.fees,
        paid_at: verificationResult.paid_at,
        channel: verificationResult.channel,
      },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No orders found!",
      });
    }

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

module.exports = {
  createOrder,
  capturePayment,
  getAllOrdersByUser,
  getOrderDetails,
};
