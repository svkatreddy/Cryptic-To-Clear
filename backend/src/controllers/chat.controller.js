const openaiService = require("../services/openai.service");

const VALID_ROLES = new Set(["user", "assistant"]);
const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 8000;
const MAX_SOURCE_LENGTH = 20000;

/**
 * POST /api/chat
 * Body: { language: string, sourceCode: string, messages: {role, content}[] }
 *
 * Powers the permanent AI Chat panel. The frontend keeps the conversation
 * in its own state and sends the whole (trimmed) history each call — this
 * endpoint stays stateless and reusable, same as /api/execute and
 * /api/explain.
 */
async function chat(req, res, next) {
  try {
    const { language, sourceCode, messages } = req.body || {};

    if (
      !language ||
      typeof sourceCode !== "string" ||
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Request must include 'language', 'sourceCode', and a non-empty 'messages' array.",
      });
    }

    const cleanMessages = messages
      .filter(
        (m) =>
          m &&
          VALID_ROLES.has(m.role) &&
          typeof m.content === "string" &&
          m.content.trim().length > 0
      )
      .slice(-MAX_HISTORY_MESSAGES)
      .map((m) => ({
        role: m.role,
        content: m.content.slice(0, MAX_MESSAGE_LENGTH),
      }));

    if (cleanMessages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid messages were provided.",
      });
    }

    const reply = await openaiService.chatReply({
      language,
      sourceCode: sourceCode.slice(0, MAX_SOURCE_LENGTH),
      messages: cleanMessages,
    });

    return res.status(200).json({ success: true, reply });
  } catch (err) {
    return next(err);
  }
}

module.exports = { chat };
