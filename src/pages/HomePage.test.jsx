import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { I18nProvider } from "../i18n/I18nProvider";
import HomePage from "./HomePage";

function renderHomePage() {
  render(
    <I18nProvider>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </I18nProvider>,
  );
}

describe("HomePage intro splash", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  test("shows the welcome intro before fading away", () => {
    renderHomePage();

    expect(document.querySelector(".home-intro-splash__title")).toHaveAttribute(
      "aria-label",
      "Welcome",
    );
    expect(
      screen.getByRole("heading", { name: "Your skin, seen clearly." }),
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2600);
    });

    expect(document.querySelector(".home-intro-splash__title")).toBeNull();
  });
});
