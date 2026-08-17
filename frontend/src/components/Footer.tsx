import Link from "next/link";
import { Terminal, Code2, Globe, Mail } from "lucide-react";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Compiler", href: "/compiler" },
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/#careers" },
      { label: "Blog", href: "/#blog" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/#docs" },
      { label: "Contact", href: "/contact" },
      { label: "Support", href: "/#support" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-[var(--border)]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--syn-keyword)]/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 group">
              <img
                src="/logo-icon.png"
                alt="Cryptic to Clear Logo Icon"
                className="h-10 sm:h-11 w-auto object-contain filter drop-shadow-[0_0_14px_rgba(255,255,255,0.25)]"
              />
              <div className="flex flex-col justify-center leading-none">
                <span className="font-logo-title font-bold text-[18px] tracking-[0.06em] text-[var(--ink)]">
                  CRYPTIC
                </span>
                <span className="font-sans font-semibold text-[10px] tracking-[0.3em] text-[var(--ink-dim)] mt-1">
                  TO CLEAR
                </span>
              </div>
            </Link>
            <p className="mt-4 text-sm text-[var(--ink-dim)] max-w-xs leading-relaxed">
              Cryptic to Clear: A tiny compiler that explains its own errors.
              It doesn&apos;t just show you an error — it teaches you how to fix it.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {[Code2, Globe, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social link"
                  className="h-9 w-9 flex items-center justify-center rounded-lg glass text-[var(--ink-dim)] hover:text-[var(--ink)] hover:border-[var(--border-strong)] transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="font-mono text-[12px] text-[var(--syn-function)] mb-4">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--ink-dim)] hover:text-[var(--ink)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--ink-faint)] font-mono">
            © {new Date().getFullYear()} Cryptic to Clear. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-[var(--ink-faint)] font-mono">
            <Link href="/#privacy" className="hover:text-[var(--ink-dim)] transition-colors">
              Privacy
            </Link>
            <Link href="/#terms" className="hover:text-[var(--ink-dim)] transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
