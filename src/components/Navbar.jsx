import { Link } from "react-router-dom";
import LanguageSwitcher from "./LanguageSwitcher";
import { useI18n } from "../i18n/I18nProvider";

function Navbar() {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-30 border-b border-white/35 bg-white/20 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <Link to="/" className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-ink">
          <span className="glass-surface flex h-10 w-10 items-center justify-center rounded-2xl text-blue-700">
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M5 4.75c0-.69.56-1.25 1.25-1.25h11.5c.69 0 1.25.56 1.25 1.25v14.41c0 .94-1.03 1.51-1.82 1.01L12 16.25l-5.18 3.92A1.25 1.25 0 0 1 5 19.16V4.75Z" />
            </svg>
          </span>
          {t("EnviroSkin")}
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            to="/questions"
            className="glass-button rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:brightness-105"
          >
            {t("Get Started")}
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
