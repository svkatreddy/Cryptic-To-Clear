/**
 * Supported languages for code execution via Judge0.
 *
 * `judge0Id` values correspond to Judge0 CE's default language table.
 * These IDs are stable for the official Judge0 CE deployment, but if you run
 * your own Judge0 instance, verify them against `GET {JUDGE0_API_URL}/languages`
 * and adjust here if your instance uses different versions/IDs.
 *
 * `type` marks whether the language has a distinct compilation step, so the
 * backend can respond sensibly when the "Compile" action is used against an
 * interpreted language (Python/JavaScript/PHP have no separate compile phase).
 */
const LANGUAGES = {
  c: { label: "C", judge0Id: 50, type: "compiled" }, // C (GCC 9.2.0)
  cpp: { label: "C++", judge0Id: 54, type: "compiled" }, // C++ (GCC 9.2.0)
  java: { label: "Java", judge0Id: 62, type: "compiled" }, // Java (OpenJDK 13.0.1)
  python: { label: "Python", judge0Id: 71, type: "interpreted" }, // Python (3.8.1)
  javascript: { label: "JavaScript", judge0Id: 63, type: "interpreted" }, // Node.js (12.14.0)
  go: { label: "Go", judge0Id: 60, type: "compiled" }, // Go (1.13.5)
  rust: { label: "Rust", judge0Id: 73, type: "compiled" }, // Rust (1.40.0)
  php: { label: "PHP", judge0Id: 68, type: "interpreted" }, // PHP (7.4.1)
  kotlin: { label: "Kotlin", judge0Id: 78, type: "compiled" }, // Kotlin (1.3.70)
  csharp: { label: "C#", judge0Id: 51, type: "compiled" }, // C# (Mono 6.6.0.161)
};

const getLanguageConfig = (id) => LANGUAGES[id] || null;

const listLanguages = () =>
  Object.entries(LANGUAGES).map(([id, cfg]) => ({ id, ...cfg }));

module.exports = { LANGUAGES, getLanguageConfig, listLanguages };
