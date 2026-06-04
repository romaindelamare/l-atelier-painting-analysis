// Shapes returned by the backend paintings API (see backend/app/schemas/painting.py).

export interface DetectedElement {
  id: number;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  specific_type: string | null;
  top_left_x: number;
  top_left_y: number;
  bottom_right_x: number;
  bottom_right_y: number;
  // Curation state + frozen original LLM detection.
  source: string;
  position: number;
  original_name?: string | null;
  original_category?: string | null;
  original_subcategory?: string | null;
  original_specific_type?: string | null;
}

/** A bounding box in image-pixel coordinates. */
export interface ElementBox {
  top_left_x: number;
  top_left_y: number;
  bottom_right_x: number;
  bottom_right_y: number;
}

/** Payload to add a manually-drawn element. */
export interface ElementCreate extends ElementBox {
  category: string;
  subcategory?: string | null;
  specific_type?: string | null;
}

/** Partial edit of an element (the box is left untouched). */
export interface ElementUpdate {
  category?: string;
  subcategory?: string | null;
  specific_type?: string | null;
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
  title: string | null;
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
  title: string | null;
  artist: string | null;
  year: string | null;
  notes: string | null;
  location_owner: string | null;
  location_city: string | null;
  location_country: string | null;
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
  location_owner?: string;
  location_city?: string;
  location_country?: string;
}
