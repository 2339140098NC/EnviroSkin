import { Link } from "react-router-dom";
import LanguageSwitcher from "./LanguageSwitcher";
import { useI18n } from "../i18n/I18nProvider";

function Navbar() {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-30 border-b border-white/35 bg-white/20 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <Link to="/" className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-ink">
          <span className="glass-surface flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl">
            <img
              src="/logo.png"
              alt="EnviroSkin logo"
              className="h-full w-full object-cover"
            />
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
