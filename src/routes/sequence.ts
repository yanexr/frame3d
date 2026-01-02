import { Router, Request, Response, NextFunction } from "express";
import { render } from "../services/renderService";
import { processImage } from "../services/imageService";
import { extractMetadata } from "../services/metadataService";
import {
  validateSequenceRender,
  fetchLimited,
  ValidationError,
} from "../utils/validation";
import { LIMITS } from "../config";
import {
  SequenceRenderRequest,
  SequenceRenderResponse,
  RenderOption,
} from "../types/api";

const router = Router();

router.post(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      validateSequenceRender(req.body);

      const data = req.body as SequenceRenderRequest;

      const animationName = data.animationName || null;
      const rotationAxis =
        (data.rotationAxis?.toLowerCase() as "x" | "y" | "z" | null) || null;
      const baseCameraOrbitX = data.cameraOrbitX ?? 0;
      const baseCameraOrbitY = data.cameraOrbitY ?? 75;
      const baseCameraDistance = data.cameraDistance ?? 105;
      const cameraOrbitSwingX = Math.max(
        0,
        Math.min(120, data.cameraOrbitSwingX ?? 0)
      );
      const cameraOrbitSwingY = Math.max(
        0,
        Math.min(120, data.cameraOrbitSwingY ?? 0)
      );
      const rotationOrbit =
        (data.rotationOrbit?.toLowerCase() as "x" | "y" | null) || null;
      const dimensions = {
        width: data.width || 1024,
        height: data.height || 1024,
      };
      const frameCount = data.frameCount ?? 8; // Default frameCount to 8

      let animStartTime = null;
      let animEndTime = null;
      let resolvedAnimationName: string | null = animationName;

      const timeoutMs =
        LIMITS.TIMEOUT_SEQUENCE_BASE_MS +
        LIMITS.TIMEOUT_SEQUENCE_PER_FRAME_MS * Math.max(0, frameCount - 1);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const updateFraming = data.updateFraming ?? false;

      try {
        // Fetch model and extract metadata if needed
        let modelBuffer: Buffer | null = null;
        let metadata: any = null;
        let modelUrl = data.model;
        const needsMetadata =
          data.includeMetadata ||
          animationName === "auto" ||
          (animationName &&
            (data.startTime === undefined || data.endTime === undefined));

        if (needsMetadata || data.model.startsWith("data:")) {
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

        if (needsMetadata && modelBuffer) {
          metadata = await extractMetadata(modelBuffer);
        }

        // If animationName is 'auto', use first animation if available
        if (animationName === "auto") {
          if (metadata?.animations?.length > 0) {
            resolvedAnimationName = metadata.animations[0].name;
          } else {
            resolvedAnimationName = null;
          }
        }
        // Only use animation if animationName is provided (not null)
        if (resolvedAnimationName) {
          // Infer start/end time if not provided
          if (data.startTime !== undefined && data.startTime !== null) {
            animStartTime = data.startTime;
          } else {
            animStartTime = 0;
          }
          if (data.endTime !== undefined && data.endTime !== null) {
            animEndTime = data.endTime;
          } else if (metadata) {
            // Find the specified animation and get its duration
            const animation = metadata.animations?.find(
              (anim: any) => anim.name === resolvedAnimationName
            );
            if (animation) {
              animEndTime = animation.duration;
            } else if (metadata.animations?.length > 0) {
              animEndTime = metadata.animations[0].duration;
            } else {
              animEndTime = 1.0;
            }
          } else {
            animEndTime = 1.0;
          }
        } else {
          // If no animation, ignore start/end time
          animStartTime = null;
          animEndTime = null;
        }

        // Generate rotation angles and/or animation times based on frame count
        const renderOptions: RenderOption[] = [];
        for (let i = 0; i < frameCount; i++) {
          // Calculate rotation based on rotationAxis, or no rotation if null
          let roll = data.roll || 0;
          let pitch = data.pitch || 0;
          let yaw = data.yaw || 0;
          if (rotationAxis) {
            const rotation = (i / frameCount) * 360;
            if (rotationAxis === "x") {
              pitch = (data.pitch || 0) + rotation;
            } else if (rotationAxis === "y") {
              yaw = (data.yaw || 0) + rotation;
            } else if (rotationAxis === "z") {
              roll = (data.roll || 0) + rotation;
            }
          }

          // Calculate currentTime for animation frame
          let currentTime: number | null = null;
          if (
            resolvedAnimationName &&
            animStartTime !== null &&
            animEndTime !== null
          ) {
            // Interpolate between start and end time
            const timeDelta = animEndTime - animStartTime;
            if (frameCount > 1) {
              currentTime = animStartTime + (i / (frameCount - 1)) * timeDelta;
            } else {
              currentTime = animStartTime;
            }
          } else if (resolvedAnimationName && animStartTime !== null) {
            currentTime = animStartTime;
          }

          // Calculate camera orbit with optional swing/rotation
          const progress = i / frameCount;
          const orbitRotation = rotationOrbit ? progress * 360 : 0;

          const thetaBase =
            baseCameraOrbitX + (rotationOrbit === "x" ? orbitRotation : 0);
          const phiBase =
            baseCameraOrbitY + (rotationOrbit === "y" ? orbitRotation : 0);

          const thetaSwing =
            cameraOrbitSwingX > 0
              ? -Math.sin(progress * 2 * Math.PI) * (cameraOrbitSwingX / 2)
              : 0;
          const phiSwing =
            cameraOrbitSwingY > 0
              ? -Math.sin(progress * 2 * Math.PI) * (cameraOrbitSwingY / 2)
              : 0;

          const theta = thetaBase + thetaSwing;
          const phi = phiBase + phiSwing;

          const cameraOrbit = `${theta}deg ${phi}deg ${baseCameraDistance}%`;

          renderOptions.push({
            width: dimensions.width,
            height: dimensions.height,
            roll,
            pitch,
            yaw,
            scaleX: data.scaleX || 1,
            scaleY: data.scaleY || 1,
            scaleZ: data.scaleZ || 1,
            exposure: data.exposure || 1.0,
            shadowIntensity: data.shadowIntensity || 0,
            shadowSoftness:
              data.shadowSoftness !== undefined ? data.shadowSoftness : 1,
            ...(data.background && {
              background: data.background,
            }),
            ...(data.environment && {
              environment: data.environment,
            }),
            ...(data.skybox && { skybox: data.skybox }),
            skyboxHeight: data.skyboxHeight || "0m",
            toneMapping: data.toneMapping || "neutral",
            ...(data.variantName && { variantName: data.variantName }),
            animationName: resolvedAnimationName || null,
            currentTime: currentTime,
            cameraOrbit: cameraOrbit,
            updateFraming,
          });
        }

        // Render all images
        const renderResult = await render(
          modelUrl,
          renderOptions,
          modelBuffer || undefined,
          {
            signal: controller.signal,
            timeoutMs,
          }
        );

        if (!renderResult.images || renderResult.images.length !== frameCount) {
          throw new Error("Failed to render all rotation frames");
        }

        // Process all images
        const images: Array<{ index: number; image: string }> = [];
        for (let i = 0; i < renderResult.images.length; i++) {
          const buffer = renderResult.images[i];
          if (!buffer) continue;

          const dataUrl = await processImage(
            buffer,
            data.outputFormat || "webp",
            data.quality || 70
          );

          images.push({
            index: i,
            image: dataUrl,
          });
        }

        // Prepare response
        const response: SequenceRenderResponse = {
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
