import type { DetectedElement } from "../types/painting";

interface Props {
  elements: DetectedElement[];
  highlightedId: number | null;
  onHover: (id: number | null) => void;
}

export default function ElementList({ elements, highlightedId, onHover }: Props) {
  if (elements.length === 0) {
    return (
      <p className="text-muted font-display italic text-lg">
        No distinct elements were identified in this work.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {elements.map((e, i) => {
        const active = highlightedId === e.id;
        return (
          <li key={e.id} data-element-id={e.id}>
            <button
              onMouseEnter={() => onHover(e.id)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(e.id)}
              onBlur={() => onHover(null)}
              className={[
                "w-full text-left flex gap-4 items-baseline py-4 px-3 -mx-3 transition-colors duration-200",
                active ? "bg-paper-deep" : "hover:bg-paper-deep/50",
              ].join(" ")}
            >
              <span
                className={[
                  "shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[0.7rem] font-semibold mt-0.5 transition-colors",
                  active ? "bg-accent text-paper" : "bg-ink/85 text-paper",
                ].join(" ")}
              >
                {i + 1}
              </span>
              <span className="flex-1">
                <span
                  className={[
                    "font-display text-xl capitalize transition-colors",
                    active ? "text-accent" : "text-ink",
                  ].join(" ")}
                >
                  {e.name}
                </span>
                {e.description && (
                  <span className="block text-sm text-muted mt-0.5">
                    {e.description}
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
