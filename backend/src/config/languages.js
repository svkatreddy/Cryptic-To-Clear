/**
 * Supported languages for code execution via Groq AI engine.
 *
 * `type` marks whether the language has a distinct compilation step, so the
 * backend can respond sensibly when the "Compile" action is used.
 */
const LANGUAGES = {
  c: { label: "C", type: "compiled" },
  cpp: { label: "C++", type: "compiled" },
  java: { label: "Java", type: "compiled" },
  python: { label: "Python", type: "interpreted" },
};

const getLanguageConfig = (id) => LANGUAGES[id] || null;

const listLanguages = () =>
  Object.entries(LANGUAGES).map(([id, cfg]) => ({ id, ...cfg }));

module.exports = { LANGUAGES, getLanguageConfig, listLanguages };
