import PageShell from "@/components/PageShell";

export const metadata = { title: "About — Cryptic to Clear" };

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="the mission"
      title="Why we're building Cryptic to Clear"
      description="The story, the team, and the mission behind an AI compiler that teaches instead of just erroring out — coming in the next phase."
    />
  );
}
