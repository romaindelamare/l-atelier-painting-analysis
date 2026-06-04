import { useRef, useState } from "react";

import { imageUrl } from "../api/client";
import type { DetectedElement, ElementBox } from "../types/painting";

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
  /** When true, dragging on the artwork draws a new box instead of selecting. */
  drawMode?: boolean;
  /** Called with the drawn box (image-pixel coords) once a drag completes. */
  onDrawComplete?: (box: ElementBox) => void;
  /** Element ids currently checked for multi-select (rendered with an accent). */
  selectedIds?: Set<number>;
}

/** Minimum drag (in image pixels) before we treat it as a real box, not a stray click. */
const MIN_DRAG = 4;

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
  drawMode = false,
  onDrawComplete,
  selectedIds,
}: Props) {
  const dimmed = highlightedId !== null;
  const svgRef = useRef<SVGSVGElement>(null);
  const [draft, setDraft] = useState<ElementBox | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  function toImageCoords(clientX: number, clientY: number) {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const p = pt.matrixTransform(ctm.inverse());
    return {
      x: Math.min(Math.max(p.x, 0), width),
      y: Math.min(Math.max(p.y, 0), height),
    };
  }

  function handleDrawStart(e: React.MouseEvent) {
    if (!drawMode) return;
    const p = toImageCoords(e.clientX, e.clientY);
    if (!p) return;
    startRef.current = p;
    setDraft({ top_left_x: p.x, top_left_y: p.y, bottom_right_x: p.x, bottom_right_y: p.y });
  }

  function handleDrawMove(e: React.MouseEvent) {
    if (!drawMode || !startRef.current) return;
    const p = toImageCoords(e.clientX, e.clientY);
    if (!p) return;
    const s = startRef.current;
    setDraft({
      top_left_x: Math.min(s.x, p.x),
      top_left_y: Math.min(s.y, p.y),
      bottom_right_x: Math.max(s.x, p.x),
      bottom_right_y: Math.max(s.y, p.y),
    });
  }

  function handleDrawEnd() {
    if (!drawMode || !draft) {
      startRef.current = null;
      return;
    }
    const w = draft.bottom_right_x - draft.top_left_x;
    const h = draft.bottom_right_y - draft.top_left_y;
    startRef.current = null;
    setDraft(null);
    if (w >= MIN_DRAG && h >= MIN_DRAG) onDrawComplete?.(draft);
  }

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
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="absolute inset-0 h-full w-full"
          style={{
            opacity: showBoxes ? 1 : 0,
            transition: "opacity 0.25s",
            cursor: drawMode ? "crosshair" : "default",
          }}
          onMouseDown={handleDrawStart}
          onMouseMove={handleDrawMove}
          onMouseUp={handleDrawEnd}
          onMouseLeave={handleDrawEnd}
        >
          {elements.map((e) => {
            const active = highlightedId === e.id;
            const selected = selectedIds?.has(e.id) ?? false;
            const w = e.bottom_right_x - e.top_left_x;
            const h = e.bottom_right_y - e.top_left_y;
            const badge = Math.max(width, height) * 0.018;
            const stroke = selected ? "#9a3b2e" : active ? "#9a3b2e" : "#fbfaf6";
            return (
              <g
                key={e.id}
                onMouseEnter={() => !drawMode && onHover(e.id)}
                onMouseLeave={() => !drawMode && onHover(null)}
                onClick={() => !drawMode && onSelect?.(e.id)}
                style={{ cursor: drawMode ? "crosshair" : "pointer" }}
                pointerEvents={drawMode ? "none" : "auto"}
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
                  fill={
                    selected
                      ? "rgba(154,59,46,0.2)"
                      : active
                        ? "rgba(154,59,46,0.12)"
                        : "transparent"
                  }
                  stroke={stroke}
                  strokeOpacity={active || selected ? 1 : dimmed ? 0.15 : 0.7}
                  strokeWidth={active || selected ? 2.5 : 1.5}
                  vectorEffect="non-scaling-stroke"
                  style={{ transition: "stroke-opacity 0.25s, fill 0.25s" }}
                />
                <circle
                  cx={e.top_left_x + badge}
                  cy={e.top_left_y + badge}
                  r={badge}
                  fill={active || selected ? "#9a3b2e" : "#1c1813"}
                  opacity={dimmed && !active && !selected ? 0.2 : 0.92}
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
                  opacity={dimmed && !active && !selected ? 0.2 : 1}
                >
                  {numbers.get(e.id)}
                </text>
              </g>
            );
          })}

          {/* Live rubber-band while drawing a new box. */}
          {draft && (
            <rect
              x={draft.top_left_x}
              y={draft.top_left_y}
              width={draft.bottom_right_x - draft.top_left_x}
              height={draft.bottom_right_y - draft.top_left_y}
              fill="rgba(154,59,46,0.12)"
              stroke="#9a3b2e"
              strokeWidth={2}
              strokeDasharray="6 4"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          )}
        </svg>
      </div>

    </div>
  );
}
