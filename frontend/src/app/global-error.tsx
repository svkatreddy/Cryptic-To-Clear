"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled root-level error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          background: "#0a0d13",
          color: "#dbe2ea",
          fontFamily: "system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            CodeMentor AI hit a critical error
          </h1>
          <p style={{ fontSize: 13, color: "#8993a4", marginBottom: 20, lineHeight: 1.6 }}>
            Please reload the page. If this keeps happening, your code is
            still safe in this browser&apos;s storage.
          </p>
          <button
            onClick={reset}
            style={{
              background: "linear-gradient(90deg, #b892ff, #6cb6ff, #9ee6a8)",
              color: "#0a0d13",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
