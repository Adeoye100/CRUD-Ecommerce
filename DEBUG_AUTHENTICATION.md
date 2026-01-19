# Firebase Authentication Debug Guide

This document provides comprehensive troubleshooting steps for the 401 Unauthorized error when fetching products from Firebase in the React application.

## Quick Diagnosis

Run this in your browser console when the error occurs:

```javascript
import { debugAuthFlow, authHealthCheck } from '@/lib/auth-debug';

// Full auth flow debug
await debugAuthFlow();

// Quick health check
await authHealthCheck();
```

---

## Root Cause Analysis

### The Issue
The Firebase product endpoints (`/api/shop/products/firebase/get`) were missing the `authMiddleware` that validates the authentication token. The controller checks for `req.user.id` but no middleware was populating it.

### The Fix
Added `authMiddleware` to the Firebase routes in [`server/routes/shop/products-routes.js`](server/routes/shop/products-routes.js):

```javascript
router.get("/firebase/get", authMiddleware, getFilteredProductsFromFirebase);
router.get("/firebase/get/:id", authMiddleware, getProductDetailsFromFirebase);
```

---

## Comprehensive Troubleshooting Steps

### 1. Verify Firebase Authentication Token is Properly Attached

**Check Cookie Token:**
```javascript
// In browser console
console.log("Cookies:", document.cookie);
console.log("Has token:", document.cookie.includes("token="));
```

**Debug Auth State:**
```javascript
import { debugAuthState } from '@/lib/auth-debug';
debugAuthState();
```

**Expected Output:**
```
🔐 Authentication Debug Info
📊 Redux Auth State: { isAuthenticated: true, user: {...} }
```

### 2. Check Firebase Security Rules

The server uses Firebase Admin SDK, so Firestore rules don't apply. However, for client-side access:

```javascript
// server/firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Server-side operations use Admin SDK (no rules apply)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 3. Examine Authentication State Flow

**Check Redux Auth Slice:**
```javascript
import { store } from '@/store/store';
const state = store.getState().auth;
console.log("Auth state:", state);
```

**Expected State:**
```javascript
{
  isAuthenticated: true,
  isLoading: false,
  user: {
    id: "user-uid",
    email: "user@example.com",
    userName: "sangam",
    role: "user"
  }
}
```

### 4. Review Axios Interceptor Configuration

The [`client/src/lib/axios-config.js`](client/src/lib/axios-config.js) file provides:
- Automatic token attachment via headers
- 401 error handling with automatic token refresh
- Detailed request/response logging

**Key Features:**
```javascript
// Request interceptor adds user headers
config.headers["X-User-ID"] = user.id;
config.headers["X-User-Email"] = user.email;

// Response interceptor handles 401
if (error.response?.status === 401) {
  await store // Refresh token
.dispatch(checkAuth());  return axiosClient(originalRequest); // Retry
}
```

### 5. Ensure Firebase Auth Instance is Initialized

```javascript
import { getFirebaseAuth } from '@/lib/firebase-auth';
const auth = getFirebaseAuth();
console.log("Firebase Auth:", auth ? "Initialized" : "Not initialized");
```

### 6. Validate User Claims and Permissions

```javascript
import { getIdTokenWithClaims, hasRole } from '@/lib/firebase-auth';

const tokenResult = await getIdTokenWithClaims();
console.log("Claims:", tokenResult.claims);

const isAdmin = await hasRole("admin");
console.log("Is admin:", isAdmin);
```

### 7. Check Server Token Validation

**Server-side Middleware:**
```javascript
// server/controllers/auth/auth-controller.js
const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorised user!",
    });
  }

  try {
    const decoded = jwt.verify(token, "CLIENT_SECRET_KEY");
    req.user = decoded;  // This populates req.user for controllers
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Unauthorised user!",
    });
  }
};
```

**Test Server Validation:**
```javascript
import { testServerTokenValidation } from '@/lib/auth-debug';
await testServerTokenValidation();
```

### 8. Review CORS Configuration

**Server CORS Setup:**
```javascript
// server/server.js
app.use(cors({
  origin: "http://localhost:5173",  // Vite default port
  methods: ["GET", "POST", "DELETE", "PUT"],
  credentials: true,  // Important for cookies
}));
```

**Client Request Config:**
```javascript
// Must include withCredentials: true
axios.get(url, {
  withCredentials: true,  // Sends cookies
  headers: {
    "Content-Type": "application/json",
  },
});
```

---

## Code Examples

### Getting Current User ID Token

```javascript
import { getCurrentUserIdToken } from '@/lib/firebase-auth';

async function getToken() {
  const token = await getCurrentUserIdToken();
  if (token) {
    console.log("Token:", token.substring(0, 20) + "...");
    return token;
  }
  console.error("No user logged in");
  return null;
}
```

### Configuring Axios Interceptors

```javascript
import axios from 'axios';
import { store } from '@/store/store';
import { checkAuth, logoutUser } from '@/store/auth-slice';

const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

// Request interceptor
axiosClient.interceptors.request.use((config) => {
  const state = store.getState().auth;
  if (state.isAuthenticated && state.user) {
    config.headers['X-User-ID'] = state.user.id;
  }
  return config;
});

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshResult = await store.dispatch(checkAuth());
      if (!refreshResult.payload?.success) {
        await store.dispatch(logoutUser());
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);
```

### Handling Token Expiration and Refresh

```javascript
import { isTokenExpired, refreshToken } from '@/lib/firebase-auth';

async function ensureValidToken() {
  const expired = await isTokenExpired(300); // 5 min buffer
  if (expired) {
    console.log("Token expired, refreshing...");
    const newToken = await refreshToken();
    if (newToken) {
      console.log("Token refreshed successfully");
      return newToken;
    }
  }
  return null;
}
```

### Firebase Security Rules for Product Data

```javascript
// firestore.rules (for client-side access - not used by server Admin SDK)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read access to products
    match /products/{productId} {
      allow read: if true;  // Publicly readable
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    // User-specific data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin-only data
    match /admin/{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.role == 'admin';
    }
  }
}
```

---

## Debugging Steps Checklist

### Step 1: Verify Auth State
```javascript
import { debugAuthState } from '@/lib/auth-debug';
debugAuthState();
```

### Step 2: Check Cookie
```javascript
console.log("Cookie:", document.cookie);
console.log("Token present:", document.cookie.includes("token="));
```

### Step 3: Test Server Validation
```javascript
import { testServerTokenValidation } from '@/lib/auth-debug';
await testServerTokenValidation();
```

### Step 4: Run Full Auth Flow Debug
```javascript
import { debugAuthFlow } from '@/lib/auth-debug';
await debugAuthFlow();
```

### Step 5: Check Health
```javascript
import { authHealthCheck } from '@/lib/auth-debug';
await authHealthCheck();
```

### Step 6: Verify Server Middleware
Check browser network tab for `/api/auth/check-auth` response:
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "...",
    "role": "user"
  }
}
```

### Step 7: Check Server Logs
Look for these logs in server console:
- `✅ User signed in`
- `GET /api/shop/products/firebase/get` with 200 status
- No 401 errors

---

## Common Issues and Solutions

### Issue: Token Not Sent to Server
**Symptom:** 401 error despite being logged in
**Solution:** Ensure `withCredentials: true` is set in axios config

### Issue: Cookie Not Persisting
**Symptom:** Auth works initially but fails on refresh
**Solution:** Check CORS `credentials: true` on both client and server

### Issue: Middleware Not Running
**Symptom:** req.user is undefined in controller
**Solution:** Verify `authMiddleware` is applied to the route

### Issue: Token Expired
**Symptom:** 401 after ~60 minutes
**Solution:** Implement automatic token refresh via interceptors

### Issue: CORS Error
**Symptom:** Request blocked by CORS policy
**Solution:** Configure CORS with correct origin and credentials

---

## Files Modified

| File | Change |
|------|--------|
| [`server/routes/shop/products-routes.js`](server/routes/shop/products-routes.js) | Added `authMiddleware` to Firebase routes |
| [`client/src/lib/axios-config.js`](client/src/lib/axios-config.js) | Created axios interceptor with auto token refresh |
| [`client/src/lib/firebase-auth.js`](client/src/lib/firebase-auth.js) | Created Firebase Auth integration utilities |
| [`client/src/lib/auth-debug.js`](client/src/lib/auth-debug.js) | Created comprehensive debugging utilities |
| [`client/src/store/shop/products-slice/index.js`](client/src/store/shop/products-slice/index.js) | Added auth debugging to products slice |

---

## Testing the Fix

1. **Clear cookies and local storage**
2. **Log in with user 'sangam'**
3. **Navigate to products listing**
4. **Check browser console for:**
   - `Auth state before request:` showing authenticated user
   - `✅ API Response:` with 200 status
   - No `❌ 401 Unauthorized` errors

5. **Run health check:**
```javascript
import { authHealthCheck } from '@/lib/auth-debug';
await authHealthCheck();
```

Expected output:
```
🏥 Overall Health: ✅ HEALTHY
```
