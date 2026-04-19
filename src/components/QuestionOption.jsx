function QuestionOption({ label, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      data-question-option="true"
      className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left text-base font-medium backdrop-blur-xl transition ${
        isSelected
          ? "border-cyan-300/80 bg-white/72 text-blue-800 shadow-[0_18px_36px_rgba(53,119,185,0.18)]"
          : "border-white/45 bg-white/52 text-slate-700 shadow-[0_16px_32px_rgba(43,90,128,0.1)] hover:border-cyan-200/80 hover:bg-white/64"
      }`}
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs backdrop-blur ${
          isSelected
            ? "border-cyan-400 bg-gradient-to-br from-blue-500 to-cyan-500 text-white"
            : "border-white/60 bg-white/70 text-transparent"
        }`}
      >
        ✓
      </span>
    </button>
  );
}

export default QuestionOption;
