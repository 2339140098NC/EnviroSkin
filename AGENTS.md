# Repository Guidelines

## Project Structure & Module Organization
This repository is currently minimal, with only [README.md](/Users/khangtran/Desktop/Coding/EnviroSkin/README.md) at the root. As the application grows, keep runtime code in `src/`, static assets in `public/`, and shared documentation in the repository root. Place React views under `src/pages/`, reusable UI in `src/components/`, and utilities in `src/lib/`. Keep tests near the code they cover in `src/__tests__/` or alongside modules as `*.test.jsx`.

## Build, Test, and Development Commands
Standardize on npm for local workflows.

- `npm install`: install project dependencies.
- `npm run dev`: start the local Vite development server.
- `npm run build`: create a production build.
- `npm run preview`: serve the production build locally for verification.
- `npm test`: run the test suite once configured.

If scripts change, update this file and `README.md` in the same pull request.

## Coding Style & Naming Conventions
Use functional React components only. Prefer 2-space indentation, semicolons, and single-responsibility modules. Name components and pages in `PascalCase` (`QuestionnairePage.jsx`), hooks in `camelCase` starting with `use`, and route or utility files in `camelCase`. Keep Tailwind utility usage readable by grouping layout, spacing, color, and state classes together. Add comments only where intent is not obvious from the code.

## Testing Guidelines
Use a lightweight frontend test stack such as Vitest with React Testing Library. Name tests `*.test.jsx` and focus on user-visible behavior: routing, form progression, disabled states, and key rendering paths. New features should include at least one happy-path test and one edge-case test. Run tests locally before opening a pull request.

## Commit & Pull Request Guidelines
The current history uses short commit messages (`first commit`). Continue with concise, imperative subjects such as `add intake questionnaire` or `refine landing hero`. Keep commits focused. Pull requests should include a short summary, screenshots or screen recordings for UI changes, linked issues when applicable, and notes on testing performed.

## Configuration & Security
Do not commit secrets, API keys, or `.env` files with live values. Document required environment variables in `README.md` and provide safe placeholders in `.env.example` once configuration is introduced.
