const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAuthAndCart() {
  try {
    console.log('🧪 Testing Authentication and Cart Functionality...\n');

    // Test 1: User Registration
    console.log('1. Testing user registration...');
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      userName: 'TestUser',
      email: 'test@example.com',
      password: 'testpass123'
    });
    console.log('✅ Registration:', registerResponse.data);

    // Test 2: User Login
    console.log('\n2. Testing user login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test@example.com',
      password: 'testpass123'
    }, {
      withCredentials: true
    });
    console.log('✅ Login:', loginResponse.data);
    
    const userId = loginResponse.data.user.id;
    console.log('👤 User ID:', userId);

    // Test 3: Add to Cart
    console.log('\n3. Testing add to cart...');
    const cartResponse = await axios.post(`${API_BASE}/shop/cart/add`, {
      userId: userId,
      productId: '64f8a2b5c9d4e1f2a3b4c5d6', // Sample product ID
      quantity: 1
    });
    console.log('✅ Add to cart:', cartResponse.data);

    // Test 4: Fetch Cart
    console.log('\n4. Testing fetch cart...');
    const fetchCartResponse = await axios.get(`${API_BASE}/shop/cart/get/${userId}`);
    console.log('✅ Fetch cart:', fetchCartResponse.data);

    console.log('\n🎉 All tests passed! Authentication and cart functionality is working.');

  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testAuthAndCart();