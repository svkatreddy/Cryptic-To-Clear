/**
 * Central error handler. Every route funnels failures here (directly, or via
 * asyncHandler) so the frontend always receives a consistent, graceful JSON
 * response instead of a raw stack trace or a hung request.
 *
 * Services that call out to a third party (Judge0, OpenAI) can tag their
 * errors with `err.service` ("judge0" | "openai") so the message here reads
 * naturally regardless of which one failed.
 */
function serviceLabel(err) {
  return err.service === "openai" ? "AI service" : "code execution engine";
}

function errorHandler(err, req, res, _next) {
  // eslint-disable-next-line no-console
  console.error("[error]", err?.message || err);

  const service = serviceLabel(err);

  // Judge0/OpenAI unreachable, DNS failure, connection refused, etc.
  if (err.code === "ECONNABORTED") {
    return res.status(504).json({
      success: false,
      message: `The ${service} took too long to respond. Please try again.`,
    });
  }

  if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
    return res.status(502).json({
      success: false,
      message: `Could not reach the ${service}. Please check the backend's configuration and try again.`,
    });
  }

  // Axios error with a response from Judge0/OpenAI (e.g. bad request, auth failure)
  if (err.response) {
    const status = err.response.status;
    const friendly =
      status === 401 || status === 403
        ? `The ${service} rejected the request. Check your API key.`
        : status === 429
        ? `The ${service} is rate-limiting requests. Please wait a moment and try again.`
        : `The ${service} returned an unexpected error.`;

    return res.status(502).json({ success: false, message: friendly });
  }

  return res.status(err.status || 500).json({
    success: false,
    message: err.publicMessage || "Something went wrong on the server.",
  });
}

module.exports = errorHandler;
