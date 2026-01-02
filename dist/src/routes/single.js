"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const renderService_1 = require("../services/renderService");
const imageService_1 = require("../services/imageService");
const metadataService_1 = require("../services/metadataService");
const validation_1 = require("../utils/validation");
const config_1 = require("../config");
const router = (0, express_1.Router)();
router.post("/", async (req, res, next) => {
    try {
        (0, validation_1.validateSingleRender)(req.body);
        const requestData = req.body;
        const { width, height } = (0, validation_1.validateDimensions)(requestData.width, requestData.height);
        const timeoutMs = config_1.LIMITS.TIMEOUT_SINGLE_MS;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
            let modelBuffer = null;
            let metadata = null;
            if (requestData.includeMetadata ||
                requestData.model.startsWith("data:")) {
                const result = await (0, validation_1.fetchLimited)(requestData.model, {
                    maxBytes: config_1.LIMITS.MODEL_MAX_BYTES,
                    timeoutMs,
                    signal: controller.signal,
                    allowDataUrl: true,
                });
                if (!result) {
                    throw new validation_1.ValidationError("Model could not be fetched");
                }
                modelBuffer = result.buffer;
            }
            if (requestData.includeMetadata && modelBuffer) {
                metadata = await (0, metadataService_1.extractMetadata)(modelBuffer);
            }
            let animationName = (0, validation_1.validateAnimationName)(requestData.animationName);
            let currentTime = (0, validation_1.validateCurrentTime)(requestData.currentTime);
            const cameraOrbitX = (0, validation_1.validateCameraOrbitX)(requestData.cameraOrbitX);
            const cameraOrbitY = (0, validation_1.validateCameraOrbitY)(requestData.cameraOrbitY);
            const cameraDistance = (0, validation_1.validateCameraDistance)(requestData.cameraDistance);
            const cameraOrbit = `${cameraOrbitX}deg ${cameraOrbitY}deg ${cameraDistance}%`;
            if (animationName && currentTime === null) {
                currentTime = 0;
            }
            else if (currentTime !== null && !animationName) {
                animationName = "auto";
            }
            const renderOptions = [
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
                    shadowIntensity: (0, validation_1.validateShadowIntensity)(requestData.shadowIntensity),
                    shadowSoftness: (0, validation_1.validateShadowSoftness)(requestData.shadowSoftness),
                    ...(requestData.background && {
                        background: requestData.background,
                    }),
                    ...(requestData.environment && {
                        environment: requestData.environment,
                    }),
                    ...(requestData.skybox && {
                        skybox: requestData.skybox,
                    }),
                    skyboxHeight: (0, validation_1.validateSkyboxHeight)(requestData.skyboxHeight),
                    toneMapping: (0, validation_1.validateToneMapping)(requestData.toneMapping),
                    ...(requestData.variantName && {
                        variantName: requestData.variantName,
                    }),
                    animationName: animationName || null,
                    currentTime: currentTime || null,
                    cameraOrbit,
                    updateFraming: false,
                },
            ];
            const renderResult = await (0, renderService_1.render)(requestData.model, renderOptions, modelBuffer || undefined, { signal: controller.signal, timeoutMs });
            if (!renderResult.images || renderResult.images.length === 0) {
                throw new Error("No image was rendered");
            }
            const firstImage = renderResult.images[0];
            if (!firstImage) {
                throw new Error("First image is undefined");
            }
            const dataUrl = await (0, imageService_1.processImage)(firstImage, (0, validation_1.validateOutputFormat)(requestData.outputFormat), (0, validation_1.validateQuality)(requestData.quality));
            const response = {
                success: true,
                image: dataUrl,
            };
            if (requestData.includeMetadata && metadata) {
                response.metadata = metadata;
            }
            if (renderResult.warnings.length > 0) {
                response.warnings = renderResult.warnings;
            }
            res.json(response);
        }
        finally {
            clearTimeout(timeout);
            if (controller.signal.aborted) {
                throw new Error("Request timeout");
            }
        }
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=single.js.map