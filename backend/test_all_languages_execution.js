const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

const TEST_CASES = [
  {
    name: "C Test 1: Basic Output & Loops",
    language: "c",
    stdin: "",
    sourceCode: `#include <stdio.h>

int main() {
    printf("=== C Compiler Test 1 ===\\n");
    for(int i = 1; i <= 3; i++) {
        printf("Iteration %d\\n", i);
    }
    return 0;
}`,
  },
  {
    name: "C Test 2: Input with scanf (Interactive Stdin)",
    language: "c",
    stdin: "21",
    sourceCode: `#include <stdio.h>

int main() {
    int val;
    printf("Enter a number: ");
    if (scanf("%d", &val) == 1) {
        printf("\\nDouble of %d is %d\\n", val, val * 2);
    }
    return 0;
}`,
  },
  {
    name: "C Test 3: Structures & Pointers",
    language: "c",
    stdin: "",
    sourceCode: `#include <stdio.h>

typedef struct {
    int x;
    int y;
} Point;

void printPoint(const Point *p) {
    printf("Point coords: x=%d, y=%d\\n", p->x, p->y);
}

int main() {
    Point p1 = {10, 20};
    printPoint(&p1);
    return 0;
}`,
  },
  {
    name: "C Test 4: Syntax Error Handling & AI Explanation",
    language: "c",
    stdin: "",
    expectError: true,
    sourceCode: `#include <stdio.h>

int main() {
    printf("Missing semicolon test")
    return 0;
}`,
  },
  {
    name: "C++ Test: iostream & vector",
    language: "cpp",
    stdin: "",
    sourceCode: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> nums = {10, 20, 30};
    std::cout << "C++ Vector size: " << nums.size() << std::endl;
    return 0;
}`,
  },
  {
    name: "Java Test: Main Method & Output",
    language: "java",
    stdin: "",
    sourceCode: `public class Main {
    public static void main(String[] args) {
        System.out.println("Java Execution Test: Success");
    }
}`,
  },
  {
    name: "Python Test: Functions & List Comprehension",
    language: "python",
    stdin: "",
    sourceCode: `def main():
    nums = [x * 2 for x in range(1, 4)]
    print(f"Python Result: {nums}")

if __name__ == "__main__":
    main()`,
  },
];

async function runLiveTests() {
  console.log("=========================================");
  console.log("  LIVE CODE EXECUTION & DIAGNOSTICS TEST ");
  console.log("=========================================\n");

  const pause = (ms = 500) => new Promise((r) => setTimeout(r, ms));
  let passedCount = 0;
  let failedCount = 0;

  for (const tc of TEST_CASES) {
    console.log(`\n▶ [${tc.name}] (${tc.language.toUpperCase()})`);
    try {
      const res = await axios.post(`${BASE_URL}/execute`, {
        language: tc.language,
        sourceCode: tc.sourceCode,
        stdin: tc.stdin,
      });

      const data = res.data;
      if (tc.expectError) {
        if (data.compileError || data.runtimeError || data.statusId !== 3) {
          console.log(`   STATUS: ${data.statusDescription} (Status ID: ${data.statusId})`);
          console.log(`   ERROR CAUGHT: ${(data.compileError || data.runtimeError).trim()}`);
          
          // Test AI Error Explanation endpoint
          console.log(`   -> Triggering AI Explanation Endpoint (/api/explain)...`);
          const expRes = await axios.post(`${BASE_URL}/explain`, {
            language: tc.language,
            error: data.compileError || data.runtimeError,
            sourceCode: tc.sourceCode,
          });
          if (expRes.data.success) {
            console.log(`   AI EXPLANATION SUMMARY: "${expRes.data.explanation.errorSummary}"`);
            console.log(`   AI SUGGESTED FIX: ${expRes.data.explanation.howToFix}`);
          }
          console.log(`   ✅ PASS (Expected Error caught and explained)`);
          passedCount++;
        } else {
          console.log(`   ❌ FAIL (Expected error but succeeded)`);
          failedCount++;
        }
      } else {
        if (data.success && data.statusId === 3) {
          console.log(`   STATUS: ${data.statusDescription} (Time: ${data.time}, Memory: ${data.memory}KB)`);
          console.log(`   OUTPUT:\n   ${data.output.split("\n").join("\n   ")}`);
          console.log(`   ✅ PASS`);
          passedCount++;
        } else {
          console.log(`   STATUS: ${data.statusDescription}`);
          console.log(`   ERRORS: ${data.compileError || data.runtimeError}`);
          console.log(`   ❌ FAIL`);
          failedCount++;
        }
      }
    } catch (err) {
      console.error(`   ❌ FAIL Error calling endpoint:`, err.response?.data || err.message);
      failedCount++;
    }
    await pause();
  }

  console.log("\n=========================================");
  console.log(` SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED out of ${TEST_CASES.length} tests`);
  console.log("=========================================");
}

runLiveTests();
