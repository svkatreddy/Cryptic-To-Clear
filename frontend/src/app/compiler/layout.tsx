import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compiler — Cryptic to Clear",
  description:
    "A professional, AI-powered online IDE: Monaco editor, 13 languages, instant run and compile, a permanent AI chat assistant, code quality analysis, a visual debugger, learning mode, and cross-language conversion.",
};

export default function CompilerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
