import sharp from "sharp";
import { OutputFormat } from "../types/api";

/**
 * Processes an image buffer to the specified format and quality.
 * @param buffer The input image buffer (PNG format).
 * @param format The desired output format ('png', 'webp', 'avif').
 * @param quality The quality setting (1-100) for lossy formats.
 * @returns A promise that resolves to a base64 data URL of the processed image.
 */
export async function processImage(
  buffer: Buffer,
  format: OutputFormat,
  quality: number
): Promise<string> {
  let processedBuffer: Buffer;

  switch (format) {
    case "png":
      // no conversion needed
      processedBuffer = buffer;
      break;
    case "avif":
      processedBuffer = await sharp(buffer).avif({ quality }).toBuffer();
      break;
    case "webp":
    default:
      processedBuffer = await sharp(buffer).webp({ quality }).toBuffer();
      break;
  }

  // Return as data URL
  const mimeType = `image/${format}`;
  const base64 = processedBuffer.toString("base64");
  return `data:${mimeType};base64,${base64}`;
}
