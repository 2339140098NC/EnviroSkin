import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";
import ResultsBorderGlow from "../components/ResultsBorderGlow";
import { useI18n } from "../i18n/I18nProvider";

function formatCalcofiForPreview(calcofiContext) {
  if (!calcofiContext) {
    return null;
  }

  return {
    location: {
      zipCode: calcofiContext.query?.zipCode || null,
      city: calcofiContext.geocode?.city || null,
      state: calcofiContext.geocode?.state || null,
      lat: calcofiContext.geocode?.lat ?? null,
      lon: calcofiContext.geocode?.lon ?? null,
    },
    relevance: {
      rankBy: calcofiContext.query?.rankBy || null,
      targetDate: calcofiContext.query?.targetDate || null,
      sampleCount: calcofiContext.summary?.sampleCount ?? null,
      minDistanceKm: calcofiContext.summary?.minDistanceKm ?? null,
      minLagDays: calcofiContext.summary?.minLagDays ?? null,
    },
    oceanSignals: {
      avgTempC: calcofiContext.summary?.avgTempC ?? null,
      avgSalinity: calcofiContext.summary?.avgSalinity ?? null,
      avgOxygenUmolKg: calcofiContext.summary?.avgOxygenUmolKg ?? null,
      avgNitrate: calcofiContext.summary?.avgNitrate ?? null,
      avgChlorophyll: calcofiContext.summary?.avgChlorophyll ?? null,
    },
    closestLocation: calcofiContext.bestObservation
      ? {
          observedAtUtc: calcofiContext.bestObservation.observedAtUtc,
          stationId: calcofiContext.bestObservation.stationId,
          distanceKm: calcofiContext.bestObservation.distanceKm,
          lagDays: calcofiContext.bestObservation.lagDays,
          depthM: calcofiContext.bestObservation.depthM,
          tempC: calcofiContext.bestObservation.tempC,
          salinity: calcofiContext.bestObservation.salinity,
          oxygenUmolKg: calcofiContext.bestObservation.oxygenUmolKg,
          nitrateEst: calcofiContext.bestObservation.nitrateEst,
          chlorophyllEst: calcofiContext.bestObservation.chlorophyllEst,
        }
      : null,
  };
}

const DRIVER_META = [
  { key: "uv_exposure", name: "UV Exposure" },
  { key: "water_conditions", name: "Water Conditions" },
  { key: "air_quality", name: "Air Quality" },
  { key: "plant_exposure", name: "Plant Exposure" },
  { key: "heat_and_humidity", name: "Heat and Humidity" },
];

function driversFromAnalysis(analysis) {
  const drivers = analysis?.environmental_drivers || {};
  return DRIVER_META.map(({ key, name }) => {
    const entry = drivers[key] || {};
    return {
      name,
      value: entry.value || "Not available",
      explanation: entry.explanation || "Local data unavailable for this location.",
    };
  });
}

function translateJsonValues(value, t) {
  if (typeof value === "string") {
    return t(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => translateJsonValues(item, t));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        translateJsonValues(nestedValue, t),
      ]),
    );
  }

  return value;
}

function ResultsPage() {
  const { t } = useI18n();
  const location = useLocation();
  const submission = location.state?.submission;
  const analysis = location.state?.analysis;
  const [imageUrl, setImageUrl] = useState(null);
  const [showPayload, setShowPayload] = useState(false);

  useEffect(() => {
    const file = submission?.uploadedImageFile;

    if (!file) {
      setImageUrl(null);
      return undefined;
    }

    const url = URL.createObjectURL(file);
    setImageUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [submission?.uploadedImageFile]);

  const payloadPreview = useMemo(
    () =>
      submission
        ? JSON.stringify(
            translateJsonValues({
              ...submission,
              calcofiContext: formatCalcofiForPreview(submission.calcofiContext),
              uploadedImageFile: submission.uploadedImageFile
                ? {
                    name: submission.uploadedImageFile.name,
                    type: submission.uploadedImageFile.type,
                    size: submission.uploadedImageFile.size,
                  }
                : null,
              analysis,
            }, t),
            null,
            2,
          )
        : "",
    [submission, analysis, t],
  );

  if (!submission) {
    return (
      <div className="min-h-screen bg-transparent px-6 py-12">
        <div className="glass-panel mx-auto max-w-3xl rounded-[2rem] p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            {t("Prediction Results")}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
            {t("No intake submission found.")}
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            {t("Complete the EnviroSkin intake, upload, and review flow first so we can prepare a prediction-ready summary and results view.")}
          </p>
          <Link
            to="/questions"
            className="glass-button mt-8 inline-flex rounded-full px-7 py-3 text-base font-semibold text-white transition hover:brightness-105"
          >
            {t("Start Intake")}
          </Link>
        </div>
      </div>
    );
  }

  const conditionName = analysis?.condition_name ? t(analysis.condition_name) : t("Analysis pending");
  const confidence = typeof analysis?.confidence === "number" ? analysis.confidence : 0;
  const confidencePercent = Math.round(confidence * 100);
  const whyFlagged = Array.isArray(analysis?.why_flagged) ? analysis.why_flagged : [];
  const environmentalDrivers = driversFromAnalysis(analysis);
  const insightSections = [
    { title: t("Possible Causes"), items: analysis?.causes || [] },
    { title: t("Common Symptoms"), items: analysis?.symptoms || [] },
    { title: t("Recommended Care"), items: analysis?.treatments || [] },
    { title: t("Risk Factors"), items: analysis?.risks || [] },
  ];

  return (
    <div className="min-h-screen bg-transparent px-6 py-10 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link to="/" className="text-2xl font-semibold tracking-tight text-ink">
            {t("EnviroSkin")}
          </Link>
          <div className="flex gap-3">
            <LanguageSwitcher />
            <Link
              to="/questions"
              className="glass-button-secondary rounded-full px-5 py-2.5 text-sm font-semibold text-slate-700"
            >
              {t("Edit Intake")}
            </Link>
            <Link
              to="/"
              className="glass-button rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-105"
            >
              {t("Return Home")}
            </Link>
          </div>
        </div>

        <ResultsBorderGlow className="p-6 sm:p-8 lg:p-10">
          <header className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              {t("Prediction Results")}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              {t("Prediction Results")}
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
              {t("This is a possible match based on your inputs. Not a medical diagnosis.")}
            </p>
            {analysis?.explanation ? (
              <p className="mt-4 text-base leading-7 text-slate-600">
                {t(analysis.explanation)}
              </p>
            ) : null}
          </header>

          <div className="glass-surface results-primary-glow mx-auto mt-10 max-w-5xl rounded-[2rem] p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                  {t("Primary Match")}
                </p>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                  {conditionName}
                </h2>

                <div className="glass-surface mt-8 rounded-[1.5rem] p-5">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{t("Confidence")}</p>
                      <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
                        {confidencePercent}%
                      </p>
                    </div>
                    <p className="text-sm leading-6 text-slate-500">
                      {t("Confidence")}: {confidencePercent}%
                    </p>
                  </div>
                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/55">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-teal"
                      style={{ width: `${confidencePercent}%` }}
                    />
                  </div>
                </div>

                <section className="glass-surface mt-8 rounded-[1.5rem] p-5">
                  <h3 className="text-lg font-semibold tracking-tight text-ink">
                    {t("Why this was flagged")}
                  </h3>
                  {whyFlagged.length > 0 ? (
                    <ul className="mt-4 space-y-3">
                      {whyFlagged.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                          <span className="text-sm leading-6 text-slate-600">{t(item)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-sm leading-6 text-slate-500">
                      {t("No flagging rationale available.")}
                    </p>
                  )}
                </section>
              </div>

              <div>
                <div className="glass-surface rounded-[1.75rem] p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {t("Uploaded Image")}
                  </p>
                  {imageUrl ? (
                    <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/45 bg-white/45 shadow-sm backdrop-blur-xl">
                      <img
                        src={imageUrl}
                        alt={t("Uploaded skin preview")}
                        className="h-[26rem] w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="mt-5 rounded-[1.5rem] border border-dashed border-white/45 bg-white/45 px-6 py-12 text-center backdrop-blur-xl">
                      <p className="text-sm leading-6 text-slate-500">
                        {t("No uploaded image preview is available.")}
                      </p>
                    </div>
                  )}
                  <p className="mt-4 text-sm font-medium text-slate-500">
                    {t("File")}: {submission.uploadedImageName || t("Not available")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <section className="glass-surface mx-auto mt-8 max-w-5xl rounded-[1.75rem] p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-ink">
                  {t("Condition Overview")}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {t("A quick 2 by 2 summary of likely causes, symptoms, care, and risk context.")}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {insightSections.map((section) => (
                <section
                  key={section.title}
                  className="glass-surface hover-border-glow rounded-[1.5rem] p-5"
                >
                  <h3 className="text-lg font-semibold tracking-tight text-ink">
                    {section.title}
                  </h3>
                  {section.items.length > 0 ? (
                    <ul className="mt-4 space-y-3">
                      {section.items.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                          <span className="text-sm leading-6 text-slate-600">{t(item)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-sm leading-6 text-slate-500">
                      {t("Not available.")}
                    </p>
                  )}
                </section>
              ))}
            </div>
          </section>

          <section className="glass-surface mx-auto mt-8 max-w-5xl rounded-[1.75rem] p-5 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight text-ink">
              {t("Environmental Drivers")}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {t("Larger cards give each environmental signal enough space for a fuller explanation.")}
            </p>
            <div className="mt-5 space-y-5">
              <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <article className="glass-surface overflow-hidden rounded-[1.5rem]">
                  <div className="border-b border-white/40 px-5 py-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                      {t("UV Exposure Map")}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {t("Dedicated space for a future UV intensity map or heat layer.")}
                    </p>
                  </div>
                  <div className="flex h-72 items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_35%),linear-gradient(135deg,_#eff6ff,_#f8fafc_55%,_#e0f2fe)] px-6 text-center">
                    <div>
                      <p className="text-base font-semibold text-ink">{t("Map placeholder")}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {t("Use this panel for a UV map focused on the user's current location.")}
                      </p>
                    </div>
                  </div>
                </article>

                <article className="glass-surface relative min-h-[18rem] overflow-hidden rounded-[1.5rem] p-6">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_35%),linear-gradient(135deg,_rgba(239,246,255,0.9),_rgba(248,250,252,0.78)_55%,_rgba(224,242,254,0.86))]"
                  />
                  <div className="relative z-10">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                      {t(environmentalDrivers[0].name)}
                    </p>
                    <p className="mt-3 text-lg font-semibold tracking-tight text-ink">
                      {t(environmentalDrivers[0].value)}
                    </p>
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {t(environmentalDrivers[0].explanation)}
                    </p>
                  </div>
                </article>
              </div>

              <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <article className="glass-surface overflow-hidden rounded-[1.5rem]">
                  <div className="border-b border-white/40 px-5 py-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                      {t("Air Quality Map")}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {t("Dedicated space for AQI layers, plume overlays, or station-based markers.")}
                    </p>
                  </div>
                  <div className="flex h-72 items-center justify-center bg-[radial-gradient(circle_at_top_right,_rgba(20,184,166,0.18),_transparent_35%),linear-gradient(135deg,_#ecfeff,_#f8fafc_55%,_#f0fdfa)] px-6 text-center">
                    <div>
                      <p className="text-base font-semibold text-ink">{t("Map placeholder")}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {t("Use this panel for local air quality context around the intake location.")}
                      </p>
                    </div>
                  </div>
                </article>
                <article className="glass-surface relative min-h-[18rem] overflow-hidden rounded-[1.5rem] p-6">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(20,184,166,0.18),_transparent_35%),linear-gradient(135deg,_rgba(236,254,255,0.9),_rgba(248,250,252,0.78)_55%,_rgba(240,253,250,0.86))]"
                  />
                  <div className="relative z-10">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                      {t(environmentalDrivers[2].name)}
                    </p>
                    <p className="mt-3 text-lg font-semibold tracking-tight text-ink">
                      {t(environmentalDrivers[2].value)}
                    </p>
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {t(environmentalDrivers[2].explanation)}
                    </p>
                  </div>
                </article>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {environmentalDrivers
                  .filter((driver) => driver.name !== "UV Exposure" && driver.name !== "Air Quality")
                  .map((driver) => (
                    <article
                      key={driver.name}
                      className="glass-surface hover-border-glow-green min-h-[15rem] rounded-[1.5rem] p-6"
                    >
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                        {t(driver.name)}
                      </p>
                      <p className="mt-3 text-lg font-semibold tracking-tight text-ink">
                        {t(driver.value)}
                      </p>
                      <p className="mt-4 text-sm leading-7 text-slate-600">
                        {t(driver.explanation)}
                      </p>
                    </article>
                  ))}
              </div>
            </div>
          </section>

          <section className="glass-surface mx-auto mt-8 max-w-5xl rounded-[1.75rem] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-ink">
                  {t("Structured Intake Data (Testing Only)")}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {t("Developer-facing payload preview for verification and backend handoff.")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPayload((current) => !current)}
                className="glass-button-secondary rounded-full px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white/65"
              >
                {showPayload ? t("Hide Data") : t("Show Data")}
              </button>
            </div>

            {showPayload ? (
              <pre className="mt-5 max-h-[28rem] overflow-auto rounded-2xl bg-slate-950 p-4 text-sm leading-7 text-slate-100">
{payloadPreview}
              </pre>
            ) : null}
          </section>
        </ResultsBorderGlow>
      </div>
    </div>
  );
}

export default ResultsPage;
