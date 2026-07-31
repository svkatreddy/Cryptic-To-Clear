const { executeJavaLocally } = require("../src/services/localCompiler.service");
const { runCode } = require("../src/services/openai.service");

async function runJavaTests() {
  console.log("==================================================");
  console.log("SUITE 1: AUTOMATED LOCAL JAVA COMPILER TESTS");
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

  // 1. Hello World
  console.log("\n--- Test 1: Standard Hello World ---");
  const t1 = await executeJavaLocally({
    sourceCode: `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Local Java!");
    }
}`,
    stdin: "",
  });
  assert(t1.statusId === 3 && t1.output.includes("Hello, Local Java!"), "Hello World Execution", JSON.stringify(t1));

  // 2. Scanner Input Reading
  console.log("\n--- Test 2: Scanner Input Reading ---");
  const t2 = await executeJavaLocally({
    sourceCode: `
import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println("Sum = " + (a + b));
    }
}`,
    stdin: "15 25",
  });
  assert(t2.statusId === 3 && t2.output.includes("Sum = 40"), "Scanner Input Sum", JSON.stringify(t2));

  // 3. BufferedReader Input Reading
  console.log("\n--- Test 3: BufferedReader Input Reading ---");
  const t3 = await executeJavaLocally({
    sourceCode: `
import java.io.*;
public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String text = br.readLine();
        System.out.println("Echo: " + text);
    }
}`,
    stdin: "CodeMentor AI",
  });
  assert(t3.statusId === 3 && t3.output.includes("Echo: CodeMentor AI"), "BufferedReader Input", JSON.stringify(t3));

  // 4. Multiple Classes in Single Snippet
  console.log("\n--- Test 4: Multiple Classes ---");
  const t4 = await executeJavaLocally({
    sourceCode: `
class Helper {
    public static String getGreeting() {
        return "Greetings from Helper!";
    }
}
public class Main {
    public static void main(String[] args) {
        System.out.println(Helper.getGreeting());
    }
}`,
    stdin: "",
  });
  assert(t4.statusId === 3 && t4.output.includes("Greetings from Helper!"), "Multiple Classes Execution", JSON.stringify(t4));

  // 5. Package Header Handling
  console.log("\n--- Test 5: Package Declaration ---");
  const t5 = await executeJavaLocally({
    sourceCode: `
package com.codementor.platform;
public class Main {
    public static void main(String[] args) {
        System.out.println("Package code executed cleanly!");
    }
}`,
    stdin: "",
  });
  assert(t5.statusId === 3 && t5.output.includes("Package code executed cleanly!"), "Package Header Stripping/Execution", JSON.stringify(t5));

  // 6. Compilation Error Handling
  console.log("\n--- Test 6: Syntax Compilation Error ---");
  const t6 = await executeJavaLocally({
    sourceCode: `
public class Main {
    public static void main(String[] args) {
        System.out.println("Missing semicolon")
    }
}`,
    stdin: "",
  });
  assert(t6.statusId === 6 && t6.compileError.length > 0, "Compilation Error Detection", JSON.stringify(t6));

  // 7. Runtime Exception Handling (NullPointer)
  console.log("\n--- Test 7: Runtime Exception (NullPointerException) ---");
  const t7 = await executeJavaLocally({
    sourceCode: `
public class Main {
    public static void main(String[] args) {
        String str = null;
        System.out.println(str.length());
    }
}`,
    stdin: "",
  });
  assert(t7.statusId === 7 && t7.runtimeError.includes("NullPointerException"), "NullPointerException Handling", JSON.stringify(t7));

  // 8. Infinite Loop Timeout (5s kill)
  console.log("\n--- Test 8: Infinite Loop Process Timeout ---");
  const t8 = await executeJavaLocally({
    sourceCode: `
public class Main {
    public static void main(String[] args) {
        while(true) {}
    }
}`,
    stdin: "",
  });
  assert(t8.statusId === 5 && t8.runtimeError.includes("timed out"), "Process Timeout Enforcement", JSON.stringify(t8));

  // 9. Unicode Characters Output
  console.log("\n--- Test 9: UTF-8 Unicode Support ---");
  const t9 = await executeJavaLocally({
    sourceCode: `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello 🚀 CodeMentor AI ✨ 🤖");
    }
}`,
    stdin: "",
  });
  assert(t9.statusId === 3 && t9.output.includes("🚀 CodeMentor AI ✨"), "Unicode UTF-8 Support", JSON.stringify(t9));

  console.log("\n==================================================");
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} TESTS`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runJavaTests().catch((err) => {
  console.error("Test suite runner crashed:", err);
  process.exit(1);
});
