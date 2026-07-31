const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

async function runApiTests() {
  console.log("==================================================");
  console.log("SUITE 2: AUTOMATED API ROUTES TESTS");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  // 1. GET /api/health
  try {
    const res1 = await axios.get(`${BASE_URL}/health`);
    assert(res1.status === 200 && res1.data.success === true, "GET /api/health", JSON.stringify(res1.data));
  } catch (err) {
    assert(false, "GET /api/health", err.message);
  }

  // 2. GET /api/languages
  try {
    const res2 = await axios.get(`${BASE_URL}/languages`);
    assert(res2.status === 200 && Array.isArray(res2.data.languages), "GET /api/languages", JSON.stringify(res2.data));
  } catch (err) {
    assert(false, "GET /api/languages", err.message);
  }

  // 3. POST /api/execute (Java Code Execution)
  try {
    const res3 = await axios.post(`${BASE_URL}/execute`, {
      language: "java",
      sourceCode: `public class Main { public static void main(String[] args) { System.out.println("API Test OK"); } }`,
      stdin: "",
    });
    assert(res3.status === 200 && res3.data.success === true && res3.data.output.includes("API Test OK"), "POST /api/execute (Java)", JSON.stringify(res3.data));
  } catch (err) {
    assert(false, "POST /api/execute (Java)", err.message);
  }

  // 4. POST /api/execute (Payload Validation Error)
  try {
    await axios.post(`${BASE_URL}/execute`, {
      language: "java",
      sourceCode: "   ",
    });
    assert(false, "POST /api/execute Validation", "Expected 400 Bad Request but succeeded");
  } catch (err) {
    assert(err.response && err.response.status === 400, "POST /api/execute Validation (Empty Code)", err.message);
  }

  // 5. 404 Route Handling
  try {
    await axios.get(`${BASE_URL}/non-existent-route`);
    assert(false, "404 Route Handling", "Expected 404 Not Found but succeeded");
  } catch (err) {
    assert(err.response && err.response.status === 404, "404 Route Handling", err.message);
  }

  console.log("\n==================================================");
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} TESTS`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runApiTests().catch((err) => {
  console.error("API test runner crashed:", err);
  process.exit(1);
});
