# Object Detection - Trigger Examples

## User asks that should activate this skill

- "Find all the cars in this image"
- "Where is the logo in this screenshot?"
- "Detect objects in this photo"
- "Get the bounding box coordinates of the buildings"
- "How many people are in this image and where are they?"
- "Locate the crane in this construction site photo"
- "What objects are visible in this image?"
- "Find the text and its position in this image"

## User asks that should not activate this skill

- "Read the text from this receipt" - use OCR (text extraction, not spatial detection)
- "Transcribe this audio" - use speech-to-text
- "Classify this image as indoor or outdoor" - classification, not detection
- "Scrape products from this website" - use web-scraping

## Ideal agent behavior

1. Accept the image input.
2. Identify what objects the user wants to detect (specific items or everything).
3. Build a Zod schema with name and bounding box fields.
4. Call `generateObject` with the image and detection prompt.
5. Return detected objects with their names and coordinates.
