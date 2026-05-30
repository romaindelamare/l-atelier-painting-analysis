import { Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import GalleryPage from "./pages/GalleryPage";
import PaintingDetailPage from "./pages/PaintingDetailPage";
import UploadPage from "./pages/UploadPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/collection" element={<GalleryPage />} />
        <Route path="/paintings/:id" element={<PaintingDetailPage />} />
      </Routes>
    </Layout>
  );
}
