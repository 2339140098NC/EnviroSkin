import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import QuestionOption from "../components/QuestionOption";
import { intakeSteps } from "../data/questions";

const initialFormData = {
  zipCode: "",
  recentLocation: "",
  onsetCategory: "",
  onsetSpecificTiming: "",
  progression: "",
  previousEpisodes: "",
  symptoms: [],
  systemicSymptoms: "",
  sickContacts: "",
  recentTravel: "",
  animalExposure: "",
  plantExposure: "",
  oceanExposure: "",
  sunExposure: "",
  immunosuppression: "",
  newMedications: "",
  medicationTypes: [],
  otcOrHerbalUse: "",
  drugReactionHistory: "",
  sexualHistoryRelevant: "",
  uploadedImageFile: null,
  uploadedImageName: "",
  uploadedImagePreviewUrl: "",
};

const uploadStep = {
  key: "uploadedImageFile",
  type: "upload",
  prompt: "Upload Skin Photo",
  subtitle:
    "Add a clear image so EnviroSkin can combine your intake history with visual analysis.",
};

const acceptedFileTypes = ["image/jpeg", "image/png", "image/webp"];

function formatAnswer(value) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "Not provided";
  }

  if (value instanceof File) {
    return value.name;
  }

  return value || "Not provided";
}

function UploadIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-10 w-10"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 16a4 4 0 0 1-.88-7.903A5.5 5.5 0 0 1 16.5 9H17a4 4 0 0 1 0 8h-2.5M12 11v8m0-8-3 3m3-3 3 3"
      />
    </svg>
  );
}

function QuestionsPage() {
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef("");
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [formData, setFormData] = useState(initialFormData);

  const visibleSteps = useMemo(() => {
    const questionSteps = intakeSteps.filter(
      (step) => !step.isVisible || step.isVisible(formData),
    );

    return [...questionSteps, uploadStep];
  }, [formData]);

  const step = visibleSteps[currentStep];
  const currentValue = formData[step.key];
  const progress = ((currentStep + 1) / visibleSteps.length) * 100;

  const intakeSummary = useMemo(
    () =>
      visibleSteps.map(({ key, prompt, type }) => ({
        prompt,
        answer:
          type === "upload"
            ? formData.uploadedImageName || "No image selected"
            : formatAnswer(formData[key]),
      })),
    [formData, visibleSteps],
  );

  useEffect(() => {
    if (currentStep > visibleSteps.length - 1) {
      setCurrentStep(visibleSteps.length - 1);
    }
  }, [currentStep, visibleSteps.length]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const isCurrentStepValid = () => {
    if (!step) {
      return false;
    }

    if (step.type === "multi") {
      return Array.isArray(currentValue) && currentValue.length > 0;
    }

    if (step.type === "upload") {
      return Boolean(formData.uploadedImageFile);
    }

    if (step.type === "text") {
      if (typeof step.validate === "function") {
        return step.validate(currentValue);
      }
      return Boolean((currentValue || "").trim());
    }

    return Boolean(currentValue);
  };

  const handleTextChange = (value) => {
    setFormData((previous) => ({
      ...previous,
      [step.key]: value,
    }));
  };

  const handleSingleSelect = (value) => {
    setFormData((previous) => {
      const nextFormData = {
        ...previous,
        [step.key]: value,
      };

      if (step.key === "newMedications" && value === "No") {
        nextFormData.medicationTypes = [];
      }

      return nextFormData;
    });
  };

  const handleMultiSelect = (value) => {
    setFormData((previous) => {
      const currentItems = previous[step.key];
      const nextItems = currentItems.includes(value)
        ? currentItems.filter((item) => item !== value)
        : [...currentItems, value];

      return {
        ...previous,
        [step.key]: nextItems,
      };
    });
  };

  const updateUploadedImage = (file) => {
    if (!file) {
      return;
    }

    if (!acceptedFileTypes.includes(file.type)) {
      setUploadError("Please upload a jpg, jpeg, png, or webp image.");
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    previewUrlRef.current = nextPreviewUrl;
    setUploadError("");

    setFormData((previous) => ({
      ...previous,
      uploadedImageFile: file,
      uploadedImageName: file.name,
      uploadedImagePreviewUrl: nextPreviewUrl,
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    updateUploadedImage(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDraggingFile(false);
    const file = event.dataTransfer.files?.[0];
    updateUploadedImage(file);
  };

  const handleRemoveImage = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setFormData((previous) => ({
      ...previous,
      uploadedImageFile: null,
      uploadedImageName: "",
      uploadedImagePreviewUrl: "",
    }));
    setUploadError("");
  };

  const handleNext = () => {
    if (!isCurrentStepValid()) {
      return;
    }

    if (currentStep === visibleSteps.length - 1) {
      setIsComplete(true);
      return;
    }

    setCurrentStep((previous) => previous + 1);
  };

  const handleBack = () => {
    if (isComplete) {
      setIsComplete(false);
      setCurrentStep(visibleSteps.length - 1);
      return;
    }

    setCurrentStep((previous) => Math.max(previous - 1, 0));
  };

  const stepLabel =
    step?.type === "upload"
      ? `Final step of ${visibleSteps.length}`
      : `Question ${currentStep + 1} of ${visibleSteps.length}`;

  const renderQuestionStep = () => (
    <div className="pt-8">
      <h2 className="text-2xl font-semibold tracking-tight text-ink">
        {step.prompt}
      </h2>
      {step.subtitle ? (
        <p className="mt-3 text-base leading-7 text-slate-600">{step.subtitle}</p>
      ) : null}
      <div className="mt-6 grid gap-3">
        {step.options.map((option) => {
          const isSelected =
            step.type === "multi"
              ? currentValue.includes(option)
              : currentValue === option;

          return (
            <QuestionOption
              key={option}
              label={option}
              isSelected={isSelected}
              onSelect={() =>
                step.type === "multi"
                  ? handleMultiSelect(option)
                  : handleSingleSelect(option)
              }
            />
          );
        })}
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="rounded-full border border-slate-200 px-6 py-3 text-base font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!isCurrentStepValid()}
          className="rounded-full bg-blue-500 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {step.type === "upload" ? "Complete Intake" : "Next"}
        </button>
      </div>
    </div>
  );

  const renderTextStep = () => (
    <div className="pt-8">
      <h2 className="text-2xl font-semibold tracking-tight text-ink">
        {step.prompt}
      </h2>
      {step.subtitle ? (
        <p className="mt-3 text-base leading-7 text-slate-600">{step.subtitle}</p>
      ) : null}
      <div className="mt-6">
        <input
          type="text"
          value={currentValue || ""}
          onChange={(event) => handleTextChange(event.target.value)}
          placeholder={step.placeholder || ""}
          inputMode={step.key === "zipCode" ? "numeric" : "text"}
          className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg text-ink shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="rounded-full border border-slate-200 px-6 py-3 text-base font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!isCurrentStepValid()}
          className="rounded-full bg-blue-500 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderUploadStep = () => (
    <div className="pt-8">
      <h2 className="text-2xl font-semibold tracking-tight text-ink">
        {step.prompt}
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
        {step.subtitle}
      </p>

      <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-[#fbfdff] p-5 sm:p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDraggingFile(true);
          }}
          onDragLeave={() => setIsDraggingFile(false)}
          onDrop={handleDrop}
          className={`flex w-full flex-col items-center justify-center rounded-[1.75rem] border-2 border-dashed px-6 py-12 text-center transition ${
            isDraggingFile
              ? "border-blue-400 bg-blue-50/60"
              : "border-slate-300 bg-white hover:border-blue-300 hover:bg-blue-50/30"
          }`}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <UploadIcon />
          </div>
          <p className="mt-6 text-xl font-semibold tracking-tight text-ink">
            Drag and drop an image here, or click to browse
          </p>
          <p className="mt-3 max-w-lg text-base leading-7 text-slate-600">
            Accepted file types: jpg, jpeg, png, webp. Use a clear, well-lit photo
            of the affected area.
          </p>
        </button>

        {uploadError ? (
          <p className="mt-4 text-sm font-medium text-rose-600">{uploadError}</p>
        ) : null}

        {formData.uploadedImageName ? (
          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Selected file</p>
                <p className="mt-1 text-base font-semibold text-ink">
                  {formData.uploadedImageName}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  Remove
                </button>
              </div>
            </div>

            {formData.uploadedImagePreviewUrl ? (
              <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-50">
                <img
                  src={formData.uploadedImagePreviewUrl}
                  alt="Selected skin upload preview"
                  className="h-64 w-full object-cover"
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="rounded-full border border-slate-200 px-6 py-3 text-base font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!isCurrentStepValid()}
          className="rounded-full bg-blue-500 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          Complete Intake
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent px-6 py-10 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link to="/" className="text-2xl font-semibold tracking-tight text-ink">
            EnviroSkin
          </Link>
          <Link
            to="/"
            className="rounded-full border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur"
          >
            Back to Home
          </Link>
        </div>

        <section className="rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-soft backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 border-b border-slate-200 pb-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                  Quick EnviroSkin Intake
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                  Answers help contextualize the skin analysis.
                </h1>
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                {isComplete ? "Review complete" : stepLabel}
              </div>
            </div>

            <p className="max-w-2xl text-base leading-7 text-slate-600">
              Provide recent exposure, symptom, and medication context, then add
              a skin photo so the final payload is ready for backend and LLM
              workflows.
            </p>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-teal transition-all duration-300"
                style={{ width: `${isComplete ? 100 : progress}%` }}
              />
            </div>
          </div>

          {!isComplete ? (
            step.type === "upload"
              ? renderUploadStep()
              : step.type === "text"
                ? renderTextStep()
                : renderQuestionStep()
          ) : (
            <div className="pt-8">
              <div className="rounded-[1.75rem] border border-teal/70 bg-gradient-to-br from-[#effcf9] to-[#dff8f2] p-6">
                <h2 className="text-2xl font-semibold tracking-tight text-ink">
                  Intake captured
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                  The questionnaire answers and uploaded photo metadata are now
                  stored together in one structured object, ready for backend
                  submission and LLM analysis.
                </p>
              </div>

              <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-[#fbfdff] p-6">
                <h3 className="text-lg font-semibold text-ink">
                  Structured response preview
                </h3>
                <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm leading-7 text-slate-100">
{JSON.stringify(formData, null, 2)}
                </pre>
              </div>

              {formData.uploadedImagePreviewUrl ? (
                <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-white p-5">
                  <p className="text-sm font-medium text-slate-500">Uploaded image preview</p>
                  <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-50">
                    <img
                      src={formData.uploadedImagePreviewUrl}
                      alt="Uploaded skin preview"
                      className="h-72 w-full object-cover"
                    />
                  </div>
                </div>
              ) : null}

              <div className="mt-6 grid gap-3">
                {intakeSummary.map((item) => (
                  <div
                    key={item.prompt}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-4"
                  >
                    <p className="text-sm font-medium text-slate-500">{item.prompt}</p>
                    <p className="mt-1 text-base font-semibold text-ink">{item.answer}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-full border border-slate-200 px-6 py-3 text-base font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Edit upload step
                </button>
                <Link
                  to="/"
                  className="rounded-full bg-blue-500 px-7 py-3 text-center text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600"
                >
                  Return Home
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default QuestionsPage;
