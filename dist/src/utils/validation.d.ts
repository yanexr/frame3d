export declare class LimitExceededError extends Error {
    constructor(message: string);
}
export declare function validateModel(model: unknown): string;
export declare function validateOptionalAssetUrl(value: unknown, field: string): string | null;
export declare function validateOptionalBackground(value: unknown): string | null;
export declare function validateDimensions(width?: unknown, height?: unknown): {
    width: number;
    height: number;
};
export declare function validateOrientation(x?: unknown, y?: unknown, z?: unknown): {
    roll: number;
    pitch: number;
    yaw: number;
};
export declare function validateScaleComponents(x?: unknown, y?: unknown, z?: unknown): {
    scaleX: number;
    scaleY: number;
    scaleZ: number;
};
export declare function validateSkyboxHeight(height?: unknown): string;
export declare function validateShadowSoftness(softness?: unknown): number;
export declare function validateFrameCount(frameCount: unknown): number;
export declare function validateFrames(frames: unknown): any[];
export declare function validateQuality(quality?: unknown): number;
export declare function validateOutputFormat(format?: unknown): "webp" | "png" | "avif";
export declare function validateToneMapping(toneMapping?: unknown): "neutral" | "aces" | "agx";
export declare function validateShadowIntensity(intensity?: unknown): number;
export declare function validateAnimationName(animationName?: unknown): string | null;
export declare function validateCurrentTime(currentTime?: unknown): number | null;
export declare function validateUpdateFraming(value?: unknown): void;
export declare function validateTimeRange(startTime?: unknown, endTime?: unknown): {
    startTime: number | null;
    endTime: number | null;
};
export declare function validateCameraOrbitX(value?: unknown): number;
export declare function validateCameraOrbitY(value?: unknown): number;
export declare function validateCameraDistance(value?: unknown): number;
export declare function validateCameraOrbitSwingX(value?: unknown): number;
export declare function validateCameraOrbitSwingY(value?: unknown): number;
export declare function validateRotationAxis(axis?: unknown): "x" | "y" | "z" | null;
export declare function validateCameraOrbitRotation(axis?: unknown): "x" | "y" | null;
interface FetchLimitsOptions {
    maxBytes: number;
    timeoutMs: number;
    signal?: AbortSignal;
    allowDataUrl?: boolean;
    skipOnOversize?: boolean;
}
interface FetchResult {
    buffer: Buffer;
    contentType: string;
    bytesRead: number;
}
export declare function fetchLimited(urlOrData: string, opts: FetchLimitsOptions): Promise<FetchResult | null>;
export declare class ValidationError extends Error {
    constructor(message: string);
}
export declare function validateSingleRender(data: any): void;
export declare function validateBatchRender(data: any): void;
export declare function validateSequenceRender(data: any): void;
export {};
//# sourceMappingURL=validation.d.ts.map