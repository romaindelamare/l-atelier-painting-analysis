import { useNavigate } from "react-router-dom";

import ImageUploader from "../components/ImageUploader";
import type { PaintingDetail } from "../types/painting";

export default function UploadPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-6xl px-6 md:px-10">
      <section className="pt-4 md:pt-8 pb-2 rise">
        <p className="eyebrow">Gallery No. 01 · Acquisitions</p>
        <h1 className="font-display text-5xl md:text-7xl font-medium leading-[0.95] mt-2 max-w-3xl text-ink">
          Submit a painting for{" "}
          <span className="italic text-accent">curatorial analysis</span>.
        </h1>
        <p className="mt-2 max-w-xl text-muted text-lg font-display">
          Upload an artwork and our studio will identify every element within the
          composition and read its dominant palette - then file it in the
          collection.
        </p>
      </section>

      <div className="h-px bg-line mb-4" />

      <section
        className="pb-6 rise"
        style={{ animationDelay: "120ms" }}
      >
        <ImageUploader
          onUploaded={(p: PaintingDetail) => navigate(`/paintings/${p.id}`)}
        />
      </section>
    </div>
  );
}
