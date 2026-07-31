const axios = require("axios");

const PISTON_URL = "https://emkc.org/api/v2/piston/execute";

const PISTON_LANG_MAP = {
  c: "c",
  cpp: "c++",
  java: "java",
  python: "python",
  javascript: "javascript",
};

const TEST_CODES = {
  c: `#include <stdio.h>\nint main() { printf("Hello from Piston C\\n"); return 0; }`,
  cpp: `#include <iostream>\nint main() { std::cout << "Hello from Piston C++" << std::endl; return 0; }`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Piston Java");\n    }\n}`,
  python: `print("Hello from Piston Python")`,
  javascript: `console.log("Hello from Piston JS");`,
};

async function testPiston() {
  console.log("=== TESTING PISTON REAL CODE EXECUTION API ===");
  for (const [lang, code] of Object.entries(TEST_CODES)) {
    try {
      const response = await axios.post(PISTON_URL, {
        language: PISTON_LANG_MAP[lang],
        version: "*",
        files: [{ content: code }],
      }, { timeout: 8000 });

      console.log(`[PASS] Piston (${lang}): output="${response.data.run.output.trim()}"`);
    } catch (err) {
      console.error(`[FAIL] Piston (${lang}):`, err.message);
    }
  }
}

testPiston();
