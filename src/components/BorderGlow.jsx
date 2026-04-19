function BorderGlow({ children, className = "", ...props }) {
  return (
    <section
      className={`questionnaire-border-glow glass-panel relative overflow-hidden ${className}`}
      {...props}
    >
      {/* TODO: tune Border Glow styling after final visual polish pass */}
      <div aria-hidden="true" className="questionnaire-border-glow__aura" />
      <div aria-hidden="true" className="questionnaire-border-glow__beam" />
      <div aria-hidden="true" className="questionnaire-border-glow__edge" />
      <div className="questionnaire-border-glow__content relative z-10">{children}</div>
    </section>
  );
}

export default BorderGlow;
