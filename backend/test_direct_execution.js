const { runCode } = require("./src/services/openai.service");

async function testDirect() {
  console.log("=== TESTING DIRECT C EXECUTION & ERROR HANDLING ===");

  // 1. C Valid Code
  const validRes = await runCode({
    language: "c",
    sourceCode: `#include <stdio.h>\ntypedef struct { int x, y; } Point;\nint main() { Point p = {10, 20}; printf("Point: x=%d, y=%d\\n", p.x, p.y); return 0; }`,
  });
  console.log("\n1. Valid C Code Output:\n", validRes.output);

  // 2. C Invalid Code (Missing Semicolon)
  const invalidRes = await runCode({
    language: "c",
    sourceCode: `#include <stdio.h>\nint main() { printf("Missing semicolon") return 0; }`,
  });
  console.log("\n2. Invalid C Code (Missing Semicolon):");
  console.log("   Status:", invalidRes.statusDescription);
  console.log("   Compile Error:", invalidRes.compileError);

  // 3. C Invalid Code (Missing Main)
  const noMainRes = await runCode({
    language: "c",
    sourceCode: `#include <stdio.h>\nvoid foo() { printf("No main"); }`,
  });
  console.log("\n3. Invalid C Code (Missing Main):");
  console.log("   Status:", noMainRes.statusDescription);
  console.log("   Compile Error:", noMainRes.compileError);
}

testDirect();
