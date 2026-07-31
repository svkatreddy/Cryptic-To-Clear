const axios = require("axios");

// 1. Wandbox API
async function testWandbox() {
  console.log("\n--- TESTING WANDBOX API ---");
  try {
    const res = await axios.post("https://wandbox.org/api/compile.json", {
      compiler: "gcc-head",
      code: "#include <stdio.h>\nint main() { printf(\"Hello Wandbox C\\n\"); return 0; }",
    }, { timeout: 8000 });
    console.log("[PASS] Wandbox (C):", res.data.program_output ? res.data.program_output.trim() : res.data);
  } catch (err) {
    console.error("[FAIL] Wandbox:", err.message);
  }
}

// 2. Glot.io API
async function testGlot() {
  console.log("\n--- TESTING GLOT.IO API ---");
  try {
    const res = await axios.post("https://run.glot.io/languages/python/latest", {
      files: [{ name: "main.py", content: "print('Hello Glot Python')" }],
    }, { timeout: 8000 });
    console.log("[PASS] Glot (Python):", res.data.stdout ? res.data.stdout.trim() : res.data);
  } catch (err) {
    console.error("[FAIL] Glot:", err.message);
  }
}

// 3. Judge0 Public Instance
async function testJudge0() {
  console.log("\n--- TESTING JUDGE0 PUBLIC INSTANCE ---");
  try {
    const res = await axios.post("https://ce.judge0.com/submissions?wait=true", {
      source_code: "print('Hello Judge0')",
      language_id: 71, // Python 3
    }, { timeout: 8000 });
    console.log("[PASS] Judge0 (Python):", res.data.stdout ? res.data.stdout.trim() : res.data);
  } catch (err) {
    console.error("[FAIL] Judge0:", err.message);
  }
}

async function runAll() {
  await testWandbox();
  await testGlot();
  await testJudge0();
}

runAll();
