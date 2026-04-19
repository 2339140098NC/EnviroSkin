import { useEffect } from "react";

function SplitText({
  text,
  className = "",
  delay = 70,
  duration = 650,
  ease = "cubic-bezier(0.22, 1, 0.36, 1)",
  splitType = "chars",
  tag: Tag = "span",
  animate = true,
  onAnimationComplete,
}) {
  const segments =
    splitType === "words"
      ? text.split(/(\s+)/)
      : Array.from(text);

  useEffect(() => {
    if (!onAnimationComplete) {
      return undefined;
    }

    const totalDuration = animate
      ? duration + Math.max(segments.length - 1, 0) * delay
      : 220;
    const timeoutId = window.setTimeout(onAnimationComplete, totalDuration);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [animate, delay, duration, onAnimationComplete, segments.length]);

  return (
    <Tag
      aria-label={text}
      className={`split-text ${animate ? "split-text--ready" : "split-text--static"} ${className}`}
    >
      {segments.map((segment, index) => (
        <span
          key={`${segment}-${index}`}
          aria-hidden="true"
          className="split-text__segment"
          style={{
            "--split-text-delay": `${index * delay}ms`,
            "--split-text-duration": `${duration}ms`,
            "--split-text-ease": ease,
          }}
        >
          {segment === " " ? "\u00A0" : segment}
        </span>
      ))}
    </Tag>
  );
}

export default SplitText;
