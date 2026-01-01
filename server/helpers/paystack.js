const axios = require('axios');

// Paystack API configuration
const PAYSTACK_API_BASE = 'https://api.paystack.co';

// Initialize Paystack payment
const initializePayment = async (paymentData) => {
  try {
    const {
      email,
      amount, // Amount in Naira
      reference,
      currency = process.env.PAYSTACK_CURRENCY || 'NGN',
      callback_url = process.env.PAYSTACK_CALLBACK_URL,
      metadata = {}
    } = paymentData;

    // Convert amount to kobo (Paystack uses kobo, not naira)
    const amountInKobo = Math.round(amount * 100);

    const payload = {
      email,
      amount: amountInKobo,
      reference,
      currency,
      callback_url,
      metadata
    };

    const response = await axios.post(
      `${PAYSTACK_API_BASE}/transaction/initialize`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error('Paystack initialization error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      data: error.response?.data?.data || null
    };
  }
};

// Verify Paystack payment
const verifyPayment = async (reference) => {
  try {
    const response = await axios.get(
      `${PAYSTACK_API_BASE}/transaction/verify/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const paymentData = response.data.data;

    return {
      success: true,
      data: paymentData,
      message: response.data.message,
      status: paymentData.status,
      gateway_response: paymentData.gateway_response,
      paid_at: paymentData.paid_at,
      created_at: paymentData.created_at,
      channel: paymentData.channel,
      currency: paymentData.currency,
      fees: paymentData.fees,
      amount: paymentData.amount / 100, // Convert back from kobo to naira
      customer: paymentData.customer,
      authorization: paymentData.authorization
    };
  } catch (error) {
    console.error('Paystack verification error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: 'failed'
    };
  }
};

// Verify webhook signature (for webhook security)
const verifyWebhookSignature = (signature, payload) => {
  const crypto = require('crypto');
  const secret = process.env.PAYSTACK_SECRET_KEY;
  
  const hash = crypto
    .createHmac('sha512', secret)
    .update(payload, 'utf8')
    .digest('hex');

  return hash === signature;
};

// List transactions
const listTransactions = async (perPage = 50, page = 1) => {
  try {
    const response = await axios.get(
      `${PAYSTACK_API_BASE}/transaction`,
      {
        params: {
          per_page: perPage,
          page: page
        },
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      data: response.data.data,
      meta: response.data.meta,
      message: response.data.message
    };
  } catch (error) {
    console.error('Paystack list transactions error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

// Get transaction details
const getTransaction = async (id) => {
  try {
    const response = await axios.get(
      `${PAYSTACK_API_BASE}/transaction/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error('Paystack get transaction error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

module.exports = {
  initializePayment,
  verifyPayment,
  verifyWebhookSignature,
  listTransactions,
  getTransaction
};