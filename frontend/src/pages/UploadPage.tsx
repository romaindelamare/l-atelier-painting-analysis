import { useNavigate } from "react-router-dom";

import ImageUploader from "../components/ImageUploader";
import type { PaintingDetail } from "../types/painting";

export default function UploadPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-6xl px-6 md:px-10">
      <section className="pt-8 md:pt-14 pb-5 rise">
        <p className="eyebrow">Gallery No. 01 · Acquisitions</p>
        <h1 className="font-display text-5xl md:text-7xl font-medium leading-[0.95] mt-4 max-w-3xl text-ink">
          Submit a painting for{" "}
          <span className="italic text-accent">curatorial analysis</span>.
        </h1>
        <p className="mt-5 max-w-xl text-muted text-lg font-display">
          Upload an artwork and our studio will identify every element within the
          composition and read its dominant palette - then file it in the
          collection.
        </p>
      </section>

      <div className="h-px bg-line mb-8" />

      <section
        className="pb-10 rise"
        style={{ animationDelay: "120ms" }}
      >
        <ImageUploader
          onUploaded={(p: PaintingDetail) => navigate(`/paintings/${p.id}`)}
        />
      </section>
    </div>
  );
}
