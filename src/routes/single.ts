import { Router, Request, Response, NextFunction } from "express";
import { render } from "../services/renderService";
import { processImage } from "../services/imageService";
import { extractMetadata } from "../services/metadataService";
import {
  validateSingleRender,
  validateDimensions,
  validateShadowIntensity,
  validateShadowSoftness,
  validateSkyboxHeight,
  validateToneMapping,
  validateOutputFormat,
  validateQuality,
  validateAnimationName,
  validateCurrentTime,
  validateCameraOrbitX,
  validateCameraOrbitY,
  validateCameraDistance,
  fetchLimited,
  ValidationError,
} from "../utils/validation";
import { LIMITS } from "../config";
import {
  SingleRenderRequest,
  SingleRenderResponse,
  RenderOption,
} from "../types/api";

const router = Router();

router.post(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      validateSingleRender(req.body);

      const requestData = req.body as SingleRenderRequest;
      const { width, height } = validateDimensions(
        requestData.width,
        requestData.height
      );
      const timeoutMs = LIMITS.TIMEOUT_SINGLE_MS;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        let modelBuffer: Buffer | null = null;
        let metadata: any = null;

        // Fetch model here if metadata is requested or if model is a data URL
        if (
          requestData.includeMetadata ||
          requestData.model.startsWith("data:")
        ) {
          const result = await fetchLimited(requestData.model, {
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

        if (requestData.includeMetadata && modelBuffer) {
          metadata = await extractMetadata(modelBuffer);
        }

        // Handle animation parameters
        let animationName = validateAnimationName(requestData.animationName);
        let currentTime = validateCurrentTime(requestData.currentTime);

        const cameraOrbitX = validateCameraOrbitX(requestData.cameraOrbitX);
        const cameraOrbitY = validateCameraOrbitY(requestData.cameraOrbitY);
        const cameraDistance = validateCameraDistance(
          requestData.cameraDistance
        );
        const cameraOrbit = `${cameraOrbitX}deg ${cameraOrbitY}deg ${cameraDistance}%`;

        // Infer missing animation parameters
        if (animationName && currentTime === null) {
          currentTime = 0; // Start of the animation
        } else if (currentTime !== null && !animationName) {
          animationName = "auto"; // Use first available animation
        }

        // Convert API parameters to render options
        const renderOptions: RenderOption[] = [
          {
            width,
            height,
            roll: requestData.roll || 0,
            pitch: requestData.pitch || 0,
            yaw: requestData.yaw ?? 315,
            scaleX: requestData.scaleX || 1,
            scaleY: requestData.scaleY || 1,
            scaleZ: requestData.scaleZ || 1,
            exposure: requestData.exposure || 1.0,
            shadowIntensity: validateShadowIntensity(
              requestData.shadowIntensity
            ),
            shadowSoftness: validateShadowSoftness(requestData.shadowSoftness),
            ...(requestData.background && {
              background: requestData.background,
            }),
            ...(requestData.environment && {
              environment: requestData.environment,
            }),
            ...(requestData.skybox && {
              skybox: requestData.skybox,
            }),
            skyboxHeight: validateSkyboxHeight(requestData.skyboxHeight),
            toneMapping: validateToneMapping(requestData.toneMapping),
            ...(requestData.variantName && {
              variantName: requestData.variantName,
            }),
            animationName: animationName || null,
            currentTime: currentTime || null,
            cameraOrbit,
            updateFraming: false,
          },
        ];

        // Render the image
        const renderResult = await render(
          requestData.model,
          renderOptions,
          modelBuffer || undefined,
          { signal: controller.signal, timeoutMs }
        );

        if (!renderResult.images || renderResult.images.length === 0) {
          throw new Error("No image was rendered");
        }

        const firstImage = renderResult.images[0];
        if (!firstImage) {
          throw new Error("First image is undefined");
        }

        const dataUrl = await processImage(
          firstImage,
          validateOutputFormat(requestData.outputFormat),
          validateQuality(requestData.quality)
        );

        // Prepare response
        const response: SingleRenderResponse = {
          success: true,
          image: dataUrl,
        };

        // Include metadata if requested (already extracted above)
        if (requestData.includeMetadata && metadata) {
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
