"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.LimitExceededError = void 0;
exports.validateModel = validateModel;
exports.validateOptionalAssetUrl = validateOptionalAssetUrl;
exports.validateOptionalBackground = validateOptionalBackground;
exports.validateDimensions = validateDimensions;
exports.validateOrientation = validateOrientation;
exports.validateScaleComponents = validateScaleComponents;
exports.validateSkyboxHeight = validateSkyboxHeight;
exports.validateShadowSoftness = validateShadowSoftness;
exports.validateFrameCount = validateFrameCount;
exports.validateFrames = validateFrames;
exports.validateQuality = validateQuality;
exports.validateOutputFormat = validateOutputFormat;
exports.validateToneMapping = validateToneMapping;
exports.validateShadowIntensity = validateShadowIntensity;
exports.validateAnimationName = validateAnimationName;
exports.validateCurrentTime = validateCurrentTime;
exports.validateUpdateFraming = validateUpdateFraming;
exports.validateTimeRange = validateTimeRange;
exports.validateCameraOrbitX = validateCameraOrbitX;
exports.validateCameraOrbitY = validateCameraOrbitY;
exports.validateCameraDistance = validateCameraDistance;
exports.validateCameraOrbitSwingX = validateCameraOrbitSwingX;
exports.validateCameraOrbitSwingY = validateCameraOrbitSwingY;
exports.validateRotationAxis = validateRotationAxis;
exports.validateCameraOrbitRotation = validateCameraOrbitRotation;
exports.fetchLimited = fetchLimited;
exports.validateSingleRender = validateSingleRender;
exports.validateBatchRender = validateBatchRender;
exports.validateSequenceRender = validateSequenceRender;
const dns_1 = __importDefault(require("dns"));
const net_1 = __importDefault(require("net"));
const config_1 = require("../config");
class LimitExceededError extends Error {
    constructor(message) {
        super(message);
        this.name = "LimitExceededError";
    }
}
exports.LimitExceededError = LimitExceededError;
const isUrl = (str) => {
    if (typeof str !== "string")
        return false;
    return (str.startsWith("https://") ||
        (config_1.NETWORK.ALLOW_HTTP && str.startsWith("http://")));
};
const isBase64Model = (str) => str.startsWith("data:model/gltf-binary;base64,");
const isInRange = (val, min, max) => val >= min && val <= max;
function validateModel(model) {
    if (typeof model !== "string")
        throw new ValidationError("Model must be a string");
    if (!isUrl(model) && !isBase64Model(model)) {
        throw new ValidationError("Model must be an http/https URL or base64 data URL");
    }
    return model;
}
function validateOptionalAssetUrl(value, field) {
    if (value === undefined || value === null)
        return null;
    if (typeof value !== "string") {
        throw new ValidationError(`${field} must be a string`);
    }
    if (value.startsWith("data:"))
        return value;
    if (value.startsWith("https://") ||
        (config_1.NETWORK.ALLOW_HTTP && value.startsWith("http://"))) {
        return value;
    }
    if (value === "neutral" || value === "legacy") {
        return value;
    }
    if (isValidCssColorOrGradient(value)) {
        return value;
    }
    throw new ValidationError(`${field} must be an http/https URL, data URL, or valid CSS color/gradient`);
}
function validateOptionalBackground(value) {
    if (value === undefined || value === null)
        return null;
    if (typeof value !== "string") {
        throw new ValidationError("Background must be a string");
    }
    if (value.startsWith("data:"))
        return value;
    if (value.startsWith("https://") ||
        (config_1.NETWORK.ALLOW_HTTP && value.startsWith("http://"))) {
        return value;
    }
    if (isValidCssColorOrGradient(value)) {
        return value;
    }
    throw new ValidationError("Background image must be an http/https URL, data URL, or valid CSS color/gradient");
}
function isValidCssColorOrGradient(value) {
    const hexColor = /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
    const rgbColor = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+))?\s*\)$/;
    const hslColor = /^hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*(,\s*(0|1|0?\.\d+))?\s*\)$/;
    const namedColors = /^[a-zA-Z]{3,20}$/;
    if (hexColor.test(value) ||
        rgbColor.test(value) ||
        hslColor.test(value) ||
        namedColors.test(value)) {
        return true;
    }
    const gradientPattern = /^(linear-gradient|radial-gradient)\s*\(/i;
    if (!gradientPattern.test(value)) {
        return false;
    }
    const gradientContent = value.slice(value.indexOf("(") + 1, value.lastIndexOf(")"));
    const safeGradientContent = /^[a-zA-Z0-9\s,()%#.\-]+$/;
    if (!safeGradientContent.test(gradientContent)) {
        return false;
    }
    const dangerousPatterns = /(javascript|script|expression|url|eval|function)/i;
    if (dangerousPatterns.test(value)) {
        return false;
    }
    return true;
}
function validateDimensions(width, height) {
    const w = width ?? 1024;
    const h = height ?? 1024;
    if (typeof w !== "number" || !isInRange(w, 64, 2048)) {
        throw new ValidationError("Width must be between 64 and 2048");
    }
    if (typeof h !== "number" || !isInRange(h, 64, 2048)) {
        throw new ValidationError("Height must be between 64 and 2048");
    }
    return { width: w, height: h };
}
function validateOrientation(x, y, z) {
    const orientation = { roll: 0, pitch: 0, yaw: 0 };
    if (x !== undefined) {
        if (typeof x !== "number")
            throw new ValidationError("roll must be a number");
        orientation.roll = x;
    }
    if (y !== undefined) {
        if (typeof y !== "number")
            throw new ValidationError("pitch must be a number");
        orientation.pitch = y;
    }
    if (z !== undefined) {
        if (typeof z !== "number")
            throw new ValidationError("yaw must be a number");
        orientation.yaw = z;
    }
    return orientation;
}
function validateScaleComponents(x, y, z) {
    const scale = { scaleX: 1, scaleY: 1, scaleZ: 1 };
    if (x !== undefined) {
        if (typeof x !== "number" || x <= 0)
            throw new ValidationError("ScaleX must be a positive number");
        scale.scaleX = x;
    }
    if (y !== undefined) {
        if (typeof y !== "number" || y <= 0)
            throw new ValidationError("ScaleY must be a positive number");
        scale.scaleY = y;
    }
    if (z !== undefined) {
        if (typeof z !== "number" || z <= 0)
            throw new ValidationError("ScaleZ must be a positive number");
        scale.scaleZ = z;
    }
    return scale;
}
function validateSkyboxHeight(height) {
    if (height === undefined)
        return "0m";
    if (typeof height === "number") {
        return `${height}m`;
    }
    if (typeof height === "string") {
        const validUnits = /^[0-9]+(?:\.[0-9]+)?(m|cm|mm)$/;
        const isNumber = /^[0-9]+(?:\.[0-9]+)?$/;
        if (validUnits.test(height) || isNumber.test(height)) {
            return isNumber.test(height) ? `${height}m` : height;
        }
        throw new ValidationError("SkyboxHeight must be a number or string with units (m, cm, mm)");
    }
    throw new ValidationError("SkyboxHeight must be a number or string");
}
function validateShadowSoftness(softness) {
    const val = softness ?? 1;
    if (typeof val !== "number") {
        throw new ValidationError("Shadow softness must be a number");
    }
    return Math.max(0, Math.min(1, val));
}
function validateFrameCount(frameCount) {
    const count = frameCount ?? 8;
    if (typeof count !== "number" ||
        !Number.isInteger(count) ||
        !isInRange(count, 1, config_1.LIMITS.MAX_FRAMES_PER_REQUEST)) {
        throw new ValidationError(`Frame count must be an integer between 1 and ${config_1.LIMITS.MAX_FRAMES_PER_REQUEST}`);
    }
    return count;
}
function validateFrames(frames) {
    if (!Array.isArray(frames) || frames.length === 0 || frames.length > config_1.LIMITS.MAX_FRAMES_PER_REQUEST) {
        throw new ValidationError(`Frames must be an array with 1-${config_1.LIMITS.MAX_FRAMES_PER_REQUEST} items`);
    }
    return frames;
}
function validateQuality(quality) {
    const q = quality ?? 70;
    if (typeof q !== "number" || !isInRange(q, 1, 100)) {
        throw new ValidationError("Quality must be between 1 and 100");
    }
    return q;
}
function validateOutputFormat(format) {
    const f = format ?? "webp";
    if (!["webp", "png", "avif"].includes(f)) {
        throw new ValidationError("Output format must be webp, png, or avif");
    }
    return f;
}
function validateToneMapping(toneMapping) {
    const tm = toneMapping ?? "neutral";
    if (!["neutral", "aces", "agx"].includes(tm)) {
        throw new ValidationError("Tone mapping must be neutral, aces, or agx");
    }
    return tm;
}
function validateShadowIntensity(intensity) {
    const val = intensity ?? 0;
    if (typeof val !== "number" || !isInRange(val, 0, 1)) {
        throw new ValidationError("Shadow intensity must be between 0 and 1");
    }
    return val;
}
function validateAnimationName(animationName) {
    if (animationName === undefined || animationName === null)
        return null;
    if (typeof animationName !== "string") {
        throw new ValidationError("Animation name must be a string");
    }
    if (animationName !== "auto" && animationName.trim() === "") {
        throw new ValidationError("Animation name cannot be empty");
    }
    return animationName;
}
function validateCurrentTime(currentTime) {
    if (currentTime === undefined || currentTime === null)
        return null;
    if (typeof currentTime !== "number" || currentTime < 0) {
        throw new ValidationError("Current time must be a non-negative number in seconds");
    }
    return currentTime;
}
function validateUpdateFraming(value) {
    if (value === undefined)
        return;
    if (typeof value !== "boolean") {
        throw new ValidationError("updateFraming must be a boolean");
    }
}
function validateTimeRange(startTime, endTime) {
    let validatedStartTime = null;
    let validatedEndTime = null;
    if (startTime !== undefined && startTime !== null) {
        if (typeof startTime !== "number" || startTime < 0) {
            throw new ValidationError("Start time must be a non-negative number in seconds");
        }
        validatedStartTime = startTime;
    }
    if (endTime !== undefined && endTime !== null) {
        if (typeof endTime !== "number" || endTime < 0) {
            throw new ValidationError("End time must be a non-negative number in seconds");
        }
        validatedEndTime = endTime;
    }
    if (validatedStartTime !== null &&
        validatedEndTime !== null &&
        validatedEndTime < validatedStartTime) {
        throw new ValidationError("End time must be greater than or equal to start time");
    }
    return { startTime: validatedStartTime, endTime: validatedEndTime };
}
function validateOrbitAngle(value, field) {
    const v = value ?? 0;
    if (typeof v !== "number" || Number.isNaN(v)) {
        throw new ValidationError(`${field} must be a number`);
    }
    return v;
}
function validateOrbitPhi(value) {
    const v = value ?? 75;
    if (typeof v !== "number" || Number.isNaN(v)) {
        throw new ValidationError("cameraOrbitY must be a number");
    }
    if (!isInRange(v, -180, 180)) {
        throw new ValidationError("cameraOrbitY must be between -180 and 180 degrees");
    }
    return v;
}
function validateOrbitDistance(value) {
    const v = value ?? 105;
    if (typeof v !== "number" || Number.isNaN(v)) {
        throw new ValidationError("cameraDistance must be a number");
    }
    if (!isInRange(v, 1, 500)) {
        throw new ValidationError("cameraDistance must be between 1 and 500 percent");
    }
    return v;
}
function validateOrbitSwing(value, field) {
    const v = value ?? 0;
    if (typeof v !== "number" || Number.isNaN(v)) {
        throw new ValidationError(`${field} must be a number`);
    }
    if (!isInRange(v, 0, 120)) {
        throw new ValidationError(`${field} must be between 0 and 120`);
    }
    return v;
}
function validateCameraOrbitX(value) {
    return validateOrbitAngle(value, "cameraOrbitX");
}
function validateCameraOrbitY(value) {
    return validateOrbitPhi(value);
}
function validateCameraDistance(value) {
    return validateOrbitDistance(value);
}
function validateCameraOrbitSwingX(value) {
    return validateOrbitSwing(value, "cameraOrbitSwingX");
}
function validateCameraOrbitSwingY(value) {
    return validateOrbitSwing(value, "cameraOrbitSwingY");
}
function validateRotationAxis(axis) {
    if (axis === undefined || axis === null)
        return null;
    if (typeof axis === "string") {
        const lower = axis.toLowerCase();
        if (lower === "x" || lower === "y" || lower === "z")
            return lower;
    }
    throw new ValidationError('Rotation axis must be one of "x", "y", "z", or null');
}
function validateCameraOrbitRotation(axis) {
    if (axis === undefined || axis === null)
        return null;
    if (typeof axis === "string") {
        const lower = axis.toLowerCase();
        if (lower === "x" || lower === "y")
            return lower;
    }
    throw new ValidationError('Rotation orbit must be one of "x", "y", or null');
}
function isPrivateIp(ip) {
    const family = net_1.default.isIP(ip);
    if (family === 4) {
        const parts = ip.split(".").map((p) => parseInt(p, 10));
        if (parts.length !== 4 || parts.some((n) => Number.isNaN(n)))
            return true;
        const [a, b] = parts;
        if (a === 10)
            return true;
        if (a === 172 && b !== undefined && b >= 16 && b <= 31)
            return true;
        if (a === 192 && b === 168)
            return true;
        if (a === 127)
            return true;
        if (a === 169 && b === 254)
            return true;
        if (a === 100 && b !== undefined && b >= 64 && b <= 127)
            return true;
        return false;
    }
    if (family === 6) {
        const normalized = ip.toLowerCase();
        if (normalized === "::1")
            return true;
        if (normalized.startsWith("fc") || normalized.startsWith("fd"))
            return true;
        if (normalized.startsWith("fe80"))
            return true;
        return false;
    }
    return true;
}
async function assertAllowedRemote(url) {
    if (url.protocol !== "https:" &&
        !(config_1.NETWORK.ALLOW_HTTP && url.protocol === "http:")) {
        throw new ValidationError("Only http/https URLs are allowed");
    }
    const directFamily = net_1.default.isIP(url.hostname);
    const addresses = directFamily
        ? [{ address: url.hostname, family: directFamily }]
        : await dns_1.default.promises.lookup(url.hostname, { all: true, verbatim: true });
    if (!addresses.length) {
        throw new ValidationError("Could not resolve host");
    }
    if (config_1.NETWORK.BLOCK_PRIVATE_IPS) {
        for (const addr of addresses) {
            if (isPrivateIp(addr.address)) {
                throw new ValidationError("Host is not allowed");
            }
        }
    }
}
async function fetchLimited(urlOrData, opts) {
    const { maxBytes, timeoutMs, signal, allowDataUrl = true, skipOnOversize = false, } = opts;
    if (urlOrData.startsWith("data:")) {
        if (!allowDataUrl) {
            throw new ValidationError("Data URLs are not allowed for this field");
        }
        const commaIndex = urlOrData.indexOf(",");
        const meta = urlOrData.slice(5, commaIndex);
        const base64Data = urlOrData.slice(commaIndex + 1);
        const contentType = meta.split(";")[0] || "application/octet-stream";
        const buffer = Buffer.from(base64Data, "base64");
        if (buffer.length > maxBytes) {
            if (skipOnOversize)
                return null;
            throw new LimitExceededError("Payload exceeds allowed size");
        }
        return { buffer, contentType, bytesRead: buffer.length };
    }
    const url = new URL(urlOrData);
    await assertAllowedRemote(url);
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    if (signal)
        signal.addEventListener("abort", onAbort);
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const resp = await fetch(url, { signal: controller.signal });
        if (!resp.ok) {
            throw new Error(`fetch failed with status ${resp.status}`);
        }
        const contentType = resp.headers.get("content-type") || "application/octet-stream";
        const contentLength = resp.headers.get("content-length");
        if (contentLength) {
            const len = parseInt(contentLength, 10);
            if (!Number.isNaN(len) && len > maxBytes) {
                if (skipOnOversize)
                    return null;
                throw new LimitExceededError("Payload exceeds allowed size");
            }
        }
        const reader = resp.body?.getReader
            ? resp.body.getReader()
            : null;
        const chunks = [];
        let bytesRead = 0;
        if (!reader) {
            const arr = await resp.arrayBuffer();
            bytesRead = arr.byteLength;
            if (bytesRead > maxBytes) {
                if (skipOnOversize)
                    return null;
                throw new LimitExceededError("Payload exceeds allowed size");
            }
            return { buffer: Buffer.from(arr), contentType, bytesRead };
        }
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            const buf = Buffer.from(value);
            bytesRead += buf.length;
            if (bytesRead > maxBytes) {
                if (skipOnOversize)
                    return null;
                throw new LimitExceededError("Payload exceeds allowed size");
            }
            chunks.push(buf);
        }
        return { buffer: Buffer.concat(chunks), contentType, bytesRead };
    }
    catch (err) {
        if (controller.signal.aborted || (signal && signal.aborted)) {
            throw new Error("Request timeout");
        }
        throw err;
    }
    finally {
        clearTimeout(timer);
        if (signal)
            signal.removeEventListener("abort", onAbort);
    }
}
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}
exports.ValidationError = ValidationError;
function validateSingleRender(data) {
    validateModel(data.model);
    validateDimensions(data.width, data.height);
    validateOrientation(data.roll, data.pitch, data.yaw);
    validateCameraOrbitX(data.cameraOrbitX);
    validateCameraOrbitY(data.cameraOrbitY);
    validateCameraDistance(data.cameraDistance);
    validateScaleComponents(data.scaleX, data.scaleY, data.scaleZ);
    validateOutputFormat(data.outputFormat);
    validateQuality(data.quality);
    validateShadowIntensity(data.shadowIntensity);
    validateShadowSoftness(data.shadowSoftness);
    validateSkyboxHeight(data.skyboxHeight);
    validateOptionalBackground(data.background);
    validateOptionalAssetUrl(data.environment, "Environment image");
    validateOptionalAssetUrl(data.skybox, "Skybox image");
    validateToneMapping(data.toneMapping);
    validateAnimationName(data.animationName);
    validateCurrentTime(data.currentTime);
}
function validateBatchRender(data) {
    validateModel(data.model);
    validateFrames(data.frames);
    validateUpdateFraming(data.updateFraming);
    data.frames.forEach((frame, index) => {
        try {
            validateDimensions(frame.width, frame.height);
            validateOrientation(frame.roll, frame.pitch, frame.yaw);
            validateCameraOrbitX(frame.cameraOrbitX);
            validateCameraOrbitY(frame.cameraOrbitY);
            validateCameraDistance(frame.cameraDistance);
            validateScaleComponents(frame.scaleX, frame.scaleY, frame.scaleZ);
            validateOutputFormat(frame.outputFormat);
            validateQuality(frame.quality);
            validateShadowIntensity(frame.shadowIntensity);
            validateShadowSoftness(frame.shadowSoftness);
            validateSkyboxHeight(frame.skyboxHeight);
            validateOptionalBackground(frame.background);
            validateOptionalAssetUrl(frame.environment, "Environment image");
            validateOptionalAssetUrl(frame.skybox, "Skybox image");
            validateToneMapping(frame.toneMapping);
            validateAnimationName(frame.animationName);
            validateCurrentTime(frame.currentTime);
        }
        catch (error) {
            throw new ValidationError(`Frame ${index}: ${error.message}`);
        }
    });
}
function validateSequenceRender(data) {
    validateModel(data.model);
    validateDimensions(data.width, data.height);
    validateFrameCount(data.frameCount);
    validateUpdateFraming(data.updateFraming);
    validateOrientation(data.roll, data.pitch, data.yaw);
    validateScaleComponents(data.scaleX, data.scaleY, data.scaleZ);
    validateRotationAxis(data.rotationAxis);
    validateCameraOrbitX(data.cameraOrbitX);
    validateCameraOrbitY(data.cameraOrbitY);
    validateCameraDistance(data.cameraDistance);
    validateCameraOrbitSwingX(data.cameraOrbitSwingX);
    validateCameraOrbitSwingY(data.cameraOrbitSwingY);
    validateCameraOrbitRotation(data.rotationOrbit);
    validateOutputFormat(data.outputFormat);
    validateQuality(data.quality);
    validateShadowIntensity(data.shadowIntensity);
    validateShadowSoftness(data.shadowSoftness);
    validateSkyboxHeight(data.skyboxHeight);
    validateOptionalBackground(data.background);
    validateOptionalAssetUrl(data.environment, "Environment image");
    validateOptionalAssetUrl(data.skybox, "Skybox image");
    validateToneMapping(data.toneMapping);
    validateAnimationName(data.animationName);
    validateTimeRange(data.startTime, data.endTime);
}
//# sourceMappingURL=validation.js.map