pnpm // Authentication Debug Utilities
// Comprehensive debugging tools for Firebase and JWT authentication flow

// Lazy import store to avoid circular dependency
let storeInstance = null;

async function getStore() {
  if (storeInstance) return storeInstance;
  const module = await import("@/store/store");
  storeInstance = module.store || module.default.store;
  return storeInstance;
}

import { checkAuth, logoutUser } from "@/store/auth-slice";
import {
  getCurrentUserIdToken,
  getIdTokenWithClaims,
  isTokenExpired,
  onAuthStateChange,
} from "./firebase-auth";

/**
 * Debug authentication state
 * Logs detailed information about the current auth state
 */
export function debugAuthState() {
  // debugAuthState is synchronous, so we need to handle it differently
  // This function is primarily for logging, so we can make it async
  console.warn(
    "debugAuthState requires async handling - use debugAuthStateAsync for synchronous access"
  );
  return null;
}

/**
 * Async version of debugAuthState that properly waits for store import
 */
export async function debugAuthStateAsync() {
  const store = await getStore();
  const state = store.getState();
  const { isAuthenticated, isLoading, user } = state.auth;

  console.group("🔐 Authentication Debug Info");
  console.log("📊 Redux Auth State:", {
    isAuthenticated,
    isLoading,
    user: user
      ? {
          id: user.id,
          email: user.email,
          userName: user.userName,
          role: user.role,
        }
      : null,
  });
  console.log("📍 Timestamp:", new Date().toISOString());
  console.groupEnd();

  return { isAuthenticated, isLoading, user };
}

/**
 * Debug the full authentication flow
 * Includes cookie check, token validation, and server verification
 */
export async function debugAuthFlow() {
  console.group("🔄 Full Authentication Flow Debug");

  try {
    // Step 1: Check Redux state
    const store = await getStore();
    const state = store.getState();
    console.log("1️⃣ Redux State:", {
      isAuthenticated: state.auth.isAuthenticated,
      userId: state.auth.user?.id,
      userEmail: state.auth.user?.email,
    });

    // Step 2: Check cookies (if available)
    const cookies = document.cookie;
    console.log("2️⃣ Cookies:", cookies ? "Present" : "None");
    if (cookies) {
      const tokenCookie = cookies
        .split(";")
        .find((c) => c.trim().startsWith("token="));
      console.log("   Token cookie:", tokenCookie ? "Present" : "Missing");
    }

    // Step 3: Try to get Firebase ID token
    const idToken = await getCurrentUserIdToken();
    console.log(
      "3️⃣ Firebase ID Token:",
      idToken ? `Present (${idToken.substring(0, 20)}...)` : "None"
    );

    // Step 4: Check token expiration
    const expired = await isTokenExpired();
    console.log("4️⃣ Token Expired:", expired);

    // Step 5: Get token claims
    const tokenResult = await getIdTokenWithClaims();
    console.log("5️⃣ Token Claims:", tokenResult?.claims || "None");

    // Step 6: Verify with server
    console.log("6️⃣ Verifying with server...");
    const serverCheck = await store.dispatch(checkAuth());
    console.log("   Server Response:", serverCheck.payload);

    // Step 7: Summary
    const isAuth = state.auth.isAuthenticated && serverCheck.payload?.success;
    console.log(
      "7️⃣ Final Auth Status:",
      isAuth ? "✅ Authenticated" : "❌ Not Authenticated"
    );

    console.groupEnd();

    return {
      isAuthenticated: isAuth,
      user: state.auth.user,
      token: idToken,
      claims: tokenResult?.claims,
      serverVerified: serverCheck.payload?.success,
    };
  } catch (error) {
    console.error("❌ Debug error:", error);
    console.groupEnd();
    return { error: error.message };
  }
}

/**
 * Debug API request and response
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {object} options - Request options
 */
export async function debugApiRequest(method, url, options = {}) {
  console.group(`🌐 API Request Debug: ${method.toUpperCase()} ${url}`);

  const store = await getStore();
  // Log auth state before request
  const stateBefore = store.getState().auth;
  console.log("Before Request:", {
    isAuthenticated: stateBefore.isAuthenticated,
    userId: stateBefore.user?.id,
  });

  const startTime = Date.now();
  console.log("⏱️  Starting request at:", new Date().toISOString());

  const response = await fetch(url, {
    method,
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });

  const duration = Date.now() - startTime;
  console.log("⏱️  Response time:", `${duration}ms`);

  // Log response details
  const responseData = await response.json();
  console.log("📊 Response Status:", response.status);
  console.log("📊 Response Data:", responseData);

  // Log auth state after request
  const stateAfter = store.getState().auth;
  console.log("After Request:", {
    isAuthenticated: stateAfter.isAuthenticated,
    userId: stateAfter.user?.id,
  });

  console.groupEnd();

  return {
    success: response.ok,
    data: responseData,
    status: response.status,
  };
}

/**
 * Force re-authentication
 * Useful for debugging authentication issues
 */
export async function forceReauth() {
  console.group("🔄 Force Re-authentication");

  try {
    const store = await getStore();
    // Logout first
    console.log("1️⃣ Logging out...");
    await store.dispatch(logoutUser());

    // Wait a moment
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check auth state
    console.log("2️⃣ Checking auth state after logout...");
    const state = store.getState().auth;
    console.log("   Auth state:", {
      isAuthenticated: state.isAuthenticated,
      user: state.user,
    });

    console.log("3️⃣ Please log in again to continue...");
    console.groupEnd();

    return { success: true, message: "Please log in again" };
  } catch (error) {
    console.error("❌ Reauth failed:", error);
    console.groupEnd();
    return { success: false, error: error.message };
  }
}

/**
 * Test token validation on server
 * Sends the current token to the server for validation
 */
export async function testServerTokenValidation() {
  console.group("🧪 Server Token Validation Test");

  try {
    // Get current token from cookie
    const cookies = document.cookie;
    const tokenCookie = cookies
      .split(";")
      .find((c) => c.trim().startsWith("token="));
    const token = tokenCookie ? tokenCookie.split("=")[1] : null;

    console.log(
      "1️⃣ Token from cookie:",
      token ? `Present (${token.substring(0, 20)}...)` : "None"
    );

    if (!token) {
      console.log("❌ No token found in cookies");
      console.groupEnd();
      return { valid: false, error: "No token in cookies" };
    }

    // Make a test request to verify token
    const response = await fetch("http://localhost:5000/api/auth/check-auth", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const result = await response.json();
    console.log("2️⃣ Server validation result:", result);

    console.groupEnd();

    return {
      valid: result.success,
      user: result.user,
      message: result.message,
    };
  } catch (error) {
    console.error("❌ Token validation test failed:", error);
    console.groupEnd();
    return { valid: false, error: error.message };
  }
}

/**
 * Subscribe to real-time auth changes and log them
 */
export function subscribeToAuthChanges() {
  console.log("🔔 Subscribing to auth state changes...");

  const unsubscribe = onAuthStateChange((user) => {
    if (user) {
      console.log("✅ User signed in:", {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
      });
    } else {
      console.log("❌ User signed out");
    }
  });

  return () => {
    console.log("🔔 Unsubscribing from auth changes...");
    unsubscribe();
  };
}

/**
 * Comprehensive authentication health check
 */
export async function authHealthCheck() {
  console.group("🏥 Authentication Health Check");

  const store = await getStore();
  const checks = {
    reduxState: false,
    cookieToken: false,
    firebaseAuth: false,
    serverAuth: false,
    tokenValid: false,
  };

  // Check 1: Redux state
  const state = store.getState().auth;
  checks.reduxState = state.isAuthenticated && !!state.user;
  console.log(`1️⃣ Redux State: ${checks.reduxState ? "✅" : "❌"}`);

  // Check 2: Cookie token
  const cookies = document.cookie;
  checks.cookieToken = cookies.includes("token=");
  console.log(`2️⃣ Cookie Token: ${checks.cookieToken ? "✅" : "❌"}`);

  // Check 3: Firebase Auth
  const firebaseUser = await getCurrentUserIdToken();
  checks.firebaseAuth = !!firebaseUser;
  console.log(`3️⃣ Firebase Auth: ${checks.firebaseAuth ? "✅" : "❌"}`);

  // Check 4: Server authentication
  const serverCheck = await store.dispatch(checkAuth());
  checks.serverAuth = serverCheck.payload?.success;
  console.log(`4️⃣ Server Auth: ${checks.serverAuth ? "✅" : "❌"}`);

  // Check 5: Token validity
  const expired = await isTokenExpired();
  checks.tokenValid = !expired;
  console.log(`5️⃣ Token Valid: ${checks.tokenValid ? "✅" : "❌"}`);

  // Overall health
  const isHealthy = Object.values(checks).every((check) => check);
  console.log(
    `\n🏥 Overall Health: ${isHealthy ? "✅ HEALTHY" : "❌ ISSUES FOUND"}`
  );

  console.groupEnd();

  return {
    healthy: isHealthy,
    checks,
    timestamp: new Date().toISOString(),
  };
}

// Export all debug functions
export default {
  debugAuthState,
  debugAuthStateAsync,
  debugAuthFlow,
  debugApiRequest,
  forceReauth,
  testServerTokenValidation,
  subscribeToAuthChanges,
  authHealthCheck,
};
