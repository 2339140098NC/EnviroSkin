import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";
import QuestionsPage from "./QuestionsPage";

function renderQuestionsPage() {
  render(
    <MemoryRouter>
      <QuestionsPage />
    </MemoryRouter>,
  );
}

async function answerZipCode(value) {
  const zipCodeInput = screen.getByPlaceholderText("e.g. 92093");
  await userEvent.clear(zipCodeInput);
  await userEvent.type(zipCodeInput, value);
  return zipCodeInput;
}

describe("QuestionsPage keyboard progression", () => {
  test("pressing Enter on a valid zip code advances to the next step", async () => {
    renderQuestionsPage();

    const zipCodeInput = await answerZipCode("92093");
    await userEvent.type(zipCodeInput, "{enter}");

    expect(
      screen.getByRole("heading", { name: "When did it start?" }),
    ).toBeInTheDocument();
  });

  test("pressing Enter on an invalid zip code keeps the current step", async () => {
    renderQuestionsPage();

    const zipCodeInput = await answerZipCode("9209");
    await userEvent.type(zipCodeInput, "{enter}");

    expect(
      screen.getByRole("heading", { name: "What zip code are you in right now?" }),
    ).toBeInTheDocument();
  });

  test("pressing Enter in an Other supplemental field advances when required text is present", async () => {
    renderQuestionsPage();

    const zipCodeInput = await answerZipCode("92093");
    await userEvent.type(zipCodeInput, "{enter}");

    await userEvent.click(screen.getByRole("button", { name: "Other" }));

    const otherInput = screen.getByLabelText("Please share your answer.");
    await userEvent.type(otherInput, "Triggered after swimming{enter}");

    expect(
      screen.getByRole("heading", { name: "How has it changed over time?" }),
    ).toBeInTheDocument();
  });

  test("pressing Enter in a multiline follow-up field advances instead of adding a newline", async () => {
    renderQuestionsPage();

    const zipCodeInput = await answerZipCode("92093");
    await userEvent.type(zipCodeInput, "{enter}");

    await userEvent.click(screen.getByRole("button", { name: "Within days" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "Spreading" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "Yes" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "Itching" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "Yes" }));

    const detailsInput = screen.getByLabelText(
      "Please describe your fever or other whole-body symptoms.",
    );
    await userEvent.type(detailsInput, "Low fever and fatigue{enter}");

    expect(
      screen.getByRole("heading", {
        name: "Have you been around anyone who has been sick recently?",
      }),
    ).toBeInTheDocument();
  });

  test("clicking Next still advances after the keyboard handler is added", async () => {
    renderQuestionsPage();

    await answerZipCode("92093");
    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(
      screen.getByRole("heading", { name: "When did it start?" }),
    ).toBeInTheDocument();
  });
});
