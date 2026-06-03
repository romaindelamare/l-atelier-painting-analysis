import type { ReactNode } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

const navLink = ({ isActive }: { isActive: boolean }) =>
  [
    "eyebrow transition-colors duration-300 pb-1 border-b",
    isActive
      ? "text-ink border-accent"
      : "text-muted border-transparent hover:text-ink",
  ].join(" ");

export default function Layout({ children }: { children: ReactNode }) {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    navigate("/", { replace: true });
    logout();
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <header className="shrink-0 sticky top-0 z-30 backdrop-blur-sm bg-paper/80 border-b border-line">
        <div className="mx-auto max-w-6xl px-6 md:px-10 h-20 flex items-center justify-between">
          <Link to="/" className="group flex flex-col leading-none">
            <span className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-ink">
              L&apos;Atelier
            </span>
            <span className="eyebrow mt-1 text-[0.6rem] group-hover:text-accent transition-colors">
              Painting Analysis Studio
            </span>
          </Link>

          <div className="flex items-center gap-8">
            {/* The menu only appears once signed in — logged out, the logo
                already leads to the (sole) Collection view. */}
            {isAuthenticated && (
              <nav className="flex items-center gap-8">
                <NavLink to="/" end className={navLink}>
                  Collection
                </NavLink>
                <NavLink to="/upload" className={navLink}>
                  Upload
                </NavLink>
              </nav>
            )}

            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="eyebrow !text-paper bg-ink hover:bg-accent transition-colors px-4 py-2"
              >
                Sign out
              </button>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="eyebrow !text-paper bg-ink hover:bg-accent transition-colors px-4 py-2"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
    </div>
  );
}
