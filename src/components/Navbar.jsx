import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <Link to="/" className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-ink">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M5 4.75c0-.69.56-1.25 1.25-1.25h11.5c.69 0 1.25.56 1.25 1.25v14.41c0 .94-1.03 1.51-1.82 1.01L12 16.25l-5.18 3.92A1.25 1.25 0 0 1 5 19.16V4.75Z" />
            </svg>
          </span>
          EnviroSkin
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/questions"
            className="rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
