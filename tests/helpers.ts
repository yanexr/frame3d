import app from "../src/app";
import * as fs from "fs";
import * as path from "path";
import { closeBrowser } from "../src/services/renderService";

export const TEST_URL = "http://localhost:3001";
export const TEST_PORT = 3001;
export const TEST_OUTPUT_DIR = path.join(__dirname, "output");

export const ANIMATED_MORPH_CUBE =
  "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/AnimatedMorphCube/glTF-Binary/AnimatedMorphCube.glb"; // AnimationName: 'Square'

export const FOX =
  "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Fox/glTF-Binary/Fox.glb"; // Animated rigging with three different animation cycles: Survey, Walk, and Run

export const DRAGON_ATTENUATION =
  "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/DragonAttenuation/glTF-Binary/DragonAttenuation.glb";

export const MATERIALS_VARIANTS_SHOE =
  "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb"; // 3 color variants: "Beach", "Midnight", and "Street"

export const IRIDESCENT_DISH_WITH_OLIVES =
  "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/IridescentDishWithOlives/glTF-Binary/IridescentDishWithOlives.glb"; // Has an animation to move the glass cover

export const GLAM_VELVET_SOFA =
  "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/GlamVelvetSofa/glTF-Binary/GlamVelvetSofa.glb"; // Material variants: "Black", "Champagne", "Gray", "Navy", "Pale Pink"

export const HDRI =
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/brown_photostudio_01_2k.hdr";

export async function startTestServer() {
  if ((global as any).server) {
    return;
  }
  const server = app.listen(TEST_PORT);
  (global as any).server = server;

  await new Promise<void>((resolve) => {
    server.on("listening", () => {
      console.log(`Test server started on port ${TEST_PORT}`);
      resolve();
    });
  });
}

export async function stopTestServer() {
  if ((global as any).server) {
    const server = (global as any).server;

    await new Promise<void>((resolve, reject) => {
      server.close((err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
    (global as any).server = undefined;
  }
  await closeBrowser();
}

export async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  // Determine MIME type based on file extension
  const extension = url.split(".").pop()?.toLowerCase();
  let mimeType: string;

  switch (extension) {
    case "glb":
      mimeType = "model/gltf-binary";
      break;
    case "png":
      mimeType = "image/png";
      break;
    case "jpg":
    case "jpeg":
      mimeType = "image/jpeg";
      break;
    case "hdr":
      mimeType = "image/vnd.radiance";
      break;
    default:
      mimeType = "application/octet-stream";
  }

  return `data:${mimeType};base64,${base64}`;
}

export function saveTestImage(filename: string, base64Data: string) {
  const fullPath = path.join(TEST_OUTPUT_DIR, filename);
  const outputDir = path.dirname(fullPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const base64Content = base64Data.split(",")[1];
  if (!base64Content) {
    throw new Error("Invalid base64 data format");
  }
  const buffer = Buffer.from(base64Content, "base64");
  fs.writeFileSync(fullPath, buffer);
}

export async function makeRequest(endpoint: string, body: any): Promise<any> {
  const url = `${TEST_URL}${endpoint}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!data.success && data.error) {
    console.error(
      `[${endpoint}] Error:`,
      data.error.message,
      data.error.details || ""
    );
  }
  if (data.warnings?.length > 0) {
    console.warn(`[${endpoint}] Warnings:`, data.warnings);
  }
  return { status: response.status, data };
}

export async function makeGetRequest(endpoint: string): Promise<any> {
  const url = `${TEST_URL}${endpoint}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const data = await response.json();
  if (!data.success && data.error) {
    console.error(
      `[${endpoint}] Error:`,
      data.error.message,
      data.error.details || ""
    );
  }
  return { status: response.status, data };
}
