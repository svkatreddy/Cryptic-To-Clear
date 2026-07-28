"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle } from "lucide-react";
import EditorMockup from "./EditorMockup";
import FloatingSnippets from "./FloatingSnippets";

export default function Hero() {
  return (
    <section className="relative pt-32 sm:pt-40 pb-24 sm:pb-32 overflow-hidden editor-grid">
      {/* Ambient gradient blobs */}
      <div className="blob h-[420px] w-[420px] bg-[var(--syn-keyword)] -top-40 -left-32" />
      <div className="blob h-[380px] w-[380px] bg-[var(--syn-function)] top-20 -right-24" />
      <div className="blob h-[300px] w-[300px] bg-[var(--syn-string)] bottom-0 left-1/3" />

      <FloatingSnippets />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: copy */}
        <div className="text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 mb-6 font-mono text-[12px] text-[var(--syn-string)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--syn-string)] animate-pulse" />
            AI-powered error explanations, live
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold leading-[1.08] tracking-tight"
          >
            Compile Smarter
            <br />
            with{" "}
            <span className="text-gradient">Artificial Intelligence</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-6 text-base sm:text-lg text-[var(--ink-dim)] max-w-xl mx-auto lg:mx-0"
          >
            Write code, run it instantly, and understand every compiler error
            using AI.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-9 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
          >
            <Link
              href="/compiler"
              className="group inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-[#0a0d13] bg-gradient-to-r from-[var(--syn-keyword)] via-[var(--syn-function)] to-[var(--syn-string)] hover:brightness-110 transition-all w-full sm:w-auto shadow-[0_0_30px_rgba(108,182,255,0.25)]"
            >
              Start Coding
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/features"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-[var(--ink)] glass hover:bg-white/[0.06] transition-colors w-full sm:w-auto"
            >
              <PlayCircle className="h-4 w-4 text-[var(--syn-function)]" />
              Learn More
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-10 flex items-center gap-6 justify-center lg:justify-start font-mono text-[12px] text-[var(--ink-faint)]"
          >
            <span>12+ languages</span>
            <span className="h-1 w-1 rounded-full bg-[var(--ink-faint)]" />
            <span>Instant execution</span>
            <span className="h-1 w-1 rounded-full bg-[var(--ink-faint)]" />
            <span>No signup required</span>
          </motion.div>
        </div>

        {/* Right: editor mockup */}
        <div className="relative">
          <EditorMockup />
        </div>
      </div>
    </section>
  );
}
