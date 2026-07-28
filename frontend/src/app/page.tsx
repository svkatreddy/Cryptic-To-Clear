import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeatureHighlights from "@/components/FeatureHighlights";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <Navbar />
      <Hero />
      <FeatureHighlights />
      <Footer />
    </main>
  );
}
