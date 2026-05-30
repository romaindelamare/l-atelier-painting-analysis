import { imageUrl } from "../api/client";
import type { DetectedElement } from "../types/painting";

interface Props {
  filename: string;
  title: string;
  width: number;
  height: number;
  elements: DetectedElement[];
  highlightedId: number | null;
  onHover: (id: number | null) => void;
  onSelect?: (id: number) => void;
  zoomed?: boolean;
  onToggleZoom?: () => void;
  showBoxes?: boolean;
  onToggleBoxes?: () => void;
}

/**
 * Renders the painting inside a frame with an SVG annotation layer. The SVG
 * viewBox matches the image's natural pixel dimensions, so detection
 * coordinates map directly — and because the frame uses the image's exact
 * aspect ratio, the overlay always aligns with the artwork at any size.
 */
export default function BoundingBoxOverlay({
  filename,
  title,
  width,
  height,
  elements,
  highlightedId,
  onHover,
  onSelect,
  zoomed = false,
  onToggleZoom,
  showBoxes = true,
  onToggleBoxes,
}: Props) {
  const dimmed = highlightedId !== null;

  return (
    <div className="group relative bg-[#fbfaf6] p-3 sm:p-5 ring-1 ring-line shadow-[0_0_22px_0_rgba(28,24,19,0.18)]">
      <div
        className="relative w-full"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <img
          src={imageUrl(filename)}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
        />

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="absolute inset-0 h-full w-full"
          style={{ opacity: showBoxes ? 1 : 0, transition: "opacity 0.25s" }}
        >
          {elements.map((e, i) => {
            const active = highlightedId === e.id;
            const w = e.bottom_right_x - e.top_left_x;
            const h = e.bottom_right_y - e.top_left_y;
            const badge = Math.max(width, height) * 0.018;
            return (
              <g
                key={e.id}
                onMouseEnter={() => onHover(e.id)}
                onMouseLeave={() => onHover(null)}
                onClick={() => onSelect?.(e.id)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={e.top_left_x}
                  y={e.top_left_y}
                  width={w}
                  height={h}
                  fill="transparent"
                />
                <rect
                  x={e.top_left_x}
                  y={e.top_left_y}
                  width={w}
                  height={h}
                  fill={active ? "rgba(154,59,46,0.12)" : "transparent"}
                  stroke={active ? "#9a3b2e" : "#fbfaf6"}
                  strokeOpacity={active ? 1 : dimmed ? 0.15 : 0.7}
                  strokeWidth={active ? 2.5 : 1.5}
                  vectorEffect="non-scaling-stroke"
                  style={{ transition: "stroke-opacity 0.25s, fill 0.25s" }}
                />
                <circle
                  cx={e.top_left_x + badge}
                  cy={e.top_left_y + badge}
                  r={badge}
                  fill={active ? "#9a3b2e" : "#1c1813"}
                  opacity={dimmed && !active ? 0.2 : 0.92}
                  style={{ transition: "opacity 0.25s" }}
                />
                <text
                  x={e.top_left_x + badge}
                  y={e.top_left_y + badge}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={badge * 1.15}
                  fontFamily="Archivo, sans-serif"
                  fontWeight="600"
                  fill="#f4f0e7"
                  opacity={dimmed && !active ? 0.2 : 1}
                >
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className={[
        "absolute top-2 right-2 flex gap-1 z-10 transition-opacity duration-200",
        zoomed ? "opacity-100" : "opacity-0 group-hover:opacity-100",
      ].join(" ")}>
        {onToggleBoxes && (
          <button
            onClick={onToggleBoxes}
            title={showBoxes ? "Hide boxes" : "Show boxes"}
            aria-label={showBoxes ? "Hide boxes" : "Show boxes"}
            className="w-7 h-7 flex items-center justify-center rounded bg-ink/70 text-paper cursor-pointer focus-visible:ring-2 focus-visible:ring-paper/60 focus-visible:outline-none"
          >
            {showBoxes ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            )}
          </button>
        )}
        {onToggleZoom && (
          <button
            onClick={onToggleZoom}
            title={zoomed ? "Exit zoom" : "Zoom in"}
            aria-label={zoomed ? "Exit zoom" : "Zoom in"}
            className="w-7 h-7 flex items-center justify-center rounded bg-ink/70 text-paper cursor-pointer focus-visible:ring-2 focus-visible:ring-paper/60 focus-visible:outline-none"
          >
            {zoomed ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8V5a2 2 0 0 1 2-2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2h-3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/>
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
