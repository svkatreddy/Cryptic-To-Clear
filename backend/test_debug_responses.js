const {
  explainError,
  chatReply,
  analyzeCode,
  generateTrace,
  generateLearningContent,
  convertCode,
} = require("./src/services/openai.service");

async function debug() {
  console.log("--- EXPLAIN ERROR ---");
  const exp = await explainError({
    language: "python",
    error: "SyntaxError: unexpected EOF while parsing",
    sourceCode: "def main():\n  print('hello'",
  });
  console.log("explainError keys:", Object.keys(exp));
  console.log("explainError sample:", JSON.stringify(exp, null, 2));

  console.log("\n--- CONVERT CODE ---");
  const conv = await convertCode({
    sourceLanguage: "python",
    targetLanguage: "java",
    sourceCode: "print('hello')",
  });
  console.log("convertCode keys:", Object.keys(conv));
  console.log("convertCode sample:", JSON.stringify(conv, null, 2));

  console.log("\n--- LEARN CONTENT ---");
  try {
    const learn = await generateLearningContent({
      language: "python",
      sourceCode: "print('hello')",
    });
    console.log("generateLearningContent keys:", Object.keys(learn));
  } catch (e) {
    console.error("generateLearningContent error:", e.message);
  }
}

debug();
