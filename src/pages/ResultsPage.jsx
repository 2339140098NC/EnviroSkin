import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const placeholderPredictions = [
  {
    label: "Allergic contact dermatitis",
    probability: 34,
    note: "Exposure patterns and symptom mix can be compatible with contact-driven inflammation.",
    guidance:
      "Consider product or environmental triggers, avoid obvious new exposures, and seek in-person care if the area is rapidly worsening, severe, or involving the face or eyes.",
  },
  {
    label: "Irritant or friction-related rash",
    probability: 26,
    note: "Could fit with skin barrier disruption, outdoor exposure, or topical products.",
    guidance:
      "Gentle cleansing and avoiding additional irritating products may be reasonable while waiting for clinical review. Escalate if there is pain, spreading redness, or drainage.",
  },
  {
    label: "Medication or topical reaction",
    probability: 22,
    note: "Medication history and topical product use can raise this possibility.",
    guidance:
      "Bring a list of recent medications and products into follow-up. If there are widespread symptoms, blistering, or systemic illness, urgent medical evaluation may be appropriate.",
  },
  {
    label: "Outdoor or exposure-associated lesion",
    probability: 18,
    note: "Recent sun, water, vegetation, or animal exposure may be clinically relevant.",
    guidance:
      "Capture when and where the exposure happened, and monitor for progression, itching, pain, or signs of infection while preparing the next clinical step.",
  },
];

function formatResponse(value, otherText, details) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "Not provided";
    }

    const parts = value.filter((item) => item !== "Other");

    if (value.includes("Other") && otherText) {
      parts.push(`Other: ${otherText}`);
    }

    return parts.join(", ");
  }

  if (!value) {
    return "Not provided";
  }

  if (value === "Other" && otherText) {
    return `Other: ${otherText}`;
  }

  if (value === "Yes" && details) {
    return `Yes - ${details}`;
  }

  return value;
}

function ResultsPage() {
  const location = useLocation();
  const submission = location.state?.submission;
  const [expandedGuidance, setExpandedGuidance] = useState(
    placeholderPredictions[0].label,
  );

  if (!submission) {
    return (
      <div className="min-h-screen bg-transparent px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/80 bg-white/85 p-8 shadow-soft backdrop-blur-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Prediction Results
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
            No intake submission found.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Complete the EnviroSkin intake, upload, and review flow first so we can
            prepare a prediction-ready summary and guidance view.
          </p>
          <Link
            to="/questions"
            className="mt-8 inline-flex rounded-full bg-blue-500 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600"
          >
            Start Intake
          </Link>
        </div>
      </div>
    );
  }

  const summaryItems = [
    {
      label: "Onset timing",
      value: formatResponse(submission.onsetTiming, submission.onsetTimingOtherText),
    },
    {
      label: "Progression",
      value: formatResponse(submission.progression, submission.progressionOtherText),
    },
    {
      label: "Previous episodes",
      value: formatResponse(
        submission.previousEpisodes,
        submission.previousEpisodesOtherText,
      ),
    },
    {
      label: "Symptoms",
      value: formatResponse(submission.symptoms, submission.symptomsOtherText),
    },
    {
      label: "Systemic symptoms",
      value: formatResponse(
        submission.systemicSymptoms,
        submission.systemicSymptomsOtherText,
        submission.systemicSymptomsDetails,
      ),
    },
    {
      label: "Sick contacts",
      value: formatResponse(
        submission.sickContacts,
        submission.sickContactsOtherText,
        submission.sickContactsDetails,
      ),
    },
    {
      label: "Travel history",
      value: formatResponse(
        submission.recentTravel,
        submission.recentTravelOtherText,
        submission.recentTravelDetails,
      ),
    },
    {
      label: "Recent locations",
      value: formatResponse(
        submission.recentLocation,
        submission.recentLocationOtherText,
      ),
    },
    {
      label: "Animal exposure",
      value: formatResponse(
        submission.animalExposure,
        submission.animalExposureOtherText,
        submission.animalExposureDetails,
      ),
    },
    {
      label: "Plant exposure",
      value: formatResponse(
        submission.plantExposure,
        submission.plantExposureOtherText,
        submission.plantExposureDetails,
      ),
    },
    {
      label: "Water exposure",
      value: formatResponse(
        submission.oceanExposure,
        submission.oceanExposureOtherText,
        submission.oceanExposureDetails,
      ),
    },
    {
      label: "Sun exposure",
      value: formatResponse(submission.sunExposure, submission.sunExposureOtherText),
    },
    {
      label: "Sexual history context",
      value: formatResponse(
        submission.sexualHistoryRelevant,
        submission.sexualHistoryRelevantOtherText,
        submission.sexualHistoryRelevantDetails,
      ),
    },
    {
      label: "Immunosuppression or healing concerns",
      value: formatResponse(
        submission.immunosuppression,
        submission.immunosuppressionOtherText,
        submission.immunosuppressionDetails,
      ),
    },
    {
      label: "New medications",
      value: formatResponse(
        submission.newMedications,
        submission.newMedicationsOtherText,
      ),
    },
    {
      label: "Medication types",
      value: formatResponse(
        submission.medicationTypes,
        submission.medicationTypesOtherText,
      ),
    },
    {
      label: "OTC or herbal products",
      value: formatResponse(
        submission.otcOrHerbalUse,
        submission.otcOrHerbalUseOtherText,
        submission.otcOrHerbalUseDetails,
      ),
    },
    {
      label: "Drug reaction history",
      value: formatResponse(
        submission.drugReactionHistory,
        submission.drugReactionHistoryOtherText,
        submission.drugReactionHistoryDetails,
      ),
    },
  ];

  const payloadPreview = JSON.stringify(
    {
      ...submission,
      uploadedImageFile: submission.uploadedImageFile
        ? {
            name: submission.uploadedImageFile.name,
            type: submission.uploadedImageFile.type,
            size: submission.uploadedImageFile.size,
          }
        : null,
    },
    null,
    2,
  );

  return (
    <div className="min-h-screen bg-transparent px-6 py-10 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link to="/" className="text-2xl font-semibold tracking-tight text-ink">
            EnviroSkin
          </Link>
          <div className="flex gap-3">
            <Link
              to="/questions"
              className="rounded-full border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur"
            >
              Edit Intake
            </Link>
            <Link
              to="/"
              className="rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600"
            >
              Return Home
            </Link>
          </div>
        </div>

        <section className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-soft backdrop-blur-xl sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Prediction Results
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Top possible causes based on the submitted case.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            This page is backend-ready and currently uses placeholder probability
            outputs for interface development. The complete intake payload and image
            metadata are already being passed forward in one object.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[1.75rem] border border-slate-200 bg-[#fbfdff] p-5 sm:p-6">
              <h2 className="text-xl font-semibold tracking-tight text-ink">
                Probability graph
              </h2>
              <div className="mt-6 space-y-5">
                {placeholderPredictions.map((prediction) => (
                  <div key={prediction.label}>
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-base font-semibold text-ink">
                        {prediction.label}
                      </p>
                      <p className="text-sm font-semibold text-blue-600">
                        {prediction.probability}%
                      </p>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-teal"
                        style={{ width: `${prediction.probability}%` }}
                      />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {prediction.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-[#fbfdff] p-5 sm:p-6">
              <h2 className="text-xl font-semibold tracking-tight text-ink">
                Uploaded image
              </h2>
              {submission.uploadedImagePreviewUrl ? (
                <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-50">
                  <img
                    src={submission.uploadedImagePreviewUrl}
                    alt="Uploaded skin preview"
                    className="h-72 w-full object-cover"
                  />
                </div>
              ) : (
                <p className="mt-4 text-base leading-7 text-slate-600">
                  No image preview is available.
                </p>
              )}
              <p className="mt-4 text-sm font-medium text-slate-500">
                File: {submission.uploadedImageName || "Not available"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[1.75rem] border border-slate-200 bg-[#fbfdff] p-5 sm:p-6">
              <h2 className="text-xl font-semibold tracking-tight text-ink">
                Expandable care guidance
              </h2>
              <div className="mt-5 space-y-3">
                {placeholderPredictions.map((prediction) => {
                  const isOpen = expandedGuidance === prediction.label;

                  return (
                    <div
                      key={prediction.label}
                      className="rounded-2xl border border-slate-200 bg-white"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedGuidance((current) =>
                            current === prediction.label ? "" : prediction.label,
                          )
                        }
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                      >
                        <span className="text-base font-semibold text-ink">
                          {prediction.label}
                        </span>
                        <span className="text-sm font-semibold text-blue-600">
                          {isOpen ? "Hide" : "Show"}
                        </span>
                      </button>
                      {isOpen ? (
                        <div className="border-t border-slate-100 px-5 py-4">
                          <p className="text-sm leading-6 text-slate-600">
                            {prediction.guidance}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-[#fbfdff] p-5 sm:p-6">
              <h2 className="text-xl font-semibold tracking-tight text-ink">
                Intake summary
              </h2>
              <div className="mt-5 grid gap-3">
                {summaryItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                  >
                    <p className="text-sm font-medium text-slate-500">{item.label}</p>
                    <p className="mt-1 text-base font-semibold text-ink">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-[#fbfdff] p-5 sm:p-6">
            <h2 className="text-xl font-semibold tracking-tight text-ink">
              Structured payload preview
            </h2>
            <pre className="mt-5 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm leading-7 text-slate-100">
{payloadPreview}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ResultsPage;
