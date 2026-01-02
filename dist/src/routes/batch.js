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
        (0, validation_1.validateBatchRender)(req.body);
        const data = req.body;
        const timeoutMs = config_1.LIMITS.TIMEOUT_BATCH_BASE_MS +
            config_1.LIMITS.TIMEOUT_BATCH_PER_FRAME_MS * Math.max(0, data.frames.length - 1);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        const updateFraming = data.updateFraming ?? true;
        try {
            let modelBuffer = null;
            let metadata = null;
            if (data.includeMetadata || data.model.startsWith("data:")) {
                const result = await (0, validation_1.fetchLimited)(data.model, {
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
            if (data.includeMetadata && modelBuffer) {
                metadata = await (0, metadataService_1.extractMetadata)(modelBuffer);
            }
            const renderOptions = data.frames.map((frame) => {
                let animationName = frame.animationName;
                let currentTime = frame.currentTime;
                const cameraOrbitX = (0, validation_1.validateCameraOrbitX)(frame.cameraOrbitX);
                const cameraOrbitY = (0, validation_1.validateCameraOrbitY)(frame.cameraOrbitY);
                const cameraDistance = (0, validation_1.validateCameraDistance)(frame.cameraDistance);
                const cameraOrbit = `${cameraOrbitX}deg ${cameraOrbitY}deg ${cameraDistance}%`;
                if (animationName && currentTime === null) {
                    currentTime = 0;
                }
                else if (currentTime !== null && !animationName) {
                    animationName = null;
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
                    shadowSoftness: frame.shadowSoftness !== undefined ? frame.shadowSoftness : 1,
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
            const renderResult = await (0, renderService_1.render)(data.model, renderOptions, modelBuffer || undefined, {
                signal: controller.signal,
                timeoutMs,
            });
            if (!renderResult.images ||
                renderResult.images.length !== data.frames.length) {
                throw new Error("Failed to render all requested frames");
            }
            const images = [];
            for (let i = 0; i < renderResult.images.length; i++) {
                const buffer = renderResult.images[i];
                const frame = data.frames[i];
                if (!buffer || !frame)
                    continue;
                const dataUrl = await (0, imageService_1.processImage)(buffer, frame.outputFormat || "webp", frame.quality || 70);
                images.push({
                    index: i,
                    image: dataUrl,
                });
            }
            const response = {
                success: true,
                images,
            };
            if (data.includeMetadata && metadata) {
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
//# sourceMappingURL=batch.js.map