function HowItWorksSection() {
  const steps = [
    {
      title: "Capture the skin concern",
      description:
        "Upload a clear photo and record when you noticed the change so the model has the right visual context.",
    },
    {
      title: "Add recent exposure history",
      description:
        "Answer a short intake about sun, ocean, plants, and symptoms to ground the image in real-world context.",
    },
    {
      title: "Receive a safer recommendation",
      description:
        "EnviroSkin combines the image and environmental signals to provide a structured next-step recommendation.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="relative mx-auto max-w-7xl px-6 pb-20 lg:px-10 lg:pb-28"
    >
      <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-cyan-200/35 blur-[120px]" />
      <div className="glass-panel relative overflow-hidden rounded-[2rem] p-8 sm:p-10">
        <div className="relative z-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Workflow
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            A guided intake designed for fast, contextual triage.
          </h2>
        </div>

        <div className="relative z-10 mt-10 grid gap-5 lg:grid-cols-3">
          {steps.map((step, index) => (
            <article
              key={step.title}
              className="glass-surface rounded-[1.75rem] p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/65 text-sm font-semibold text-blue-700 shadow-sm">
                0{index + 1}
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-tight text-ink">
                {step.title}
              </h3>
              <p className="mt-3 text-base leading-7 text-slate-600">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;
