function ResultsBorderGlow({ children, className = "", ...props }) {
  return (
    <section
      className={`results-border-glow glass-panel relative overflow-hidden ${className}`}
      {...props}
    >
      <div aria-hidden="true" className="results-border-glow__beam" />
      <div aria-hidden="true" className="results-border-glow__edge" />
      <div className="results-border-glow__content relative z-10">{children}</div>
    </section>
  );
}

export default ResultsBorderGlow;
