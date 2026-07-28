"use client";

import { motion } from "framer-motion";

const SNIPPETS = [
  { text: "npm run build", lang: "sh", pos: "top-[8%] left-[2%] sm:left-[6%]", delay: 0, tilt: "-4deg" },
  { text: "const ai = mentor.explain(err)", lang: "ts", pos: "top-[18%] right-[1%] sm:right-[4%]", delay: 0.4, tilt: "3deg" },
  { text: "fn compile() -> Result<Ok, Err>", lang: "rs", pos: "bottom-[22%] left-[1%] sm:left-[3%]", delay: 0.8, tilt: "2deg" },
  { text: "status: 0 errors, 2 hints", lang: "log", pos: "bottom-[10%] right-[4%] sm:right-[8%]", delay: 1.2, tilt: "-3deg" },
];

export default function FloatingSnippets() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
      {SNIPPETS.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 + s.delay }}
          className={`absolute ${s.pos}`}
        >
          <div
            className="drift glass rounded-lg px-3.5 py-2 font-mono text-[11.5px] text-[var(--ink-dim)] shadow-lg"
            style={{ ["--tilt" as string]: s.tilt, animationDelay: `${s.delay}s` }}
          >
            <span className="text-[var(--syn-const)] mr-1.5">{s.lang}</span>
            {s.text}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
