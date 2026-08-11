"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Terminal, BookOpen } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import UserMenu from "./auth/UserMenu";
import { LogIn } from "lucide-react";
import { AssignmentItem } from "@/lib/api";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Compiler", href: "/compiler" },
  { label: "Features", href: "/features" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

interface NavbarProps {
  activeAssignment?: AssignmentItem | null;
  onOpenAssignmentSelector?: () => void;
}

export default function Navbar({ activeAssignment, onOpenAssignmentSelector }: NavbarProps = {}) {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    router.prefetch("/compiler");
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [router]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        scrolled ? "glass-strong" : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="mx-auto max-w-7xl px-5 sm:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--syn-keyword)] via-[var(--syn-function)] to-[var(--syn-string)] shadow-[0_0_18px_rgba(184,146,255,0.35)]">
            <Terminal className="h-4 w-4 text-[#0a0d13]" strokeWidth={2.5} />
          </span>
          <span className="font-display font-semibold text-[15px] sm:text-[17px] tracking-tight text-[var(--ink)]">
            Cryptic <span className="text-gradient">to Clear</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-1 font-sans text-[14px]">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="relative px-4 py-2 rounded-md font-medium text-[var(--ink-dim)] hover:text-[var(--ink)] transition-colors group"
              >
                {link.label}
                <span className="absolute left-4 right-4 -bottom-0.5 h-px bg-gradient-to-r from-[var(--syn-keyword)] to-[var(--syn-function)] scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA & User Menu */}
        <div className="hidden md:flex items-center gap-3">
          {/* Assignments button — only shown on compiler page */}
          {onOpenAssignmentSelector && (
            <button
              onClick={onOpenAssignmentSelector}
              title="Open Course Assignments"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-mono border transition-all cursor-pointer shrink-0 ${
                activeAssignment
                  ? "bg-purple-500/10 border-purple-500/30 text-purple-300 font-semibold"
                  : "glass text-[var(--ink-dim)] hover:text-[var(--ink)] hover:border-[var(--border-strong)]"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 text-[var(--syn-keyword)]" />
              <span>{activeAssignment ? `Assignment: ${activeAssignment.title.slice(0, 18)}...` : "Assignments"}</span>
            </button>
          )}
          <ThemeToggle />
          {user ? (
            <UserMenu />
          ) : (
            <button
              onClick={() => openAuthModal("login")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-mono text-xs text-[var(--ink)] glass hover:bg-white/[0.08] border border-white/10 transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-[var(--syn-keyword)]" />
              <span>Sign In</span>
            </button>
          )}

          <Link
            href="/compiler"
            prefetch={true}
            className="relative inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium text-[#0a0d13] bg-gradient-to-r from-[var(--syn-keyword)] via-[var(--syn-function)] to-[var(--syn-string)] hover:brightness-110 transition-all shadow-[0_0_24px_rgba(108,182,255,0.25)]"
          >
            Start Coding
          </Link>
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            className="text-[var(--ink)] p-2"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden glass-strong border-t border-[var(--border)]"
          >
            <ul className="flex flex-col px-5 py-4 gap-1 font-sans text-sm">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2.5 rounded-md font-medium text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-white/5 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}

              {/* Assignments button — mobile, only on compiler page */}
              {onOpenAssignmentSelector && (
                <li>
                  <button
                    onClick={() => {
                      setOpen(false);
                      onOpenAssignmentSelector();
                    }}
                    className={`w-full flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-mono transition-colors ${
                      activeAssignment
                        ? "bg-purple-500/10 text-purple-300 font-semibold"
                        : "text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-white/5"
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-[var(--syn-keyword)]" />
                    <span>{activeAssignment ? `Assignment: ${activeAssignment.title.slice(0, 18)}...` : "Assignments"}</span>
                  </button>
                </li>
              )}

              {!user && (
                <li className="pt-1">
                  <button
                    onClick={() => {
                      setOpen(false);
                      openAuthModal("login");
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-mono text-[var(--ink)] glass border border-white/10"
                  >
                    <LogIn className="w-4 h-4 text-[var(--syn-keyword)]" />
                    <span>Sign In / Create Account</span>
                  </button>
                </li>
              )}

              <li className="pt-2">
                <Link
                  href="/compiler"
                  onClick={() => setOpen(false)}
                  className="block text-center rounded-lg px-4 py-2.5 text-sm font-medium text-[#0a0d13] bg-gradient-to-r from-[var(--syn-keyword)] via-[var(--syn-function)] to-[var(--syn-string)]"
                >
                  Start Coding
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
