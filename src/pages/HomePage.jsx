import HeroSection from "../components/HeroSection";
import HowItWorksSection from "../components/HowItWorksSection";
import Navbar from "../components/Navbar";

function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent">
      <div className="pointer-events-none absolute inset-x-0 top-[-8rem] h-[24rem] bg-[radial-gradient(circle_at_top,rgba(122,198,255,0.24),transparent_55%)]" />
      <div className="pointer-events-none absolute left-[-8rem] top-[18rem] h-[22rem] w-[22rem] rounded-full bg-cyan-200/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[-10rem] top-[10rem] h-[26rem] w-[26rem] rounded-full bg-blue-200/20 blur-3xl" />
      <Navbar />
      <main className="relative z-10">
        <HeroSection />
        <HowItWorksSection />
      </main>
    </div>
  );
}

export default HomePage;
