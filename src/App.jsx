import { Navigate, Route, Routes } from "react-router-dom";
import ColorBendsBackground from "./components/ColorBendsBackground";
import HomePage from "./pages/HomePage";
import QuestionsPage from "./pages/QuestionsPage";
import ResultsPage from "./pages/ResultsPage";

function App() {
  return (
    <div className="app-shell">
      {/* TODO: tune Color Bends props after final branding pass */}
      {/* TODO: confirm animated background performance on lower-end devices */}
      <div className="app-shell__background" aria-hidden="true">
        <ColorBendsBackground className="opacity-80" />
      </div>
      <div className="app-shell__overlay" aria-hidden="true" />
      <div className="app-shell__content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
