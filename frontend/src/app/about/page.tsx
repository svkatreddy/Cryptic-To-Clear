import PageShell from "@/components/PageShell";

export const metadata = { title: "About — CodeMentor AI" };

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="the mission"
      title="Why we're building CodeMentor AI"
      description="The story, the team, and the mission behind an AI compiler that teaches instead of just erroring out — coming in the next phase."
    />
  );
}
