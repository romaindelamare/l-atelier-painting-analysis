import { Link } from "react-router-dom";

import PaintingCard from "../components/PaintingCard";
import { usePaintingList } from "../hooks/usePaintings";

export default function GalleryPage() {
  const { data, loading, error } = usePaintingList();

  return (
    <div className="mx-auto max-w-6xl px-6 md:px-10">
      <section className="pt-4 md:pt-8 pb-2 rise">
        <p className="eyebrow">Permanent Collection</p>
        <h1 className="font-display text-5xl md:text-7xl font-medium leading-[0.95] mt-2 text-ink">
          The Collection
        </h1>
        {data && data.length > 0 && (
          <p className="mt-2 text-muted font-display text-lg">
            {data.length} {data.length === 1 ? "work" : "works"} on view.
          </p>
        )}
      </section>

      <div className="h-px bg-line mb-4" />

      {loading && (
        <p className="text-muted eyebrow py-20 text-center">Opening the archive…</p>
      )}

      {error && (
        <p className="text-accent border-l-2 border-accent pl-3 py-2">{error}</p>
      )}

      {data && data.length === 0 && (
        <div className="py-24 text-center">
          <p className="font-display text-3xl text-ink">The walls are bare.</p>
          <p className="mt-3 text-muted">
            No paintings have been analyzed yet.
          </p>
          <Link
            to="/"
            className="inline-block mt-7 px-7 py-3 eyebrow text-paper bg-ink hover:bg-accent transition-colors"
          >
            Upload the first work
          </Link>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6 pb-6">
          {data.map((p, i) => (
            <div
              key={p.id}
              className="rise"
              style={{ animationDelay: `${Math.min(i * 70, 420)}ms` }}
            >
              <PaintingCard painting={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
