import { Link } from "react-router-dom";

import { imageUrl } from "../api/client";
import type { PaintingSummary } from "../types/painting";

export default function PaintingCard({ painting }: { painting: PaintingSummary }) {
  return (
    <Link
      to={`/paintings/${painting.id}`}
      className="group block"
    >
      {/* Framed artwork on a gallery wall */}
      <div className="relative bg-[#fbfaf6] p-3 shadow-[0_0_28px_0_rgba(28,24,19,0.32)] ring-1 ring-line transition-shadow duration-500 group-hover:shadow-[0_0_42px_0_rgba(28,24,19,0.44)]">
        <div className="aspect-[4/5] overflow-hidden bg-paper-deep">
          <img
            src={imageUrl(painting.filename)}
            alt={painting.title ?? "Untitled painting"}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        </div>
      </div>

      {/* Placard */}
      <div className="mt-4 pl-1">
        <h3 className="font-display text-xl text-ink leading-tight group-hover:text-accent transition-colors">
          {painting.title ?? <span className="text-muted/50 italic">Unknown</span>}
        </h3>
        <p className="text-sm text-muted mt-0.5">
          {painting.artist || "Unknown"}
          {painting.year ? ` · ${painting.year}` : ""}
        </p>
        <p className="eyebrow mt-2">
          {painting.element_count}{" "}
          {painting.element_count === 1 ? "element" : "elements"} catalogued
        </p>
      </div>
    </Link>
  );
}
