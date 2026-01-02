# Frame3D

Frame3D is a small HTTP API for rendering images from 3D models (GLB). It uses Puppeteer to drive a headless browser and @google/model-viewer to load and render the model, then returns the rendered image(s) as base64 data URLs.

You can use Frame3D through the [hosted web API](https://frame3d.dev), run the API yourself with or without Docker, or use the [local CLI](#local-cli-script) that can read local files (GLB / HDR / images) and write output images to disk.

Frame3D provides three modes with full control over camera, lighting, and environment:

- **Single render** (one image)
- **Batch renders** (multiple frames with per-frame options)
- **Sequence renders** (multiple frames for rotation and/or animation)

For full documentation and request schemas, see [frame3d.dev/docs](https://frame3d.dev/docs).

## Example
![](example-lounge-chair.gif)

```bash
npm run frame3d -- mode=sequence model=./examples/model.glb background="radial-gradient(circle, #5f5f5f 0%, #141414 120%)" frameCount=66 rotationAxis=y width=1280 height=720 shadowIntensity=0.5 shadowSoftness=0.5 outputFormat=png out=./examples/seq/frame
```

## Requirements
Depending on how you want to run Frame3D, you’ll need at least one of the following:

- **Node.js >= 18**: Required for local development and using the CLI tool.
- **Chrome / Chromium**: Required for non-Docker runs.
- **Docker**: For containerized runs.

## Limits Configuration

Default limits are defined in [src/config.ts](src/config.ts). You can edit that file or override at runtime for stricter or more lenient limits, e.g.: `docker run -e JSON_BODY_MAX_SIZE=25mb -e MAX_FRAMES_PER_REQUEST=128 frame3d`, or set the same env vars in `.env` / `.env.local` when running without Docker.

## Run as an API (Docker)

From the project root directory:

```bash
npm ci
npm run build

docker build -t frame3d .
docker run -p 8080:8080 frame3d
```

Health check:

```bash
curl http://localhost:8080/health
```

Single render example:

```bash
curl -X POST http://localhost:8080/single \
  -H "content-type: application/json" \
  -d '{"model":"https://example.com/model.glb","outputFormat":"png"}'
```

## Run as an API (Node, no Docker)

From the project root directory:

```bash
npm ci
npm run build
```

**Configure Chrome/Chromium path:**

Copy `.env.local.example` to `.env.local` and set your Chrome path:

```bash
# .env.local

# Linux
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

# Windows
PUPPETEER_EXECUTABLE_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
```

Alternatively, set the environment variable for your current terminal session only:

```bash
# Linux
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

# Windows
set PUPPETEER_EXECUTABLE_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
```

Then start the server:

```bash
npm start
# or for development:
npm run dev
```

## Local CLI Script

The CLI is intentionally minimal: use `key=value` pairs; JSON payloads can be passed via `json=@file.json` (or just `@file.json`).

Notes:
- The CLI auto-starts and stops a local Node server for the request unless you pass `server=...` to use an already running instance.
- Default mode is `single`; use `mode=sequence` or `mode=batch` for other routes.
- Include metadata by adding `includeMetadata=true` in your args or JSON.
- If `model=...` points to a local file, the CLI converts it to `data:model/gltf-binary;base64,...`.
- If `environment=...` or `skybox=...` points to a local file, the CLI converts it to `data:<mime>;base64,...`.
- If a value is already an `http(s)` URL or a `data:` URL, it is sent unchanged.
- Base64 is omitted by default in CLI output; use `out=...` to save files or `print-image` to print base64.
- Saving outputs:
  - Single: `out=out.png`
  - Sequence/Batch: give a base name (no extension) and files will be written as name-<index>.ext, e.g. out=frames -> frames-0.png, frames-1.png, ...

### CLI default (auto-start Node server)

From the project root directory:

```bash
npm ci
npm run build

# Shortcut for local one-shot renders (auto-detects Chrome)
npm run frame3d -- model=./examples/model.glb outputFormat=png out=./examples/out/single.png
```

The CLI auto-detects Chrome/Chromium. If detection fails, create `.env.local` with your Chrome path (see `.env.local.example`).

### CLI + Docker server

1. Start the container (as shown above).

2. From the project root directory, call the running API and pass local files:

```bash
npm run frame3d -- server=http://localhost:8080 model=./examples/model.glb outputFormat=png out=./examples/out/single.png
```

### CLI Examples

- **Single render with metadata:**
  ```bash
  npm run frame3d -- model=./examples/model.glb outputFormat=png includeMetadata=true out=./examples/out/single.png
  ```

- **Batch via JSON file (with metadata):**
  - Create `./examples/request.json`, then:
  ```bash
  npm run frame3d -- mode=batch json=@./examples/request.json includeMetadata=true out=./examples/out/batch
  ```

- **Sequence (8 frames):**
  ```bash
  npm run frame3d -- mode=sequence model=./examples/model.glb frameCount=8 rotationAxis=y outputFormat=png out=./examples/out/frames
  ```

## Tests

From the project root directory:

```bash
npm test

# Or individually
npm run test:unit
npm run test:integration
```

**Note:** Integration tests require `PUPPETEER_EXECUTABLE_PATH` to be set. Create `.env.local` with your Chrome path (see `.env.local.example`) before running tests.
