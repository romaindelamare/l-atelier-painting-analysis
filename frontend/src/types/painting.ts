// Shapes returned by the backend paintings API (see backend/app/schemas/painting.py).

export interface DetectedElement {
  id: number;
  name: string;
  description: string | null;
  top_left_x: number;
  top_left_y: number;
  bottom_right_x: number;
  bottom_right_y: number;
}

export interface PaletteColor {
  id: number;
  hex: string;
  r: number;
  g: number;
  b: number;
  proportion: number;
}

export interface PaintingSummary {
  id: number;
  title: string;
  artist: string | null;
  year: string | null;
  filename: string;
  width: number;
  height: number;
  created_at: string;
  element_count: number;
}

export interface PaintingDetail {
  id: number;
  title: string;
  artist: string | null;
  year: string | null;
  notes: string | null;
  filename: string;
  content_type: string;
  width: number;
  height: number;
  created_at: string;
  elements: DetectedElement[];
  palette: PaletteColor[];
}

export interface UploadMetadata {
  title?: string;
  artist?: string;
  year?: string;
  notes?: string;
}
