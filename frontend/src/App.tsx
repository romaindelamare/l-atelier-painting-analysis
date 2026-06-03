import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./auth/ProtectedRoute";
import Layout from "./components/Layout";
import GalleryPage from "./pages/GalleryPage";
import LoginPage from "./pages/LoginPage";
import PaintingDetailPage from "./pages/PaintingDetailPage";
import UploadPage from "./pages/UploadPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<GalleryPage />} />
        {/* Legacy path: the collection now lives at the root. */}
        <Route path="/collection" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          }
        />
        <Route path="/paintings/:id" element={<PaintingDetailPage />} />
      </Routes>
    </Layout>
  );
}
