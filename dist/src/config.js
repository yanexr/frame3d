"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NETWORK = exports.LIMITS = void 0;
const envInt = (name, fallback) => {
    const raw = process.env[name];
    if (raw === undefined)
        return fallback;
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : fallback;
};
const envString = (name, fallback) => {
    const raw = process.env[name];
    return raw && raw.trim().length > 0 ? raw : fallback;
};
exports.LIMITS = {
    JSON_BODY_MAX_SIZE: envString("JSON_BODY_MAX_SIZE", "150mb"),
    MODEL_MAX_BYTES: envInt("MODEL_MAX_BYTES", 150 * 1024 * 1024),
    TIMEOUT_SINGLE_MS: envInt("TIMEOUT_SINGLE_MS", 60_000),
    TIMEOUT_BATCH_BASE_MS: envInt("TIMEOUT_BATCH_BASE_MS", 60_000),
    TIMEOUT_BATCH_PER_FRAME_MS: envInt("TIMEOUT_BATCH_PER_FRAME_MS", 15_000),
    TIMEOUT_SEQUENCE_BASE_MS: envInt("TIMEOUT_SEQUENCE_BASE_MS", 60_000),
    TIMEOUT_SEQUENCE_PER_FRAME_MS: envInt("TIMEOUT_SEQUENCE_PER_FRAME_MS", 5_000),
    MAX_FRAMES_PER_REQUEST: envInt("MAX_FRAMES_PER_REQUEST", 256),
};
exports.NETWORK = {
    ALLOW_HTTP: true,
    BLOCK_PRIVATE_IPS: true,
};
//# sourceMappingURL=config.js.map