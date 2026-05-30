import { useState } from "react";

import type { PaletteColor } from "../types/painting";

interface Props {
  palette: PaletteColor[];
  compact?: boolean;
}

export default function ColorPalette({ palette, compact }: Props) {
  const [active, setActive] = useState<number | null>(null);

  if (palette.length === 0) return null;

  return (
    <div>
      {/* Proportion-weighted band */}
      <div className={`flex w-full overflow-hidden ring-1 ring-line rounded-sm ${compact ? "h-8" : "h-20"}`}>
        {palette.map((c, i) => (
          <div
            key={c.id}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            className="h-full transition-all duration-300"
            style={{
              backgroundColor: c.hex,
              flex: `${Math.max(c.proportion, 0.02)} 1 0%`,
              filter: active !== null && active !== i ? "saturate(0.5)" : "none",
            }}
            title={`${(c.proportion * 100).toFixed(1)}%`}
          />
        ))}
      </div>

    </div>
  );
}
