# Object Detection — API Reference

## Endpoint

```
POST https://api.interfaze.ai/v1/chat/completions
```

Model name: `interfaze-beta`.

## Image input format

Same as OCR — images are passed in the message content array. Use the SDK-specific shape:

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

To detect both objects and text with positions, add a `texts` array with the same bounding box fields plus a `text` field. See the SKILL.md "Detect objects and text with positions" example.

## Run task mode (raw output)

Set `<task>object_detection</task>` in the system message for a fixed structure with `detected_objects` (each with `bounds` and `label`) and `gui_elements`.

### TypeScript — OpenAI SDK

```ts
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const response = await interfaze.chat.completions.create({
  model: "interfaze-beta",
  messages: [
    { role: "system", content: "<task>object_detection</task>" },
    {
      role: "user",
      content: [
        { type: "text", text: "Detect objects in this image" },
        { type: "image_url", image_url: { url: "<url>" } },
      ],
    },
  ],
  response_format: zodResponseFormat(z.any(), "empty_schema"),
});
```

### TypeScript — Vercel AI SDK

```ts
import { generateObject } from "ai";
import { z } from "zod";

const { object } = await generateObject({
  model: interfaze.chat("interfaze-beta"),
  system: "<task>object_detection</task>",
  schema: z.any(),
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Detect objects in this image" },
        { type: "image", mediaType: "image/png", image: "<url>" },
      ],
    },
  ],
});
```

### TypeScript — LangChain SDK

```ts
const structuredModel = interfaze.withStructuredOutput({});

const response = await structuredModel.invoke([
  { role: "system", content: "<task>object_detection</task>" },
  {
    role: "user",
    content: [
      { type: "text", text: "Detect objects in this image" },
      { type: "image_url", image_url: { url: "<url>" } },
    ],
  },
]);
```

### Python — OpenAI SDK

```python
response = interfaze.chat.completions.create(
    model="interfaze-beta",
    messages=[
        {"role": "system", "content": "<task>object_detection</task>"},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Detect objects in this image"},
                {"type": "image_url", "image_url": {"url": "<url>"}},
            ],
        },
    ],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "empty_schema",
            "schema": {"type": "object", "properties": {}, "additionalProperties": True},
        },
    },
)
```

### Python — LangChain SDK

```python
from langchain_core.messages import SystemMessage, HumanMessage

structured = interfaze.with_structured_output({
    "name": "empty_schema",
    "schema": {"type": "object", "properties": {}, "additionalProperties": True},
})

response = structured.invoke([
    SystemMessage(content="<task>object_detection</task>"),
    HumanMessage(content=[
        {"type": "text", "text": "Detect objects in this image"},
        {"type": "image_url", "image_url": {"url": "<url>"}},
    ]),
])
```

## Tips

- Be specific in the prompt about what to detect. "Find all vehicles" works better than "detect objects."
- Use `.describe()` / `Field(description=...)` on the name field to guide labelling.
- Add a `category` field to the schema if you need objects grouped by type.
- Coordinates are returned in pixels relative to the original image dimensions.
