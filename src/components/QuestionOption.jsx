function QuestionOption({ label, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left text-base font-medium transition ${
        isSelected
          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"
      }`}
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
          isSelected
            ? "border-blue-500 bg-blue-500 text-white"
            : "border-slate-300 bg-white text-transparent"
        }`}
      >
        ✓
      </span>
    </button>
  );
}

export default QuestionOption;
