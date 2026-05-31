import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import BoundingBoxOverlay from "../components/BoundingBoxOverlay";
import ColorPalette from "../components/ColorPalette";
import ElementList from "../components/ElementList";
import { usePainting } from "../hooks/usePaintings";

type Tab = "elements" | "notes" | "color";

const TABS: { id: Tab; label: string }[] = [
  { id: "elements", label: "Elements" },
  { id: "notes", label: "Curator's notes" },
  { id: "color", label: "Color" },
];

export default function PaintingDetailPage() {
  const { id } = useParams();
  const { data, loading, error } = usePainting(Number(id));
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("elements");
  const [zoomed, setZoomed] = useState(false);
  const [showBoxes, setShowBoxes] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const zoomTriggerRef = useRef<HTMLElement | null>(null);

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


  return (
    <div className="h-full flex flex-col lg:overflow-hidden">
      {/* Back link */}
      <div className="shrink-0 px-6 md:px-10 pt-4 pb-1">
        <Link to="/collection" className="eyebrow text-muted hover:text-accent transition-colors">
          ← Back to Collection
        </Link>
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
                    zoomed={false}
                    onToggleZoom={() => {
                      zoomTriggerRef.current = document.activeElement as HTMLElement | null;
                      setZoomed(true);
                    }}
                    showBoxes={showBoxes}
                    onToggleBoxes={() => setShowBoxes((v) => !v)}
                  />
                </div>
              </div>
            </div>

            {/* Right: tabbed panel */}
            <aside
              className="flex flex-col min-h-0 rise"
              style={{ animationDelay: "120ms" }}
            >
              {/* Tab bar */}
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

              {/* Tab content — scrolls independently */}
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
              <div className="flex-1 min-h-0 grid lg:grid-cols-[1.6fr_1fr] gap-8 p-6 lg:p-10">

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
                      zoomed={true}
                      onToggleZoom={() => setZoomed(false)}
                      showBoxes={showBoxes}
                      onToggleBoxes={() => setShowBoxes((v) => !v)}
                    />
                  </div>
                </div>

                {/* Right: tabbed panel */}
                <aside className="flex flex-col min-h-0">
                  {/* Tab bar */}
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

                  {/* Tab content */}
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

                  <p className="shrink-0 eyebrow text-muted pt-3 text-center">
                    Press Esc to exit
                  </p>
                </aside>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
