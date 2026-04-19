import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import QuestionOption from "../components/QuestionOption";
import { initialFormData, intakeSteps, OTHER_OPTION } from "../data/questions";

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

function InputField({
  label,
  value,
  onChange,
  onKeyDown,
  placeholder,
  multiline = false,
}) {
  const baseClassName =
    "glass-surface mt-3 w-full rounded-2xl px-4 py-3 text-base text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100/70";

  return (
    <label className="mt-5 block">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      {multiline ? (
        <textarea
          rows="4"
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={`${baseClassName} resize-none`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={baseClassName}
        />
      )}
    </label>
  );
}

function isOtherSelected(step, value) {
  if (!step.otherTextField) {
    return false;
  }

  if (step.type === "multi") {
    return Array.isArray(value) && value.includes(OTHER_OPTION);
  }

  return value === OTHER_OPTION;
}

function sanitizeFormData(nextFormData) {
  const sanitizedFormData = { ...nextFormData };

  intakeSteps.forEach((step) => {
    const value = sanitizedFormData[step.field];

    if (step.otherTextField && !isOtherSelected(step, value)) {
      sanitizedFormData[step.otherTextField] = initialFormData[step.otherTextField];
    }

    if (step.followUpField && value !== "Yes") {
      sanitizedFormData[step.followUpField] = initialFormData[step.followUpField];
    }

    if (step.isVisible && !step.isVisible(sanitizedFormData)) {
      sanitizedFormData[step.field] = initialFormData[step.field];

      if (step.otherTextField) {
        sanitizedFormData[step.otherTextField] = initialFormData[step.otherTextField];
      }
    }
  });

  return sanitizedFormData;
}

function formatStepAnswer(step, formData) {
  if (step.type === "upload") {
    return formData.uploadedImageName || "No image uploaded";
  }

  const value = formData[step.field];

  if (step.type === "multi") {
    if (!Array.isArray(value) || value.length === 0) {
      return "Not provided";
    }

    const parts = value.filter((item) => item !== OTHER_OPTION);

    if (value.includes(OTHER_OPTION) && formData[step.otherTextField]) {
      parts.push(`Other: ${formData[step.otherTextField]}`);
    }

    return parts.join(", ");
  }

  if (!value) {
    return "Not provided";
  }

  if (value === OTHER_OPTION && step.otherTextField && formData[step.otherTextField]) {
    return `Other: ${formData[step.otherTextField]}`;
  }

  if (value === "Yes" && step.followUpField && formData[step.followUpField]) {
    return `Yes - ${formData[step.followUpField]}`;
  }

  return value;
}

function QuestionsPage() {
  const navigate = useNavigate();
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
  const currentValue =
    step.type === "upload" ? formData.uploadedImageFile : formData[step.field];
  const progress = ((currentStep + 1) / visibleSteps.length) * 100;

  const reviewItems = useMemo(
    () =>
      visibleSteps.map((stepConfig) => ({
        prompt: stepConfig.prompt,
        answer: formatStepAnswer(stepConfig, formData),
      })),
    [formData, visibleSteps],
  );

  const payloadPreview = useMemo(
    () =>
      JSON.stringify(
        {
          ...formData,
          uploadedImageFile: formData.uploadedImageFile
            ? {
                name: formData.uploadedImageFile.name,
                type: formData.uploadedImageFile.type,
                size: formData.uploadedImageFile.size,
              }
            : null,
        },
        null,
        2,
      ),
    [formData],
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
    if (step.type === "upload") {
      return Boolean(formData.uploadedImageFile);
    }

    const hasBaseAnswer =
      step.type === "multi"
        ? Array.isArray(currentValue) && currentValue.length > 0
        : Boolean(currentValue);

    if (step.required && !hasBaseAnswer) {
      return false;
    }

    if (step.otherTextField && isOtherSelected(step, currentValue)) {
      return Boolean(formData[step.otherTextField].trim());
    }

    if (step.followUpField && currentValue === "Yes" && step.followUpRequired !== false) {
      return Boolean(formData[step.followUpField].trim());
    }

    if (step.type === "text") {
      if (typeof step.validate === "function") {
        return step.validate(currentValue);
      }
      return Boolean((currentValue || "").trim());
    }

    return Boolean(currentValue);
  };

  const updateFormData = (updater) => {
    setFormData((previous) => sanitizeFormData(updater(previous)));
  };

  const handleSingleSelect = (value) => {
    updateFormData((previous) => ({
      ...previous,
      [step.field]: value,
    }));
  };

  const handleMultiSelect = (value) => {
    updateFormData((previous) => {
      const currentItems = Array.isArray(previous[step.field])
        ? previous[step.field]
        : [];
      const nextItems = currentItems.includes(value)
        ? currentItems.filter((item) => item !== value)
        : [...currentItems, value];

      return {
        ...previous,
        [step.field]: nextItems,
      };
    });
  };

  const handleTextChange = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
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

  const handleProcessCase = () => {
    navigate("/results", { state: { submission: formData } });
  };

  const handleAdvanceOnEnter = (event) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();

    if (isCurrentStepValid()) {
      handleNext();
    }
  };

  const renderSupplementalFields = () => {
    if (step.type === "upload") {
      return null;
    }

    const fields = [];

    if (step.otherTextField && isOtherSelected(step, currentValue)) {
      fields.push(
        <InputField
          key={step.otherTextField}
          label="Please share your answer."
          value={formData[step.otherTextField]}
          onChange={(event) => handleTextChange(step.otherTextField, event.target.value)}
          onKeyDown={handleAdvanceOnEnter}
          placeholder="Add a few words so we can capture the context clearly."
          multiline={step.type === "multi"}
        />,
      );
    }

    if (step.followUpField && currentValue === "Yes") {
      fields.push(
        <InputField
          key={step.followUpField}
          label={step.followUpPrompt}
          value={formData[step.followUpField]}
          onChange={(event) => handleTextChange(step.followUpField, event.target.value)}
          onKeyDown={handleAdvanceOnEnter}
          placeholder={
            step.followUpRequired === false
              ? "Optional detail that may help interpret the case."
              : "Add any detail that may help interpret the exposure safely."
          }
          multiline
        />,
      );
    }

    return fields;
  };

  const renderQuestionStep = () => (
    <div className="pt-8">
      <h2 className="text-2xl font-semibold tracking-tight text-ink">{step.prompt}</h2>
      {step.subtitle ? (
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          {step.subtitle}
        </p>
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

      {renderSupplementalFields()}

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="glass-button-secondary rounded-full px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-white/65 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!isCurrentStepValid()}
          className="glass-button rounded-full px-7 py-3 text-base font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          Next
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
          onChange={(event) => handleTextChange(step.field, event.target.value)}
          onKeyDown={handleAdvanceOnEnter}
          placeholder={step.placeholder || ""}
          inputMode={step.field === "zipCode" ? "numeric" : "text"}
          className="glass-surface-strong w-full rounded-2xl px-5 py-4 text-lg text-ink transition focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100"
        />
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="glass-button-secondary rounded-full px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-white/65 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!isCurrentStepValid()}
          className="glass-button rounded-full px-7 py-3 text-base font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
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

      <div className="glass-surface mt-8 rounded-[1.75rem] p-5 sm:p-6">
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
              ? "border-cyan-300 bg-white/75"
              : "border-white/50 bg-white/55 hover:border-cyan-200 hover:bg-white/68"
          }`}
        >
          <div className="glass-surface flex h-20 w-20 items-center justify-center rounded-full text-blue-700">
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
          <div className="glass-surface mt-6 rounded-[1.5rem] p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Selected file</p>
                <p className="mt-1 break-all text-base font-semibold text-ink">
                  {formData.uploadedImageName}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="glass-button-secondary rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/65"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="rounded-full border border-rose-200/80 bg-white/55 px-4 py-2 text-sm font-semibold text-rose-600 backdrop-blur-xl transition hover:bg-rose-50/70"
                >
                  Remove
                </button>
              </div>
            </div>

            {formData.uploadedImagePreviewUrl ? (
              <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-white/50 bg-white/45 backdrop-blur-xl">
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
          className="glass-button-secondary rounded-full px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-white/65"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!isCurrentStepValid()}
          className="glass-button rounded-full px-7 py-3 text-base font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="pt-8">
      <div className="glass-surface-strong rounded-[1.75rem] p-6">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">
          Review intake before processing
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Confirm the case details, photo, and structured payload before EnviroSkin
          moves to prediction results.
        </p>
      </div>

      <div className="glass-surface mt-6 rounded-[1.75rem] p-6">
        <h3 className="text-lg font-semibold text-ink">Structured response preview</h3>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm leading-7 text-slate-100">
{payloadPreview}
        </pre>
      </div>

      <div className="mt-6 grid gap-3">
        {reviewItems.map((item) => (
          <div
            key={item.prompt}
            className="glass-surface rounded-2xl px-5 py-4"
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
          className="glass-button-secondary rounded-full px-6 py-3 text-base font-semibold text-slate-700 transition hover:bg-white/65"
        >
          Edit upload step
        </button>
        <button
          type="button"
          onClick={handleProcessCase}
          className="glass-button rounded-full px-7 py-3 text-base font-semibold text-white transition hover:brightness-105"
        >
          Process Case
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
            className="glass-button-secondary rounded-full px-5 py-2.5 text-sm font-semibold text-slate-700"
          >
            Back to Home
          </Link>
        </div>




        {/* <section className="glass-panel relative overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10"> */}
        <section className="glass-panel relative overflow-hidden rounded-[2rem] p-6 shadow-[0_0_80px_rgba(59,130,246,0.22)] sm:p-8 lg:p-10">                                                                                                                                          
  <div className="relative z-10">
    <div className="flex flex-col gap-6 border-b border-white/35 pb-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Quick EnviroSkin Intake
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Answers help contextualize the skin analysis.
          </h1>
        </div>
        <div className="glass-surface rounded-full px-4 py-2 text-sm font-semibold text-slate-700">
          {isComplete
            ? "Review complete"
            : step.type === "upload"
              ? `Final step of ${visibleSteps.length}`
              : `Question ${currentStep + 1} of ${visibleSteps.length}`}
        </div>
      </div>

      <p className="max-w-2xl text-base leading-7 text-slate-600">
        Provide timing, symptoms, exposure history, medication context, and a
        skin photo so EnviroSkin can organize a richer case for downstream
        review and prediction.
      </p>

      <div className="h-2 overflow-hidden rounded-full bg-white/55">
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
      renderReviewStep()
    )}
  </div>
</section>


      </div>
    </div>
  );
}

export default QuestionsPage;
