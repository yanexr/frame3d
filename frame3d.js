#!/usr/bin/env node
/* eslint-disable no-console */

// A CLI utility for Frame3D that sends requests to a running API endpoint or manages a temporary local server instance.

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function isHttpOrDataUrl(value) {
  return (
    typeof value === "string" &&
    (value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("data:"))
  );
}

function parsePrimitive(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (value === "undefined") return undefined;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
  return value;
}

function setDeep(target, keyPath, value) {
  const parts = keyPath.split(".").filter(Boolean);
  let current = target;
  for (let i = 0; i < parts.length; i += 1) {
    const key = parts[i];
    const isLast = i === parts.length - 1;
    const nextKey = parts[i + 1];
    const nextIsIndex = nextKey !== undefined && /^\d+$/.test(nextKey);

    if (isLast) {
      if (/^\d+$/.test(key) && Array.isArray(current)) {
        current[Number(key)] = value;
      } else {
        current[key] = value;
      }
      return;
    }

    if (/^\d+$/.test(key)) {
      const idx = Number(key);
      if (!Array.isArray(current)) {
        // Convert object slot into array if needed (best-effort).
        // eslint-disable-next-line no-param-reassign
        current = [];
      }
      if (current[idx] === undefined) current[idx] = nextIsIndex ? [] : {};
      current = current[idx];
      continue;
    }

    if (current[key] === undefined) current[key] = nextIsIndex ? [] : {};
    current = current[key];
  }
}

function parseArgs(argv) {
  const opts = {
    server: null,
    mode: "single",
    out: null,
    printImage: false,
    routeAlias: null, // single | batch | sequence
  };

  const body = {};

  for (const rawArg of argv) {
    if (!rawArg) continue;
    let raw = rawArg;

    // Leading "--" are optional
    if (raw.startsWith("--")) raw = raw.slice(2);

    if (raw === "print-image" || raw === "printImage") {
      opts.printImage = true;
      continue;
    }

    if (raw === "single") {
      opts.routeAlias = "single";
      continue;
    }
    if (raw === "batch") {
      opts.routeAlias = "batch";
      continue;
    }
    if (raw === "sequence") {
      opts.routeAlias = "sequence";
      continue;
    }

    if (raw.startsWith("server=")) {
      opts.server = raw.slice("server=".length);
      continue;
    }
    if (raw.startsWith("mode=")) {
      opts.mode = raw.slice("mode=".length).replace(/^\/+/, "");
      continue;
    }
    if (raw.startsWith("out=")) {
      opts.out = raw.slice("out=".length);
      continue;
    }

    if (raw.startsWith("json=")) {
      const jsonArg = raw.slice("json=".length);
      const jsonText = jsonArg.startsWith("@")
        ? fs.readFileSync(
            path.resolve(process.cwd(), jsonArg.slice(1)),
            "utf-8"
          )
        : jsonArg;
      const parsed = JSON.parse(jsonText);
      Object.assign(body, parsed);
      continue;
    }

    // Support bare "@file.json" as a shorthand for json=@file.json
    if (raw.startsWith("@")) {
      const jsonText = fs.readFileSync(
        path.resolve(process.cwd(), raw.slice(1)),
        "utf-8"
      );
      const parsed = JSON.parse(jsonText);
      Object.assign(body, parsed);
      continue;
    }

    const eq = raw.indexOf("=");
    if (eq === -1) {
      throw new Error(
        `Invalid arg '${raw}'. Use key=value, json=@file.json, or server=...`
      );
    }

    const key = raw.slice(0, eq);
    const value = raw.slice(eq + 1);

    // Special top-level opts
    if (key === "mode") {
      opts.mode = value.replace(/^\/+/, "");
      continue;
    }
    if (key === "path") {
      opts.mode = value.replace(/^\/+/, "");
      continue;
    }
    if (key === "out") {
      opts.out = value;
      continue;
    }
    if (key === "json") {
      const jsonText = value.startsWith("@")
        ? fs.readFileSync(path.resolve(process.cwd(), value.slice(1)), "utf-8")
        : value;
      const parsed = JSON.parse(jsonText);
      Object.assign(body, parsed);
      continue;
    }

    setDeep(body, key, parsePrimitive(value));
  }

  return { opts, body };
}

function inferExtFromDataUrl(dataUrl) {
  if (dataUrl.startsWith("data:image/png")) return ".png";
  if (dataUrl.startsWith("data:image/webp")) return ".webp";
  if (dataUrl.startsWith("data:image/avif")) return ".avif";
  return ".png";
}

function writeImagesFromResponse(json, outBase) {
  const outputs = [];
  const hasTrailingSlash = /[\\/]$/.test(outBase);
  const normalizedBase = hasTrailingSlash
    ? outBase.replace(/[\\/]+$/, "")
    : outBase;

  const parsed = path.parse(normalizedBase);
  const ensureDir = hasTrailingSlash
    ? parsed.dir
      ? path.join(parsed.dir, parsed.base)
      : parsed.base || "."
    : parsed.dir || ".";
  const baseName = hasTrailingSlash ? "" : parsed.name;
  const baseExt = hasTrailingSlash ? "" : parsed.ext || "";

  // Create output directory if it does not exist (best-effort, recursive)
  fs.mkdirSync(ensureDir || ".", { recursive: true });

  const saveOne = (dataUrl, idxSuffix = "") => {
    const effectiveExt = baseExt || inferExtFromDataUrl(dataUrl);
    const effectiveName = baseName || "image";
    const fileName = idxSuffix
      ? `${effectiveName}-${idxSuffix}${effectiveExt}`
      : `${effectiveName}${effectiveExt}`;
    const outPath = path.join(ensureDir, fileName);
    decodeDataUrlToFile(dataUrl, outPath);
    outputs.push(outPath);
  };

  if (typeof json.image === "string") {
    saveOne(json.image);
    return outputs;
  }

  if (Array.isArray(json.images)) {
    json.images.forEach((item, i) => {
      if (!item || typeof item.image !== "string") return;
      const idx = item.index ?? i;
      saveOne(item.image, String(idx));
    });
  }

  return outputs;
}

function mimeFromExt(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".avif":
      return "image/avif";
    case ".hdr":
      return "image/vnd.radiance";
    case ".exr":
      return "image/x-exr";
    default:
      return "application/octet-stream";
  }
}

function toDataUrlFromFile(filePath, contentType) {
  const abs = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);
  const buf = fs.readFileSync(abs);
  const base64 = buf.toString("base64");
  return `data:${contentType};base64,${base64}`;
}

function encodeKnownAssetFields(obj) {
  if (!obj || typeof obj !== "object") return;

  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === "object") {
      encodeKnownAssetFields(value);
      continue;
    }

    if (typeof value !== "string") continue;
    if (isHttpOrDataUrl(value)) continue;

    if (key === "model") {
      if (fs.existsSync(value) && fs.statSync(value).isFile()) {
        obj[key] = toDataUrlFromFile(value, "model/gltf-binary");
      }
      continue;
    }

    if (key === "background" || key === "environment" || key === "skybox") {
      if (fs.existsSync(value) && fs.statSync(value).isFile()) {
        obj[key] = toDataUrlFromFile(value, mimeFromExt(value));
      }
    }
  }
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function waitForHealth(endpoint, timeoutMs, serverProc) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;

  // Give the server a moment to start
  await sleep(500);

  while (Date.now() < deadline) {
    // Check if server process died
    if (serverProc && serverProc._exited) {
      const stderr = serverProc._stderrBuffer ? serverProc._stderrBuffer() : "";
      throw new Error(
        `Server process exited with code ${serverProc._exitCode}` +
          (stderr ? `\n${stderr}` : "")
      );
    }
    try {
      const res = await fetch(`${endpoint.replace(/\/$/, "")}/health`);
      if (res.ok) return;
      lastError = new Error(`Health check returned ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    await sleep(250);
  }
  // Check one more time if server died
  if (serverProc && serverProc._exited) {
    const stderr = serverProc._stderrBuffer ? serverProc._stderrBuffer() : "";
    throw new Error(
      `Server process exited with code ${serverProc._exitCode}` +
        (stderr ? `\n${stderr}` : "")
    );
  }
  throw new Error(
    `Server did not become healthy in time. Last error: ${
      lastError?.message || "unknown"
    }`
  );
}

function detectChromePath() {
  const candidates =
    process.platform === "win32"
      ? [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files\\Chromium\\Application\\chrome.exe",
        ]
      : process.platform === "darwin"
      ? [
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Chromium.app/Contents/MacOS/Chromium",
        ]
      : [
          "/usr/bin/chromium",
          "/usr/bin/chromium-browser",
          "/usr/bin/google-chrome",
          "/usr/bin/google-chrome-stable",
        ];

  return candidates.find((p) => fs.existsSync(p));
}

function startNodeServer() {
  const entry = path.resolve(__dirname, "dist", "src", "index.js");
  if (!fs.existsSync(entry)) {
    throw new Error(
      `Cannot find ${entry}. Run 'npm run build' in the server folder first.`
    );
  }

  // Set PUPPETEER_EXECUTABLE_PATH if not already set
  const env = { ...process.env };
  if (!env.PUPPETEER_EXECUTABLE_PATH) {
    const detected = detectChromePath();
    if (!detected) {
      throw new Error(
        "Could not find Chrome/Chromium. Set PUPPETEER_EXECUTABLE_PATH manually."
      );
    }
    env.PUPPETEER_EXECUTABLE_PATH = detected;
    console.log(`Using Chrome/Chromium at: ${detected}`);
  } else {
    console.log(`Using Chrome/Chromium at: ${env.PUPPETEER_EXECUTABLE_PATH}`);
  }

  const child = spawn(process.execPath, [entry], {
    cwd: __dirname,
    stdio: ["ignore", "pipe", "pipe"],
    env,
  });

  // Buffer stderr for error reporting
  let stderrBuffer = "";
  child.stdout.on("data", (d) => process.stdout.write(d));
  child.stderr.on("data", (d) => {
    stderrBuffer += d.toString();
    process.stderr.write(d);
  });

  // Track early exit
  child._exited = false;
  child._exitCode = null;
  child._stderrBuffer = () => stderrBuffer;
  child.on("exit", (code) => {
    child._exited = true;
    child._exitCode = code;
  });

  return child;
}

function decodeDataUrlToFile(dataUrl, outPath) {
  const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  if (!match) {
    throw new Error("Response image is not a base64 data URL");
  }
  const base64 = match[2];
  const buf = Buffer.from(base64, "base64");
  fs.writeFileSync(outPath, buf);
}

async function main() {
  const { opts, body } = parseArgs(process.argv.slice(2));
  encodeKnownAssetFields(body);

  // Resolve route alias (single|batch|sequence) to API path
  if (opts.routeAlias === "batch") opts.mode = "batch";
  if (opts.routeAlias === "sequence") opts.mode = "sequence";
  if (opts.routeAlias === "single") opts.mode = "single";

  const baseUrl = (opts.server || "http://localhost:8080").replace(/\/$/, "");
  const targetPath = opts.mode || "single";

  let serverProc = null;
  try {
    const shouldStartLocal = !opts.server;
    if (shouldStartLocal) {
      serverProc = startNodeServer();
      await waitForHealth(baseUrl, 15_000, serverProc);
    }

    const url = `${baseUrl}/${targetPath}`;
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (fetchErr) {
      // Unwrap fetch error
      let cause = fetchErr.cause || fetchErr;
      // Handle AggregateError (multiple connection attempts failed)
      if (cause.errors && Array.isArray(cause.errors)) {
        cause = cause.errors[0] || cause;
      }
      const msg = cause.message || cause.code || String(cause);
      throw new Error(`Failed to connect to ${url}: ${msg}`);
    }

    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`Non-JSON response (${res.status}): ${text}`);
    }

    if (!res.ok) {
      const pretty = JSON.stringify(json, null, 2);
      throw new Error(`Request failed (${res.status}): ${pretty}`);
    }

    const hasOut = Boolean(opts.out);
    let savedPaths = [];

    if (hasOut) {
      savedPaths = writeImagesFromResponse(json, opts.out);
      const summary = {
        success: true,
        out: savedPaths.length === 1 ? savedPaths[0] : savedPaths,
      };
      if (json.metadata) summary.metadata = json.metadata;
      if (json.warnings?.length) summary.warnings = json.warnings;
      console.log(JSON.stringify(summary, null, 2));
      return;
    }

    // No out provided: avoid dumping base64 by default
    const summary = { success: true };
    if (json.metadata) summary.metadata = json.metadata;
    if (json.warnings?.length) summary.warnings = json.warnings;

    if (opts.printImage) {
      if (json.image) summary.image = json.image;
      if (json.images) summary.images = json.images;
    } else {
      if (json.image) summary.image = "<omitted - use --out or --print-image>";
      if (json.images)
        summary.images = `omitted (${json.images.length} items) - use --out or --print-image`;
    }

    console.log(JSON.stringify(summary, null, 2));
  } finally {
    if (serverProc) {
      serverProc.kill("SIGTERM");
      await sleep(250);
    }
  }
}

main().catch((err) => {
  console.error(err?.message || String(err));
  process.exit(1);
});
