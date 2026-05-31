# Object Detection - API Reference

## Endpoint

```
POST https://api.interfaze.ai/v1/chat/completions
```

Model name: `interfaze-beta`.

## Image input format

Same as OCR - images are passed in the message content array. Use the SDK-specific shape:

- Vercel AI SDK (TS): `{ type: "image", mediaType: "image/png", image: "<url>" }`
- OpenAI SDK / LangChain SDK (TS and Python): `{ type: "image_url", image_url: { url: "<url>" } }`

## Bounding box schema

Object detection uses pixel-space bounding box coordinates relative to the image dimensions.

### TypeScript (Zod)

```ts
z.object({
  objects: z.array(
    z.object({
      name: z.string().describe("description of the detected object"),
      top_left_x: z.number(),
      top_left_y: z.number(),
      bottom_right_x: z.number(),
      bottom_right_y: z.number(),
    })
  ),
})
```

### Python (Pydantic)

```python
from typing import List
from pydantic import BaseModel, Field

class DetectedObject(BaseModel):
    name: str = Field(..., description="description of the detected object")
    top_left_x: float
    top_left_y: float
    bottom_right_x: float
    bottom_right_y: float

class DetectionSchema(BaseModel):
    objects: List[DetectedObject]
```

## Combining objects and text

To detect both objects and text with positions, add a `texts` array with the same bounding box fields plus a `text` field.

## Tips

- Be specific in the prompt about what to detect. "Find all vehicles" works better than "detect objects".
- Use `.describe()` / `Field(description=...)` on the name field to guide labeling.
- Add a `category` field to the schema if you need objects grouped by type.
- Coordinates are returned in pixels relative to the original image dimensions.
