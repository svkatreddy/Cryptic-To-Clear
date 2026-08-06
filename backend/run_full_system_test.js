const app = require("./src/server");
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

async function testFullSystem() {
  console.log("Waiting 1s for server boot...");
  await new Promise((resolve) => setTimeout(resolve, 1000));

  try {
    // 1. Check Health & Languages API
    console.log("1. Checking Health & Languages API...");
    const health = await axios.get(`${BASE_URL}/health`);
    console.log("  ✅ Health check status:", health.data.status);

    const languages = await axios.get(`${BASE_URL}/languages`);
    console.log("  ✅ Supported languages count:", languages.data.languages.length);

    // 2. Test Code Execution (Guest access unaffected)
    console.log("\n2. Testing Code Execution (Guest Mode)...");
    const execRes = await axios.post(`${BASE_URL}/execute`, {
      language: "python",
      sourceCode: "print('Hello from Cryptic to Clear Compiler!')",
    });
    console.log("  ✅ Python Execution Status:", execRes.data.statusDescription, "| Output:", execRes.data.output.trim());

    // 3. Test Explain API (Guest mode unaffected)
    console.log("\n3. Testing AI Explanation (Guest Mode)...");
    const explainRes = await axios.post(`${BASE_URL}/explain`, {
      language: "python",
      error: "SyntaxError: invalid syntax",
      sourceCode: "def foo(",
    });
    console.log("  ✅ Explain API Success:", explainRes.data.success, "| Reason:", explainRes.data.explanation.reason.slice(0, 80) + "...");

    // 4. Test Auth & Subscription APIs
    console.log("\n4. Testing Authentication & Subscriptions...");
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: "demo@cryptictoclear.io",
      password: "Password123!",
    });
    console.log("  ✅ Auth Login Success for:", loginRes.data.user.email, "| Plan:", loginRes.data.user.plan);

    const plansRes = await axios.get(`${BASE_URL}/subscriptions/plans`);
    console.log("  ✅ Subscription Tiers Available:", plansRes.data.plans.map(p => p.name).join(", "));

    console.log("\n=================================================");
    console.log(" ALL SYSTEM & COMPILER INTEGRATION TESTS PASSED! ");
    console.log("=================================================");
    process.exit(0);
  } catch (err) {
    console.error("❌ System Test Failed:", err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

testFullSystem();
