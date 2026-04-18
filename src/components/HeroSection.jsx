import { Link } from "react-router-dom";

function HeroImagePreview() {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="rounded-[2.5rem] border border-white/80 bg-white/70 p-4 shadow-soft backdrop-blur-xl sm:p-5">
        <div className="overflow-hidden rounded-[2.1rem] bg-[#edf4f8]">
          <img
            src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80"
            alt="Close-up portrait preview for EnviroSkin"
            className="h-[420px] w-full object-cover object-center sm:h-[450px]"
          />
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden translate-y-[-2rem]">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-10 lg:py-24">
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-900 shadow-sm">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full bg-slate-900"
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
              className="rounded-full bg-blue-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600"
            >
              Begin Assessment
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-3 text-lg font-semibold text-blue-600 transition hover:text-blue-700"
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
