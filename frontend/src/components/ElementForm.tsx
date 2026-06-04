import { useState } from "react";

import { CATEGORY_LABELS, CATEGORY_ORDER } from "./ElementList";

export interface ElementFormValues {
  category: string;
  specific_type: string;
  subcategory: string;
}

interface Props {
  title: string;
  initial: ElementFormValues;
  submitLabel: string;
  busy?: boolean;
  error?: string | null;
  onSubmit: (values: ElementFormValues) => void;
  onCancel: () => void;
}

/**
 * Modal form for adding or editing a detected element.
 * Category is a fixed dropdown; subcategory and specific type are free text.
 */
export default function ElementForm({
  title,
  initial,
  submitLabel,
  busy = false,
  error,
  onSubmit,
  onCancel,
}: Props) {
  const [values, setValues] = useState<ElementFormValues>(initial);

  const set = (key: keyof ElementFormValues, value: string) =>
    setValues((v) => ({ ...v, [key]: value }));

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center fade-in"
      style={{ background: "rgba(28,24,19,0.45)" }}
    >
      <div className="bg-paper border border-line p-8 max-w-md w-full mx-6 flex flex-col gap-5">
        <p className="eyebrow text-accent">{title}</p>

        <label className="block">
          <span className="eyebrow">Category</span>
          <select
            value={values.category}
            onChange={(e) => set("category", e.target.value)}
            className="mt-1.5 w-full bg-transparent border-b border-line py-2 font-display text-lg text-ink focus:border-accent transition-colors outline-none"
          >
            {CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c] ?? c}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="eyebrow">Subcategory</span>
          <input
            value={values.subcategory}
            placeholder="e.g. bird, tree, building"
            onChange={(e) => set("subcategory", e.target.value)}
            className="mt-1.5 w-full bg-transparent border-b border-line py-2 font-display text-lg text-ink placeholder:text-muted/50 focus:border-accent transition-colors outline-none"
          />
        </label>

        <label className="block">
          <span className="eyebrow">Specific type</span>
          <input
            value={values.specific_type}
            placeholder="e.g. parrot, oak, cathedral"
            onChange={(e) => set("specific_type", e.target.value)}
            className="mt-1.5 w-full bg-transparent border-b border-line py-2 font-display text-lg text-ink placeholder:text-muted/50 focus:border-accent transition-colors outline-none"
          />
        </label>

        {error && (
          <p className="text-sm text-accent border-l-2 border-accent pl-3">{error}</p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 py-3 eyebrow text-muted border border-line hover:border-ink hover:text-ink transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(values)}
            disabled={busy}
            className="flex-1 py-3 eyebrow !text-paper bg-accent hover:bg-ink transition-colors disabled:opacity-40"
          >
            {busy ? "Saving…" : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
