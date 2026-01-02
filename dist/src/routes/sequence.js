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
        (0, validation_1.validateSequenceRender)(req.body);
        const data = req.body;
        const animationName = data.animationName || null;
        const rotationAxis = data.rotationAxis?.toLowerCase() || null;
        const baseCameraOrbitX = data.cameraOrbitX ?? 0;
        const baseCameraOrbitY = data.cameraOrbitY ?? 75;
        const baseCameraDistance = data.cameraDistance ?? 105;
        const cameraOrbitSwingX = Math.max(0, Math.min(120, data.cameraOrbitSwingX ?? 0));
        const cameraOrbitSwingY = Math.max(0, Math.min(120, data.cameraOrbitSwingY ?? 0));
        const rotationOrbit = data.rotationOrbit?.toLowerCase() || null;
        const dimensions = {
            width: data.width || 1024,
            height: data.height || 1024,
        };
        const frameCount = data.frameCount ?? 8;
        let animStartTime = null;
        let animEndTime = null;
        let resolvedAnimationName = animationName;
        const timeoutMs = config_1.LIMITS.TIMEOUT_SEQUENCE_BASE_MS +
            config_1.LIMITS.TIMEOUT_SEQUENCE_PER_FRAME_MS * Math.max(0, frameCount - 1);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        const updateFraming = data.updateFraming ?? false;
        try {
            let modelBuffer = null;
            let metadata = null;
            let modelUrl = data.model;
            const needsMetadata = data.includeMetadata ||
                animationName === "auto" ||
                (animationName &&
                    (data.startTime === undefined || data.endTime === undefined));
            if (needsMetadata || data.model.startsWith("data:")) {
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
            if (needsMetadata && modelBuffer) {
                metadata = await (0, metadataService_1.extractMetadata)(modelBuffer);
            }
            if (animationName === "auto") {
                if (metadata?.animations?.length > 0) {
                    resolvedAnimationName = metadata.animations[0].name;
                }
                else {
                    resolvedAnimationName = null;
                }
            }
            if (resolvedAnimationName) {
                if (data.startTime !== undefined && data.startTime !== null) {
                    animStartTime = data.startTime;
                }
                else {
                    animStartTime = 0;
                }
                if (data.endTime !== undefined && data.endTime !== null) {
                    animEndTime = data.endTime;
                }
                else if (metadata) {
                    const animation = metadata.animations?.find((anim) => anim.name === resolvedAnimationName);
                    if (animation) {
                        animEndTime = animation.duration;
                    }
                    else if (metadata.animations?.length > 0) {
                        animEndTime = metadata.animations[0].duration;
                    }
                    else {
                        animEndTime = 1.0;
                    }
                }
                else {
                    animEndTime = 1.0;
                }
            }
            else {
                animStartTime = null;
                animEndTime = null;
            }
            const renderOptions = [];
            for (let i = 0; i < frameCount; i++) {
                let roll = data.roll || 0;
                let pitch = data.pitch || 0;
                let yaw = data.yaw || 0;
                if (rotationAxis) {
                    const rotation = (i / frameCount) * 360;
                    if (rotationAxis === "x") {
                        pitch = (data.pitch || 0) + rotation;
                    }
                    else if (rotationAxis === "y") {
                        yaw = (data.yaw || 0) + rotation;
                    }
                    else if (rotationAxis === "z") {
                        roll = (data.roll || 0) + rotation;
                    }
                }
                let currentTime = null;
                if (resolvedAnimationName &&
                    animStartTime !== null &&
                    animEndTime !== null) {
                    const timeDelta = animEndTime - animStartTime;
                    if (frameCount > 1) {
                        currentTime = animStartTime + (i / (frameCount - 1)) * timeDelta;
                    }
                    else {
                        currentTime = animStartTime;
                    }
                }
                else if (resolvedAnimationName && animStartTime !== null) {
                    currentTime = animStartTime;
                }
                const progress = i / frameCount;
                const orbitRotation = rotationOrbit ? progress * 360 : 0;
                const thetaBase = baseCameraOrbitX + (rotationOrbit === "x" ? orbitRotation : 0);
                const phiBase = baseCameraOrbitY + (rotationOrbit === "y" ? orbitRotation : 0);
                const thetaSwing = cameraOrbitSwingX > 0
                    ? -Math.sin(progress * 2 * Math.PI) * (cameraOrbitSwingX / 2)
                    : 0;
                const phiSwing = cameraOrbitSwingY > 0
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
                    shadowSoftness: data.shadowSoftness !== undefined ? data.shadowSoftness : 1,
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
            const renderResult = await (0, renderService_1.render)(modelUrl, renderOptions, modelBuffer || undefined, {
                signal: controller.signal,
                timeoutMs,
            });
            if (!renderResult.images || renderResult.images.length !== frameCount) {
                throw new Error("Failed to render all rotation frames");
            }
            const images = [];
            for (let i = 0; i < renderResult.images.length; i++) {
                const buffer = renderResult.images[i];
                if (!buffer)
                    continue;
                const dataUrl = await (0, imageService_1.processImage)(buffer, data.outputFormat || "webp", data.quality || 70);
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
//# sourceMappingURL=sequence.js.map