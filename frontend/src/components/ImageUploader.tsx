import { useRef, useState } from "react";

import { uploadPainting } from "../api/client";
import type { PaintingDetail } from "../types/painting";

const FIELDS = [
  { key: "title", label: "Title", placeholder: "Untitled" },
  { key: "artist", label: "Artist", placeholder: "Unknown" },
  { key: "year", label: "Year", placeholder: "—" },
] as const;

type MetaKey =
  | (typeof FIELDS)[number]["key"]
  | "notes"
  | "location_owner"
  | "location_city"
  | "location_country";

export default function ImageUploader({
  onUploaded,
}: {
  onUploaded: (painting: PaintingDetail) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [meta, setMeta] = useState<Record<MetaKey, string>>({
    title: "",
    artist: "",
    year: "",
    notes: "",
    location_owner: "",
    location_city: "",
    location_country: "",
  });
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function choose(next: File | null) {
    if (!next) return;
    setError(null);
    setFile(next);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(next);
    });
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    setFile(null);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    if (inputRef.current) inputRef.current.value = "";
  }

  async function submit() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const painting = await uploadPainting(file, meta);
      onUploaded(painting);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setBusy(false);
    }
  }

  return (
    <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-10 md:gap-14 items-start">
      {/* Drop zone */}
      <div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") && inputRef.current?.click()
          }
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            choose(e.dataTransfer.files?.[0] ?? null);
          }}
          className={[
            "relative aspect-[4/5] w-full rounded-sm cursor-pointer overflow-hidden",
            "transition-all duration-300 flex items-center justify-center",
            "ring-1 ring-line",
            dragging
              ? "bg-paper-deep ring-accent shadow-[0_20px_60px_-30px_rgba(28,24,19,0.5)]"
              : "bg-paper-deep/40 hover:bg-paper-deep/70",
          ].join(" ")}
        >
          {preview ? (
            <>
              <div className="absolute inset-4 p-3 bg-[#fbfaf6] shadow-[0_30px_70px_-30px_rgba(28,24,19,0.55)]">
                <img
                  src={preview}
                  alt="Selected painting preview"
                  className="h-full w-full object-contain"
                />
              </div>

            </>
          ) : (
            <div className="text-center px-8">
              <p className="font-display text-2xl text-ink">
                {dragging ? "Release to place" : "Hang a painting"}
              </p>
              <p className="eyebrow mt-3">Drag &amp; drop · or click to browse</p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => choose(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      {/* Placard / metadata */}
      <div className="md:pt-2">
        <p className="eyebrow">Catalogue entry · optional</p>
        <p className="font-display text-3xl mt-2 mb-7 text-ink leading-tight">
          Describe the work
          <span className="text-accent">.</span>
        </p>

        <div className="space-y-6">
          {FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="eyebrow">{f.label}</span>
              <input
                value={meta[f.key]}
                placeholder={f.placeholder}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, [f.key]: e.target.value }))
                }
                className="mt-1.5 w-full bg-transparent border-b border-line py-2 font-display text-xl text-ink placeholder:text-muted/50 focus:border-accent transition-colors outline-none"
              />
            </label>
          ))}
          <div>
            <span className="eyebrow block mb-3">Location</span>
            <div className="space-y-4 pl-0.5">
              {(
                [
                  { key: "location_owner", label: "Owner / Museum", placeholder: "Louvre, Private collection…" },
                  { key: "location_city", label: "City", placeholder: "Paris" },
                  { key: "location_country", label: "Country", placeholder: "France" },
                ] as const
              ).map((f) => (
                <label key={f.key} className="block">
                  <span className="eyebrow text-muted/70">{f.label}</span>
                  <input
                    value={meta[f.key]}
                    placeholder={f.placeholder}
                    onChange={(e) => setMeta((m) => ({ ...m, [f.key]: e.target.value }))}
                    className="mt-1 w-full bg-transparent border-b border-line py-2 font-display text-lg text-ink placeholder:text-muted/50 focus:border-accent transition-colors outline-none"
                  />
                </label>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="eyebrow">Notes</span>
            <textarea
              value={meta.notes}
              rows={2}
              placeholder="Provenance, observations…"
              onChange={(e) => setMeta((m) => ({ ...m, notes: e.target.value }))}
              className="mt-1.5 w-full bg-transparent border-b border-line py-2 font-sans text-base text-ink placeholder:text-muted/50 focus:border-accent transition-colors outline-none resize-none"
            />
          </label>
        </div>

        {error && (
          <p className="mt-6 text-sm text-accent border-l-2 border-accent pl-3">
            {error}
          </p>
        )}

        <button
          onClick={submit}
          disabled={!file || busy}
          className={[
            "mt-9 w-full py-4 eyebrow !text-paper transition-all duration-300",
            !file || busy
              ? "bg-ink/30 cursor-not-allowed"
              : "bg-ink hover:bg-accent",
          ].join(" ")}
        >
          {busy ? "Analyzing the canvas…" : "Analyze Painting"}
        </button>
        {busy && (
          <p className="mt-3 text-center text-sm text-muted font-display italic">
            Detecting objects and reading color — this can take a moment.
          </p>
        )}
      </div>
    </div>
  );
}
