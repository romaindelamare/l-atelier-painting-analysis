---
name: object-detection
description: >
  Use Interfaze AI to detect, locate, and identify objects in images and PDFs with
  bounding box coordinates. Activate when the user wants to find objects, get their
  positions, count items, or locate specific things in an image - even if they say
  "find the car in this photo", "where is the logo", or "what objects are in this
  image" without explicitly mentioning object detection.
---

# Object Detection with Interfaze AI

Detect and locate objects in images with bounding box coordinates using Interfaze AI.

## When to use this skill

- The user wants to find or locate objects in an image
- The user needs bounding box coordinates for detected objects
- The user wants to count specific items in a photo
- The user says "find the X in this image", "where is the Y", "what objects are here"
- The task involves spatial understanding - positions, regions, or layout of objects
- The user wants both object positions and any visible text with coordinates

## When not to use this skill

- The user only wants to read text from an image - use OCR
- The user wants to transcribe audio - use speech-to-text
- The input is not an image
- The user wants image classification without location data

## Workflow

1. Confirm the input is an image URL or base64-encoded image.
2. Determine what objects the user wants to detect, or if they want all objects.
3. Build a schema with object names and bounding box coordinate fields (`top_left_x`, `top_left_y`, `bottom_right_x`, `bottom_right_y`).
4. Call the chosen SDK with the image and a prompt describing what to detect.
5. Return the detected objects with their positions.

## Setup

### TypeScript - OpenAI SDK

```ts
import OpenAI from "openai";

const interfaze = new OpenAI({
  baseURL: "https://api.interfaze.ai/v1",
  apiKey: process.env.INTERFAZE_API_KEY,
});
```

### TypeScript - Vercel AI SDK

```ts
import { createOpenAI } from "@ai-sdk/openai";

const interfaze = createOpenAI({
  baseURL: "https://api.interfaze.ai/v1",
  apiKey: process.env.INTERFAZE_API_KEY,
});
```

### TypeScript - LangChain SDK

```ts
import { ChatOpenAI } from "@langchain/openai";

const interfaze = new ChatOpenAI({
  configuration: { baseURL: "https://api.interfaze.ai/v1" },
  apiKey: process.env.INTERFAZE_API_KEY,
  model: "interfaze-beta",
});
```

### Python - OpenAI SDK

```python
from openai import OpenAI

interfaze = OpenAI(
    base_url="https://api.interfaze.ai/v1",
    api_key="<your-api-key>",
)
```

### Python - LangChain SDK

```python
from langchain_openai import ChatOpenAI

interfaze = ChatOpenAI(
    base_url="https://api.interfaze.ai/v1",
    api_key="<your-api-key>",
    model="interfaze-beta",
)
```

## References

- [API details](references/api.md)
- [Trigger examples](references/examples.md)
