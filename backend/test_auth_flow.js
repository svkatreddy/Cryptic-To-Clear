const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

async function runAuthTests() {
  console.log("=================================================");
  console.log(" RUNNING CRYPTIC TO CLEAR AUTH & SUB TEST SUITE  ");
  console.log("=================================================\n");

  try {
    // 1. Demo Login
    console.log("1. Testing Demo Account Login...");
    const demoRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: "demo@cryptictoclear.io",
      password: "Password123!",
    });
    console.log("✅ Demo Login Success:", demoRes.data.user.email, "| Role:", demoRes.data.user.role, "| Plan:", demoRes.data.user.plan);

    // Save token
    const token = demoRes.data.token;

    // 2. Register New User
    console.log("\n2. Testing New User Registration...");
    const testEmail = `dev_${Date.now()}@example.com`;
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: "Test Developer",
      email: testEmail,
      password: "MySecurePassword123!",
    });
    console.log("✅ New User Registered:", regRes.data.user.email, "| ID:", regRes.data.user.id);
    const newTok = regRes.data.token;

    // 3. Fetch Session (/auth/me)
    console.log("\n3. Testing Protected /auth/me Endpoint...");
    const meRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${newTok}` },
    });
    console.log("✅ Session Validated for:", meRes.data.user.name, "| Email:", meRes.data.user.email);

    // 4. Subscriptions Plans & Status
    console.log("\n4. Testing Subscriptions Plans & User Status...");
    const plansRes = await axios.get(`${BASE_URL}/subscriptions/plans`);
    console.log("✅ Available Plans:", plansRes.data.plans.map(p => `${p.name} ($${p.priceMonthly}/mo)`).join(", "));

    const subStatusRes = await axios.get(`${BASE_URL}/subscriptions/status`, {
      headers: { Authorization: `Bearer ${newTok}` },
    });
    console.log("✅ User Subscription Status:", subStatusRes.data.subscription.plan.toUpperCase(), "| Status:", subStatusRes.data.subscription.status);

    // 5. Checkout Session Placeholder
    console.log("\n5. Testing Payment Gateway Checkout Placeholder (Stripe)...");
    const checkoutRes = await axios.post(
      `${BASE_URL}/subscriptions/checkout-session`,
      { planId: "pro", provider: "stripe" },
      { headers: { Authorization: `Bearer ${newTok}` } }
    );
    console.log("✅ Checkout Session Placeholder Response:", checkoutRes.data.message);

    // 6. User Logout
    console.log("\n6. Testing Logout...");
    const logoutRes = await axios.post(`${BASE_URL}/auth/logout`);
    console.log("✅ Logout Response:", logoutRes.data.message);

    console.log("\n=================================================");
    console.log(" ALL AUTHENTICATION & SUBSCRIPTION TESTS PASSED! ");
    console.log("=================================================");
  } catch (err) {
    console.error("❌ Auth Test Failed:", err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

runAuthTests();
