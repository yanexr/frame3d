import puppeteer, { Browser, Page } from "puppeteer-core";
import { RenderOption } from "../types/api";
import fs from "fs";
import { fetchLimited } from "../utils/validation";
import { LIMITS } from "../config";

const modelViewerScript = fs.readFileSync(
  require.resolve("@google/model-viewer/dist/model-viewer.min.js"),
  "utf-8"
);

// Shared browser instance used across all requests.
let browser: Browser | null = null;

/**
 * Initializes and returns a shared Puppeteer browser instance.
 * It launches a new browser if one isn't running or has disconnected.
 */
async function getBrowser(): Promise<Browser> {
  if (browser && browser.connected) {
    return browser;
  }

  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (!executablePath) {
    throw new Error(
      "PUPPETEER_EXECUTABLE_PATH is not set. Set it to your Chrome/Chromium executable path (Dockerfile already sets it in container builds)."
    );
  }

  browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--disable-features=TranslateUI",
      "--disable-ipc-flooding-protection",
      "--font-render-hinting=none",
      "--disable-web-security",
      "--disable-extensions",
      "--disable-plugins",
      "--disable-images",
    ],
  });

  browser.on("disconnected", () => {
    browser = null;
  });

  return browser;
}

/**
 * Generates a minimal HTML document containing the <model-viewer> component.
 * @param modelUrl The URL of the 3D model to be displayed.
 * @returns The complete HTML document as a string.
 */
function generateModelViewerHtml(
  modelUrl: string,
  width: number,
  height: number
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <script type="module">${modelViewerScript}</script>
        <style>
          body { margin: 0; background: transparent; }
          model-viewer {
            width: ${width}px;
            height: ${height}px;
            --poster-color: transparent;
            --progress-bar-color: transparent;
          }
          model-viewer::part(default-progress-bar) {
            background-color: transparent;
          }
        </style>
      </head>
      <body>
        <model-viewer
          id="viewer"
          src="${modelUrl}"
          disable-zoom
          shadow-intensity="1"
          tone-mapping="neutral"
        >
        </model-viewer>
      </body>
    </html>`;
}

export interface RenderResult {
  images: Buffer[];
  warnings: string[];
}

/**
 * Renders one or multiple images of a 3D model using specified render options.
 *
 * @param modelUrl URL of the 3D model to render.
 * @param renderOptions Array of render options for each desired image.
 * @param modelBuffer Optional ArrayBuffer or Buffer of the model data to use instead of fetching from URL.
 * @param options Optional settings including abort signal and timeout.
 * @returns Rendered images and any warnings encountered.
 */
export async function render(
  modelUrl: string,
  renderOptions: RenderOption[],
  modelBuffer?: ArrayBuffer | Buffer,
  options?: {
    signal?: AbortSignal;
    timeoutMs?: number;
  }
): Promise<RenderResult> {
  const browserInstance = await getBrowser();
  const page: Page = await browserInstance.newPage();
  const images: Buffer[] = [];
  const warnings: string[] = [];
  const localModelUrl = "https://local.model/model.glb";
  const localEnvUrl = "https://local.asset/environment.hdr";
  const localSkyboxUrl = "https://local.asset/skybox.hdr";
  let envBuffer: Buffer | null = null;
  let skyboxBuffer: Buffer | null = null;
  let requestHandler: ((req: any) => Promise<void>) | null = null;
  let pageClosed = false;
  let onAbort: (() => void) | null = null;
  const closePage = async () => {
    if (pageClosed) return;
    pageClosed = true;
    try {
      await page.close();
    } catch {
      // ignore
    }
  };
  const signal = options?.signal;
  const timeoutMs = options?.timeoutMs ?? LIMITS.TIMEOUT_SINGLE_MS;

  try {
    page.setDefaultTimeout(timeoutMs);
    onAbort = () => {
      closePage().catch(() => undefined);
    };
    if (signal) {
      if (signal.aborted) throw new Error("Request timeout");
      signal.addEventListener("abort", onAbort);
    }

    // Fetch or use provided model buffer
    let modelSrc = modelUrl;
    let resolvedBuffer: Buffer | null = null;

    if (modelBuffer) {
      resolvedBuffer = Buffer.isBuffer(modelBuffer)
        ? modelBuffer
        : Buffer.from(modelBuffer);
    } else if (modelUrl.startsWith("data:")) {
      const base64Data = modelUrl.split(",")[1];
      if (base64Data) {
        resolvedBuffer = Buffer.from(base64Data, "base64");
      }
    }

    if (!resolvedBuffer) {
      const result = await fetchLimited(modelUrl, {
        maxBytes: LIMITS.MODEL_MAX_BYTES,
        timeoutMs,
        allowDataUrl: true,
        ...(signal ? { signal } : {}),
      });
      if (!result) {
        throw new Error("Failed to fetch model");
      }
      resolvedBuffer = result.buffer;
    }

    if (resolvedBuffer) {
      await page.setRequestInterception(true);
      requestHandler = async (req: any) => {
        const url = req.url();
        if (url === localModelUrl) {
          await req.respond({
            status: 200,
            contentType: "model/gltf-binary",
            body: resolvedBuffer,
          });
        } else if (url === localEnvUrl && envBuffer) {
          await req.respond({
            status: 200,
            contentType: "application/octet-stream",
            body: envBuffer,
          });
        } else if (url === localSkyboxUrl && skyboxBuffer) {
          await req.respond({
            status: 200,
            contentType: "application/octet-stream",
            body: skyboxBuffer,
          });
        } else {
          await req.continue();
        }
      };
      page.on("request", requestHandler);
      modelSrc = localModelUrl;
    }

    /**
     * Resolves environment or skybox asset URL.
     */
    const resolveAssetUrl = async (
      value: string | undefined | null,
      assetType: "environment" | "skybox"
    ): Promise<string | undefined> => {
      if (!value) return undefined;

      // Special keywords for environment
      if (value === "neutral" || value === "legacy") {
        return value;
      }

      // Regular URLs are passed through directly
      if (value.startsWith("http://") || value.startsWith("https://")) {
        return value;
      }

      // Data URLs - check if HDR (needs interception)
      if (value.startsWith("data:")) {
        const isHdr =
          value.startsWith("data:image/vnd.radiance") ||
          value.startsWith("data:application/octet-stream");

        if (isHdr) {
          // Decode and use interception URL so model-viewer detects .hdr extension
          const commaIndex = value.indexOf(",");
          if (commaIndex !== -1) {
            const buffer = Buffer.from(value.slice(commaIndex + 1), "base64");
            if (assetType === "environment") {
              envBuffer = buffer;
              return localEnvUrl;
            } else {
              skyboxBuffer = buffer;
              return localSkyboxUrl;
            }
          }
        }

        // Non-HDR data URLs (png, jpg, etc.) can be passed directly
        return value;
      }

      // CSS color or gradient - convert to canvas PNG for model-viewer
      const canvasDataUrl = await page.evaluate((cssColor) => {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext("2d")!;

        if (cssColor.includes("linear-gradient")) {
          const gradient = ctx.createLinearGradient(0, 0, 512, 0);
          const colors = cssColor.match(/#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}/g);
          if (colors && colors.length >= 2) {
            gradient.addColorStop(0, colors[0]!);
            gradient.addColorStop(1, colors[colors.length - 1]!);
          } else {
            gradient.addColorStop(0, "#ffffff");
            gradient.addColorStop(1, "#000000");
          }
          ctx.fillStyle = gradient;
        } else if (cssColor.includes("radial-gradient")) {
          const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
          const colors = cssColor.match(/#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}/g);
          if (colors && colors.length >= 2) {
            gradient.addColorStop(0, colors[0]!);
            gradient.addColorStop(1, colors[colors.length - 1]!);
          } else {
            gradient.addColorStop(0, "#ffffff");
            gradient.addColorStop(1, "#000000");
          }
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = cssColor;
        }

        ctx.fillRect(0, 0, 512, 512);
        return canvas.toDataURL("image/png");
      }, value);

      return canvasDataUrl;
    };

    /**
     * Resolves background value to CSS properties.
     * URLs are passed through directly, CSS colors/gradients are used as-is.
     */
    const resolveBackground = (value?: string | null) => {
      if (!value) {
        return { backgroundImage: "none", backgroundColor: "transparent" };
      }

      const isUrlLike =
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("data:");
      const isGradient = value.toLowerCase().includes("gradient(");

      if (isUrlLike) {
        return {
          backgroundImage: `url(${value})`,
          backgroundColor: "transparent",
        };
      }

      if (isGradient) {
        return { backgroundImage: value, backgroundColor: "transparent" };
      }

      return { backgroundImage: "none", backgroundColor: value };
    };

    // set viewport to the maximum size needed for any render option. The model-viewer element is sized independently.
    const maxWidth = Math.max(...renderOptions.map((opt) => opt.width || 1024));
    const maxHeight = Math.max(
      ...renderOptions.map((opt) => opt.height || 1024)
    );
    await page.setViewport({ width: maxWidth, height: maxHeight });

    // Generate HTML with chosen model source and and size
    const htmlContent = generateModelViewerHtml(modelSrc, maxWidth, maxHeight);
    await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });

    // Wait for the model to load
    await page.waitForFunction(
      () => (document.getElementById("viewer") as any)?.modelIsVisible,
      { timeout: timeoutMs }
    );

    // Render each image based on provided options on the same page
    for (const options of renderOptions) {
      // Reset HDR buffers for each frame
      envBuffer = null;
      skyboxBuffer = null;

      const resolvedEnvironment = await resolveAssetUrl(
        options.environment,
        "environment"
      );
      const resolvedSkybox = await resolveAssetUrl(options.skybox, "skybox");
      const backgroundStyle = resolveBackground(options.background);

      await page.evaluate(
        async (opt, envImage, skyImage, bg) => {
          const mv = document.getElementById("viewer") as any;
          if (!mv) return;

          // Resize the viewer for this specific shot
          const width = opt.width || 1024;
          const height = opt.height || 1024;
          mv.style.width = `${width}px`;
          mv.style.height = `${height}px`;

          // Reset/set other properties
          const r = opt.roll || 0;
          const p = opt.pitch || 0;
          const y = opt.yaw || 0;
          mv.orientation = `${r}deg ${p}deg ${y}deg`;

          mv.exposure = opt.exposure !== undefined ? opt.exposure : 1.0;
          mv.shadowIntensity =
            opt.shadowIntensity !== undefined ? opt.shadowIntensity : 0;
          mv.shadowSoftness =
            opt.shadowSoftness !== undefined ? opt.shadowSoftness : 1;
          mv.style.backgroundImage = bg.backgroundImage;
          mv.style.backgroundColor = bg.backgroundColor;
          mv.environmentImage = envImage || null;
          mv.skyboxImage = skyImage || null;
          mv.skyboxHeight = opt.skyboxHeight || "0m";
          mv.toneMapping = opt.toneMapping || "neutral";
          mv.variantName = opt.variantName || null;

          // Handle animation settings
          if (opt.animationName !== undefined && opt.animationName !== null) {
            mv.animationName = opt.animationName;
          }

          // Pause animation as its controlled manually
          mv.pause();

          if (opt.currentTime !== undefined && opt.currentTime !== null) {
            mv.currentTime = opt.currentTime;
          }

          if (opt.updateFraming) {
            mv.updateFraming();
            await mv.updateComplete;
          }

          const scaleX = opt.scaleX || 1;
          const scaleY = opt.scaleY || 1;
          const scaleZ = opt.scaleZ || 1;
          mv.scale = `${scaleX} ${scaleY} ${scaleZ}`;

          if (opt.cameraOrbit !== undefined && opt.cameraOrbit !== null) {
            mv.cameraOrbit = opt.cameraOrbit;
          }

          mv.jumpCameraToGoal();
          await mv.updateComplete;
        },
        options,
        resolvedEnvironment,
        resolvedSkybox,
        backgroundStyle
      );

      const element = await page.$("#viewer");
      if (!element) {
        throw new Error("Could not find model-viewer element to screenshot");
      }

      const imageBuffer = await element.screenshot({
        type: "png",
        omitBackground: true, // Transparent background
      });
      images.push(imageBuffer as Buffer);
    }
  } finally {
    if (requestHandler) {
      page.off("request", requestHandler);
      await page.setRequestInterception(false);
    }
    await closePage();
    if (signal && onAbort) {
      signal.removeEventListener("abort", onAbort);
    }
  }

  if (signal?.aborted) {
    throw new Error("Request timeout");
  }

  return { images, warnings };
}

/**
 * Closes the shared Puppeteer browser instance.
 * This should be called during application shutdown or after tests complete.
 */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
