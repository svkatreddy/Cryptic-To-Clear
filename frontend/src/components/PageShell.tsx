import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[var(--bg)] flex flex-col">
      <Navbar />
      <section className="relative flex-1 pt-36 sm:pt-44 pb-24 editor-grid overflow-hidden">
        <div className="blob h-[380px] w-[380px] bg-[var(--syn-keyword)] -top-32 -left-24" />
        <div className="blob h-[320px] w-[320px] bg-[var(--syn-function)] top-10 -right-20" />

        <div className="relative mx-auto max-w-3xl px-5 sm:px-8 text-center">
          <span className="font-mono text-[12px] text-[var(--syn-function)]">
            {"// "}
            {eyebrow}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-3 tracking-tight">
            {title}
          </h1>
          <p className="mt-4 text-[var(--ink-dim)] text-base leading-relaxed">
            {description}
          </p>

          <div className="mt-10 glass rounded-xl p-8 sm:p-10">
            {children ?? (
              <p className="font-mono text-sm text-[var(--ink-faint)]">
                <span className="text-[var(--syn-const)]">$</span> building this
                page in the next phase
                <span className="caret text-[var(--syn-cursor)]">▍</span>
              </p>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
