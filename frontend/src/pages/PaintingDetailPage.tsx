import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import BoundingBoxOverlay from "../components/BoundingBoxOverlay";
import ColorPalette from "../components/ColorPalette";
import ElementList from "../components/ElementList";
import { updatePainting } from "../api/client";
import { usePainting } from "../hooks/usePaintings";
import type { PaintingDetail } from "../types/painting";

type Tab = "elements" | "notes" | "color";

const TABS: { id: Tab; label: string }[] = [
  { id: "elements", label: "Elements" },
  { id: "notes", label: "Curator's notes" },
  { id: "color", label: "Color" },
];

const FIELDS = [
  { key: "title" as const, label: "Title", placeholder: "Untitled" },
  { key: "artist" as const, label: "Artist", placeholder: "Unknown" },
  { key: "year" as const, label: "Year", placeholder: "—" },
];

export default function PaintingDetailPage() {
  const { id } = useParams();
  const { data: fetched, loading, error } = usePainting(Number(id));
  const [data, setData] = useState<PaintingDetail | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("elements");
  const [zoomed, setZoomed] = useState(false);
  const [showBoxes, setShowBoxes] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editMeta, setEditMeta] = useState({ title: "", artist: "", year: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const zoomTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (fetched) setData(fetched);
  }, [fetched]);

  useEffect(() => {
    if (!zoomed) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [zoomed]);

  useEffect(() => {
    if (!zoomed) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [zoomed]);

  useEffect(() => {
    if (!zoomed) return;
    overlayRef.current?.focus();
    return () => {
      zoomTriggerRef.current?.focus();
      zoomTriggerRef.current = null;
    };
  }, [zoomed]);

  const handleSelect = (elementId: number) => {
    setHighlightedId(elementId);
    setSelectedId(elementId);
    setActiveTab("elements");
  };

  useEffect(() => {
    if (selectedId === null || activeTab !== "elements") return;
    const container = listRef.current;
    const item = container?.querySelector<HTMLElement>(`[data-element-id="${selectedId}"]`);
    if (container && item) {
      const containerRect = container.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      const targetScrollTop = container.scrollTop + itemRect.top - containerRect.top - 16;
      container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: "smooth" });
    }
  }, [selectedId, activeTab]);

  function startEditing() {
    if (!data) return;
    setEditMeta({
      title: data.title ?? "",
      artist: data.artist ?? "",
      year: data.year ?? "",
      notes: data.notes ?? "",
    });
    setSaveError(null);
    setEditing(true);
  }

  async function saveEdits() {
    if (!data) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updatePainting(data.id, editMeta);
      setData(updated);
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-full flex flex-col lg:overflow-hidden">
      {/* Header bar: back link + action buttons */}
      <div className="shrink-0 px-6 md:px-10 pt-4 pb-1 flex items-center justify-between">
        <Link to="/collection" className="eyebrow text-muted hover:text-accent transition-colors flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
          </svg>
          Back to Collection
        </Link>

        {data && (
          <div className="flex items-center gap-4">
            {/* Annotations toggle */}
            <button
              onClick={() => setShowBoxes((v) => !v)}
              className="eyebrow text-muted hover:text-accent transition-colors flex items-center gap-1.5"
              title={showBoxes ? "Hide annotations" : "Show annotations"}
            >
              {showBoxes ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              )}
              {showBoxes ? "Annotations" : "Annotations"}
            </button>

            {/* Zoom toggle */}
            <button
              onClick={() => {
                zoomTriggerRef.current = document.activeElement as HTMLElement | null;
                setZoomed(true);
              }}
              className="eyebrow text-muted hover:text-accent transition-colors flex items-center gap-1.5"
              title="Zoom in"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8V5a2 2 0 0 1 2-2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2h-3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/>
              </svg>
              Zoom
            </button>

            {/* Edit toggle */}
            <button
              onClick={editing ? () => setEditing(false) : startEditing}
              className={[
                "eyebrow transition-colors flex items-center gap-1.5",
                editing ? "text-accent hover:text-ink" : "text-muted hover:text-accent",
              ].join(" ")}
              title={editing ? "Cancel editing" : "Edit painting"}
            >
              {editing ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              )}
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>
        )}
      </div>

      {loading && (
        <p className="text-muted eyebrow py-24 text-center">Unveiling the work…</p>
      )}
      {error && (
        <p className="mt-8 mx-6 md:mx-10 text-accent border-l-2 border-accent pl-3">{error}</p>
      )}

      {data && (
        <div className="flex-1 min-h-0 flex flex-col lg:overflow-hidden px-6 md:px-10 pt-4 pb-2">
          {/* Two-column layout */}
          <div className="lg:flex-1 lg:min-h-0 grid lg:grid-cols-[1.45fr_1fr] gap-8 lg:gap-12">

            {/* Left: title block + painting */}
            <div className="flex flex-col">
              <header className="shrink-0 mb-4 rise">
                <p className="eyebrow">Catalogue No. {String(data.id).padStart(3, "0")}</p>
                <h1 className="font-display text-2xl md:text-4xl font-medium leading-[0.97] mt-2 text-ink">
                  {data.title}
                </h1>
                <p className="mt-1.5 text-sm text-muted font-display">
                  {data.artist || "Unknown artist"}
                  {data.year ? ` · ${data.year}` : ""}
                </p>
              </header>
              <div className="flex flex-col items-center rise py-2">
                <div
                  style={{
                    width: `min(100%, calc((100dvh - 395px) * ${data.width / data.height} + 40px))`,
                  }}
                >
                  <BoundingBoxOverlay
                    filename={data.filename}
                    title={data.title}
                    width={data.width}
                    height={data.height}
                    elements={data.elements}
                    highlightedId={highlightedId}
                    onHover={setHighlightedId}
                    onSelect={handleSelect}
                    showBoxes={showBoxes}
                  />
                </div>
              </div>
            </div>

            {/* Right: tabbed panel or edit form */}
            <aside
              className="flex flex-col min-h-0 rise"
              style={{ animationDelay: "120ms" }}
            >
              {editing ? (
                /* Edit form */
                <div className="flex flex-col min-h-0">
                  <p className="eyebrow mb-1 text-muted">Editing catalogue entry</p>
                  <div className="flex-1 overflow-y-auto min-h-0 pt-2">
                    <div className="space-y-4 pr-1">
                      {FIELDS.map((f) => (
                        <label key={f.key} className="block">
                          <span className="eyebrow">{f.label}</span>
                          <input
                            value={editMeta[f.key]}
                            placeholder={f.placeholder}
                            onChange={(e) => setEditMeta((m) => ({ ...m, [f.key]: e.target.value }))}
                            className="mt-1.5 w-full bg-transparent border-b border-line py-2 font-display text-xl text-ink placeholder:text-muted/50 focus:border-accent transition-colors outline-none"
                          />
                        </label>
                      ))}
                      <label className="block">
                        <span className="eyebrow">Notes</span>
                        <textarea
                          value={editMeta.notes}
                          rows={2}
                          placeholder="Provenance, observations…"
                          onChange={(e) => setEditMeta((m) => ({ ...m, notes: e.target.value }))}
                          className="mt-1.5 w-full bg-transparent border-b border-line py-2 font-sans text-base text-ink placeholder:text-muted/50 focus:border-accent transition-colors outline-none resize-none"
                        />
                      </label>
                    </div>
                  </div>

                  {saveError && (
                    <p className="shrink-0 mt-3 text-sm text-accent border-l-2 border-accent pl-3">
                      {saveError}
                    </p>
                  )}

                  <button
                    onClick={saveEdits}
                    disabled={saving}
                    className={[
                      "shrink-0 mt-4 w-full py-4 eyebrow text-paper transition-all duration-300",
                      saving ? "bg-ink/30 cursor-not-allowed" : "bg-ink hover:bg-accent",
                    ].join(" ")}
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              ) : (
                /* Tabbed panel */
                <>
                  <div className="shrink-0 flex gap-6">
                    {TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={[
                          "eyebrow py-3 border-b-2 transition-colors duration-200",
                          activeTab === tab.id
                            ? "border-accent text-ink"
                            : "border-transparent text-muted hover:text-ink",
                        ].join(" ")}
                      >
                        {tab.label}
                        {tab.id === "elements" && (
                          <span className="ml-2 opacity-50">{data.elements.length}</span>
                        )}
                        {tab.id === "color" && (
                          <span className="ml-2 opacity-50">{data.palette.length}</span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div
                    ref={!zoomed && activeTab === "elements" ? listRef : undefined}
                    className="flex-1 overflow-y-auto min-h-0 pt-2"
                  >
                    {activeTab === "elements" && (
                      <ElementList
                        elements={data.elements}
                        highlightedId={highlightedId}
                        onHover={setHighlightedId}
                      />
                    )}
                    {activeTab === "notes" && (
                      <div className="pr-1">
                        {data.notes ? (
                          <p className="font-display text-lg text-ink/90 italic leading-relaxed">
                            {data.notes}
                          </p>
                        ) : (
                          <p className="font-display text-lg text-muted italic">
                            No curator&apos;s notes for this work.
                          </p>
                        )}
                      </div>
                    )}
                    {activeTab === "color" && (
                      <div className="pr-1">
                        <ColorPalette palette={data.palette} />
                      </div>
                    )}
                  </div>
                </>
              )}
            </aside>
          </div>

          {zoomed && (
            <div
              ref={overlayRef}
              role="dialog"
              aria-modal="true"
              aria-label="Painting zoom view"
              className="fixed inset-0 z-50 bg-paper fade-in flex flex-col"
              tabIndex={-1}
            >
              {/* Top bar — mirrors the main page header */}
              <div className="shrink-0 px-6 md:px-10 pt-4 pb-1 flex items-center justify-between">
                <p className="eyebrow text-muted">Press Esc to exit</p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowBoxes((v) => !v)}
                    className="eyebrow text-muted hover:text-accent transition-colors flex items-center gap-1.5"
                  >
                    {showBoxes ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    )}
                    Annotations
                  </button>
                  <button
                    onClick={() => setZoomed(false)}
                    className="eyebrow text-muted hover:text-accent transition-colors flex items-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
                    </svg>
                    Exit zoom
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 grid lg:grid-cols-[1.6fr_1fr] gap-8 p-6 lg:p-10 pt-2 lg:pt-2">

                {/* Left: painting */}
                <div className="flex flex-col items-center justify-center min-h-0">
                  <div
                    style={{
                      width: `min(100%, calc((100dvh - 80px) * ${data.width / data.height} + 40px))`,
                    }}
                  >
                    <BoundingBoxOverlay
                      filename={data.filename}
                      title={data.title}
                      width={data.width}
                      height={data.height}
                      elements={data.elements}
                      highlightedId={highlightedId}
                      onHover={setHighlightedId}
                      onSelect={handleSelect}
                      showBoxes={showBoxes}
                    />
                  </div>
                </div>

                {/* Right: tabbed panel */}
                <aside className="flex flex-col min-h-0">
                  <div className="shrink-0 flex gap-6">
                    {TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={[
                          "eyebrow py-3 border-b-2 transition-colors duration-200",
                          activeTab === tab.id
                            ? "border-accent text-ink"
                            : "border-transparent text-muted hover:text-ink",
                        ].join(" ")}
                      >
                        {tab.label}
                        {tab.id === "elements" && (
                          <span className="ml-2 opacity-50">{data.elements.length}</span>
                        )}
                        {tab.id === "color" && (
                          <span className="ml-2 opacity-50">{data.palette.length}</span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div
                    ref={zoomed && activeTab === "elements" ? listRef : undefined}
                    className="flex-1 overflow-y-auto min-h-0 pt-2"
                  >
                    {activeTab === "elements" && (
                      <ElementList
                        elements={data.elements}
                        highlightedId={highlightedId}
                        onHover={setHighlightedId}
                      />
                    )}
                    {activeTab === "notes" && (
                      <div className="pr-1">
                        {data.notes ? (
                          <p className="font-display text-lg text-ink/90 italic leading-relaxed">
                            {data.notes}
                          </p>
                        ) : (
                          <p className="font-display text-lg text-muted italic">
                            No curator&apos;s notes for this work.
                          </p>
                        )}
                      </div>
                    )}
                    {activeTab === "color" && (
                      <div className="pr-1">
                        <ColorPalette palette={data.palette} />
                      </div>
                    )}
                  </div>

                </aside>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
