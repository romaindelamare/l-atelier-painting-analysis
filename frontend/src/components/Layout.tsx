import type { ReactNode } from "react";
import { NavLink, Link } from "react-router-dom";

const navLink = ({ isActive }: { isActive: boolean }) =>
  [
    "eyebrow transition-colors duration-300 pb-1 border-b",
    isActive
      ? "text-ink border-accent"
      : "text-muted border-transparent hover:text-ink",
  ].join(" ");

export default function Layout({ children }: { children: ReactNode }) {
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
          <nav className="flex items-center gap-8">
            <NavLink to="/" end className={navLink}>
              Upload
            </NavLink>
            <NavLink to="/collection" className={navLink}>
              Collection
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>

      <footer className="shrink-0 border-t border-line">
        <div className="mx-auto max-w-6xl px-6 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="eyebrow">L&apos;Atelier - Est. MMXXVI</span>
          <span className="text-sm text-muted font-display italic">
            Every painting tells a story of elements and color.
          </span>
        </div>
      </footer>
    </div>
  );
}
