import { Router, Request, Response, NextFunction } from "express";
import { render } from "../services/renderService";
import { processImage } from "../services/imageService";
import { extractMetadata } from "../services/metadataService";
import {
  validateBatchRender,
  fetchLimited,
  ValidationError,
  validateCameraOrbitX,
  validateCameraOrbitY,
  validateCameraDistance,
} from "../utils/validation";
import { LIMITS } from "../config";
import {
  BatchRenderRequest,
  BatchRenderResponse,
  RenderOption,
} from "../types/api";

const router = Router();

router.post(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      validateBatchRender(req.body);

      const data = req.body as BatchRenderRequest;
      const timeoutMs =
        LIMITS.TIMEOUT_BATCH_BASE_MS +
        LIMITS.TIMEOUT_BATCH_PER_FRAME_MS * Math.max(0, data.frames.length - 1);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const updateFraming = data.updateFraming ?? true;

      try {
        let modelBuffer: Buffer | null = null;
        let metadata: any = null;

        // Fetch model here if metadata is requested or if model is a data URL
        if (data.includeMetadata || data.model.startsWith("data:")) {
          const result = await fetchLimited(data.model, {
            maxBytes: LIMITS.MODEL_MAX_BYTES,
            timeoutMs,
            signal: controller.signal,
            allowDataUrl: true,
          });
          if (!result) {
            throw new ValidationError("Model could not be fetched");
          }
          modelBuffer = result.buffer;
        }

        if (data.includeMetadata && modelBuffer) {
          metadata = await extractMetadata(modelBuffer);
        }

        // Prepare render options for each frame
        const renderOptions: RenderOption[] = data.frames.map((frame) => {
          let animationName = frame.animationName;
          let currentTime = frame.currentTime;

          const cameraOrbitX = validateCameraOrbitX(frame.cameraOrbitX);
          const cameraOrbitY = validateCameraOrbitY(frame.cameraOrbitY);
          const cameraDistance = validateCameraDistance(frame.cameraDistance);
          const cameraOrbit = `${cameraOrbitX}deg ${cameraOrbitY}deg ${cameraDistance}%`;

          // Infer missing animation parameters
          if (animationName && currentTime === null) {
            currentTime = 0; // Start of the animation
          } else if (currentTime !== null && !animationName) {
            animationName = null; // Will use first animation in model-viewer
          }

          return {
            width: frame.width || 1024,
            height: frame.height || 1024,
            roll: frame.roll || 0,
            pitch: frame.pitch || 0,
            yaw: frame.yaw || 0,
            scaleX: frame.scaleX || 1,
            scaleY: frame.scaleY || 1,
            scaleZ: frame.scaleZ || 1,
            exposure: frame.exposure || 1.0,
            shadowIntensity: frame.shadowIntensity || 0,
            shadowSoftness:
              frame.shadowSoftness !== undefined ? frame.shadowSoftness : 1,
            ...(frame.background && {
              background: frame.background,
            }),
            ...(frame.environment && {
              environment: frame.environment,
            }),
            ...(frame.skybox && { skybox: frame.skybox }),
            skyboxHeight: frame.skyboxHeight || "0m",
            toneMapping: frame.toneMapping || "neutral",
            ...(frame.variantName && { variantName: frame.variantName }),
            animationName: animationName || null,
            currentTime: currentTime || null,
            cameraOrbit,
            updateFraming,
          };
        });

        // Render all images
        const renderResult = await render(
          data.model,
          renderOptions,
          modelBuffer || undefined,
          {
            signal: controller.signal,
            timeoutMs,
          }
        );

        if (
          !renderResult.images ||
          renderResult.images.length !== data.frames.length
        ) {
          throw new Error("Failed to render all requested frames");
        }

        // Process all images with individual settings
        const images: Array<{ index: number; image: string }> = [];
        for (let i = 0; i < renderResult.images.length; i++) {
          const buffer = renderResult.images[i];
          const frame = data.frames[i];
          if (!buffer || !frame) continue;

          const dataUrl = await processImage(
            buffer,
            frame.outputFormat || "webp",
            frame.quality || 70
          );

          images.push({
            index: i,
            image: dataUrl,
          });
        }

        // Prepare response
        const response: BatchRenderResponse = {
          success: true,
          images,
        };

        // Include metadata if requested (already extracted above)
        if (data.includeMetadata && metadata) {
          response.metadata = metadata;
        }

        // Include warnings if any occurred
        if (renderResult.warnings.length > 0) {
          response.warnings = renderResult.warnings;
        }

        res.json(response);
      } finally {
        clearTimeout(timeout);
        if (controller.signal.aborted) {
          throw new Error("Request timeout");
        }
      }
    } catch (error) {
      next(error);
    }
  }
);

export default router;
