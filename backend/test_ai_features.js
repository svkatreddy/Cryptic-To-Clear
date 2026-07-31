const {
  explainError,
  chatReply,
  analyzeCode,
  generateTrace,
  generateLearningContent,
  convertCode,
  runCode,
} = require("./src/services/openai.service");

const TEST_CODES = {
  c: {
    valid: `#include <stdio.h>\nint main() { printf("Hello C\\n"); return 0; }`,
    invalid: `#include <stdio.h>\nint main() { printf("Hello C" return 0; }`,
    error: `main.c:2:27: error: expected ')' before 'return'`,
  },
  cpp: {
    valid: `#include <iostream>\nint main() { std::cout << "Hello C++" << std::endl; return 0; }`,
    invalid: `#include <iostream>\nint main() { std::cout << "Hello C++" return 0; }`,
    error: `main.cpp:2:40: error: expected ';' before 'return'`,
  },
  java: {
    valid: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello Java");\n    }\n}`,
    invalid: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello Java")\n    }\n}`,
    error: `Main.java:3: error: ';' expected\n        System.out.println("Hello Java")\n                                        ^`,
  },
  python: {
    valid: `def main():\n    print("Hello Python")\n\nif __name__ == "__main__":\n    main()`,
    invalid: `def main():\n    print("Hello Python"\n\nif __name__ == "__main__":\n    main()`,
    error: `SyntaxError: unexpected EOF while parsing`,
  },
};

async function runTests() {
  console.log("=== STARTING AI FEATURE TEST MATRIX ===");
  const languages = ["c", "cpp", "java", "python"];
  let passed = 0;
  let failed = 0;
  const pause = (ms = 400) => new Promise((r) => setTimeout(r, ms));

  for (const lang of languages) {
    console.log(`\n----------------------------------------`);
    console.log(`Testing Language: [${lang.toUpperCase()}]`);
    console.log(`----------------------------------------`);

    // Test 1: Run Code
    try {
      const res = await runCode({ language: lang, sourceCode: TEST_CODES[lang].valid });
      console.log(`[PASS] runCode (${lang}): output="${res.output.trim()}"`);
      passed++;
    } catch (e) {
      console.error(`[FAIL] runCode (${lang}):`, e.message, e.response?.data || "");
      failed++;
    }
    await pause();

    // Test 2: Explain Error
    try {
      const res = await explainError({
        language: lang,
        error: TEST_CODES[lang].error,
        sourceCode: TEST_CODES[lang].invalid,
      });
      console.log(`[PASS] explainError (${lang}): summary="${res.errorSummary}"`);
      passed++;
    } catch (e) {
      console.error(`[FAIL] explainError (${lang}):`, e.message, e.response?.data || "");
      failed++;
    }
    await pause();

    // Test 3: Chat Reply
    try {
      const res = await chatReply({
        language: lang,
        sourceCode: TEST_CODES[lang].valid,
        messages: [{ role: "user", content: "How do I print hello in this code?" }],
      });
      console.log(`[PASS] chatReply (${lang}): length=${res.length}`);
      passed++;
    } catch (e) {
      console.error(`[FAIL] chatReply (${lang}):`, e.message, e.response?.data || "");
      failed++;
    }
    await pause();

    // Test 4: Analyze Code
    try {
      const res = await analyzeCode({ language: lang, sourceCode: TEST_CODES[lang].valid });
      console.log(`[PASS] analyzeCode (${lang}): readability=${res.readabilityScore}`);
      passed++;
    } catch (e) {
      console.error(`[FAIL] analyzeCode (${lang}):`, e.message, e.response?.data || "");
      failed++;
    }
    await pause();

    // Test 5: Generate Trace
    try {
      const res = await generateTrace({ language: lang, sourceCode: TEST_CODES[lang].valid });
      console.log(`[PASS] generateTrace (${lang}): steps=${res.steps?.length}`);
      passed++;
    } catch (e) {
      console.error(`[FAIL] generateTrace (${lang}):`, e.message, e.response?.data || "");
      failed++;
    }
    await pause();

    // Test 6: Generate Learning Content
    try {
      const res = await generateLearningContent({ language: lang, sourceCode: TEST_CODES[lang].valid });
      console.log(`[PASS] generateLearningContent (${lang}): topic="${res.topic}"`);
      passed++;
    } catch (e) {
      console.error(`[FAIL] generateLearningContent (${lang}):`, e.message, e.response?.data || "");
      failed++;
    }
    await pause();

    // Test 7: Convert Code
    try {
      const target = lang === "python" ? "java" : "python";
      const res = await convertCode({
        sourceLanguage: lang,
        targetLanguage: target,
        sourceCode: TEST_CODES[lang].valid,
      });
      console.log(`[PASS] convertCode (${lang} -> ${target}): preserved="${res.preservedLogicSummary}"`);
      passed++;
    } catch (e) {
      console.error(`[FAIL] convertCode (${lang}):`, e.message, e.response?.data || "");
      failed++;
    }
    await pause();
  }

  console.log(`\n========================================`);
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================`);
}

runTests();
