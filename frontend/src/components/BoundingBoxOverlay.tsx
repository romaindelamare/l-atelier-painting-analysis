import { imageUrl } from "../api/client";
import type { DetectedElement } from "../types/painting";

interface Props {
  filename: string;
  title?: string;
  width: number;
  height: number;
  elements: DetectedElement[];
  highlightedId: number | null;
  onHover: (id: number | null) => void;
  onSelect?: (id: number) => void;
  showBoxes?: boolean;
  /** Stable display number per element id (matches the element list badges). */
  numbers: Map<number, number>;
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
  showBoxes = true,
  numbers,
}: Props) {
  const dimmed = highlightedId !== null;

  return (
    <div className="relative bg-[#fbfaf6] p-3 sm:p-5 ring-1 ring-line shadow-[0_0_22px_0_rgba(28,24,19,0.18)]">
      <div
        className="relative w-full"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <img
          src={imageUrl(filename)}
          alt={title ?? "Painting"}
          className="absolute inset-0 h-full w-full object-cover"
        />

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="absolute inset-0 h-full w-full"
          style={{ opacity: showBoxes ? 1 : 0, transition: "opacity 0.25s" }}
        >
          {elements.map((e) => {
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
                  {numbers.get(e.id)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

    </div>
  );
}
