import { useMemo, useState } from "react";

import type { DetectedElement } from "../types/painting";

interface Props {
  elements: DetectedElement[];
  highlightedId: number | null;
  onHover: (id: number | null) => void;
  /** Stable display number per element id (matches the bounding-box badges). */
  numbers: Map<number, number>;
}

// Display order + plural labels for the level-1 categories.
const CATEGORY_ORDER = [
  "human",
  "animal",
  "plant",
  "nature",
  "structure",
  "vehicle",
  "object",
  "other",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  human: "Figures",
  animal: "Animals",
  plant: "Plants",
  nature: "Nature",
  structure: "Structures",
  vehicle: "Vehicles",
  object: "Objects",
  other: "Other",
};

function categoryRank(category: string): number {
  const i = CATEGORY_ORDER.indexOf(category as (typeof CATEGORY_ORDER)[number]);
  return i === -1 ? CATEGORY_ORDER.length : i;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

interface SubGroup {
  subcategory: string | null;
  items: DetectedElement[];
}

interface CategoryGroup {
  category: string;
  count: number;
  subgroups: SubGroup[];
}

/** Group elements by level-1 category, then by level-2 subcategory within each. */
function buildGroups(elements: DetectedElement[]): CategoryGroup[] {
  const byCategory = new Map<string, DetectedElement[]>();
  for (const e of elements) {
    const key = e.category || "other";
    (byCategory.get(key) ?? byCategory.set(key, []).get(key)!).push(e);
  }

  const groups: CategoryGroup[] = [];
  for (const [category, items] of byCategory) {
    const bySub = new Map<string, DetectedElement[]>();
    for (const e of items) {
      const key = e.subcategory ?? "";
      (bySub.get(key) ?? bySub.set(key, []).get(key)!).push(e);
    }

    const subgroups: SubGroup[] = [...bySub.entries()]
      .sort(([a], [b]) => {
        if (a === "") return 1; // ungrouped (no subcategory) sinks to the bottom
        if (b === "") return -1;
        return a.localeCompare(b);
      })
      .map(([sub, subItems]) => ({
        subcategory: sub === "" ? null : sub,
        items: subItems
          .slice()
          .sort((a, b) =>
            (a.specific_type ?? a.name).localeCompare(b.specific_type ?? b.name)
          ),
      }));

    groups.push({ category, count: items.length, subgroups });
  }

  return groups.sort((a, b) => categoryRank(a.category) - categoryRank(b.category));
}

export default function ElementList({
  elements,
  highlightedId,
  onHover,
  numbers,
}: Props) {
  const groups = useMemo(() => buildGroups(elements), [elements]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  if (elements.length === 0) {
    return (
      <p className="text-muted font-display italic text-lg">
        No distinct elements were identified in this work.
      </p>
    );
  }

  const toggle = (category: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });

  return (
    <div className="divide-y divide-line">
      {groups.map((group) => {
        const isOpen = !collapsed.has(group.category);
        const label = CATEGORY_LABELS[group.category] ?? titleCase(group.category);
        return (
          <section key={group.category}>
            <button
              onClick={() => toggle(group.category)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between py-3 px-3 -mx-3 text-left group/acc transition-colors hover:bg-paper-deep/50"
            >
              <span className="eyebrow text-ink flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted transition-transform duration-200"
                  style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
                {label}
              </span>
              <span className="text-muted text-sm tabular-nums">{group.count}</span>
            </button>

            {isOpen && (
              <div className="pb-3">
                {group.subgroups.map((sub) => (
                  <div key={sub.subcategory ?? "__none__"}>
                    {sub.subcategory && (
                      <p className="px-3 -mx-3 pt-3 pb-1 text-xs uppercase tracking-wide text-muted/80 font-semibold">
                        {titleCase(sub.subcategory)}
                      </p>
                    )}
                    <ul>
                      {sub.items.map((e) => {
                        const active = highlightedId === e.id;
                        const primary = e.specific_type ?? e.name;
                        return (
                          <li key={e.id} data-element-id={e.id}>
                            <button
                              onMouseEnter={() => onHover(e.id)}
                              onMouseLeave={() => onHover(null)}
                              onFocus={() => onHover(e.id)}
                              onBlur={() => onHover(null)}
                              className={[
                                "w-full text-left flex gap-4 items-baseline py-3 px-3 -mx-3 transition-colors duration-200",
                                active ? "bg-paper-deep" : "hover:bg-paper-deep/50",
                              ].join(" ")}
                            >
                              <span
                                className={[
                                  "shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[0.7rem] font-semibold mt-0.5 transition-colors",
                                  active ? "bg-accent text-paper" : "bg-ink/85 text-paper",
                                ].join(" ")}
                              >
                                {numbers.get(e.id)}
                              </span>
                              <span className="flex-1">
                                <span
                                  className={[
                                    "font-display text-lg capitalize transition-colors",
                                    active ? "text-accent" : "text-ink",
                                  ].join(" ")}
                                >
                                  {primary}
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
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
