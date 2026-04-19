import { Link } from "react-router-dom";
import ResultsBorderGlow from "./ResultsBorderGlow";

function HeroImagePreview() {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <ResultsBorderGlow className="rounded-[2.5rem] p-4 sm:p-5">
        <div className="overflow-hidden rounded-[2.1rem] bg-[rgba(232,242,248,0.74)]">
          <img
            src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80"
            alt="Close-up portrait preview for EnviroSkin"
            className="h-[420px] w-full object-cover object-center sm:h-[450px]"
          />
        </div>
      </ResultsBorderGlow>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden translate-y-[-2rem]">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-10 lg:py-24">
        <div className="relative">
          <div className="glass-surface inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-900">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full bg-cyan-700"
            />
            Instant AI Analysis
          </div>
          <h1 className="mt-8 text-5xl font-semibold tracking-tight text-ink sm:text-6xl lg:text-7xl">
            Your skin,
            <br />
            <span className="text-blue-500">seen clearly.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
            EnviroSkin is an AI-powered skin health and environmental triage
            platform that combines skin images, recent exposure history, and
            environmental context to deliver a safer recommendation for what to do
            next.
          </p>
          <div className="mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <Link
              to="/questions"
              className="glass-button rounded-full px-8 py-4 text-lg font-semibold text-white transition hover:brightness-105"
            >
              Begin Assessment
            </Link>
            <a
              href="#how-it-works"
              className="glass-surface inline-flex items-center gap-3 rounded-full px-5 py-3 text-lg font-semibold text-blue-700 transition hover:bg-white/60"
            >
              How it works
              <span aria-hidden="true" className="text-2xl">
                &rarr;
              </span>
            </a>
          </div>
        </div>
        <HeroImagePreview />
      </div>
    </section>
  );
}

export default HeroSection;
