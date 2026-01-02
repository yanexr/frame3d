"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validation_1 = require("../../src/utils/validation");
describe("Validation Utils", () => {
    describe("ValidationError", () => {
        it("should create ValidationError with correct properties", () => {
            const error = new validation_1.ValidationError("Test error message");
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(validation_1.ValidationError);
            expect(error.name).toBe("ValidationError");
            expect(error.message).toBe("Test error message");
        });
        it("should be throwable and catchable", () => {
            expect(() => {
                throw new validation_1.ValidationError("Custom validation error");
            }).toThrow(validation_1.ValidationError);
            try {
                throw new validation_1.ValidationError("Custom validation error");
            }
            catch (error) {
                expect(error).toBeInstanceOf(validation_1.ValidationError);
                expect(error.message).toBe("Custom validation error");
            }
        });
    });
    describe("validateModel", () => {
        it("should accept valid URLs", () => {
            expect(() => (0, validation_1.validateModel)("https://example.com/model.glb")).not.toThrow();
            expect(() => (0, validation_1.validateModel)("http://example.com/model.glb")).not.toThrow();
        });
        it("should accept valid base64 data URLs", () => {
            const dataUrl = "data:model/gltf-binary;base64,SGVsbG8gV29ybGQ=";
            expect(() => (0, validation_1.validateModel)(dataUrl)).not.toThrow();
        });
        it("should reject invalid model formats", () => {
            expect(() => (0, validation_1.validateModel)("not-a-url")).toThrow(validation_1.ValidationError);
            expect(() => (0, validation_1.validateModel)(123)).toThrow(validation_1.ValidationError);
        });
    });
    describe("validateDimensions", () => {
        it("should accept valid dimensions", () => {
            const result = (0, validation_1.validateDimensions)(512, 512);
            expect(result).toEqual({ width: 512, height: 512 });
        });
        it("should use defaults when not provided", () => {
            const result = (0, validation_1.validateDimensions)();
            expect(result).toEqual({ width: 1024, height: 1024 });
        });
        it("should reject dimensions outside valid range", () => {
            expect(() => (0, validation_1.validateDimensions)(32, 512)).toThrow(validation_1.ValidationError);
            expect(() => (0, validation_1.validateDimensions)(512, 3000)).toThrow(validation_1.ValidationError);
        });
    });
    describe("validateOrientation", () => {
        it("should accept valid orientation values", () => {
            const result = (0, validation_1.validateOrientation)(90, 180, 270);
            expect(result).toEqual({
                roll: 90,
                pitch: 180,
                yaw: 270,
            });
        });
        it("should use defaults when not provided", () => {
            const result = (0, validation_1.validateOrientation)();
            expect(result).toEqual({
                roll: 0,
                pitch: 0,
                yaw: 0,
            });
        });
        it("should reject non-number values", () => {
            expect(() => (0, validation_1.validateOrientation)("90", 0, 0)).toThrow(validation_1.ValidationError);
        });
    });
    describe("validateSingleRender", () => {
        it("should validate a complete valid request without throwing", () => {
            const validRequest = {
                model: "https://example.com/model.glb",
                width: 512,
                height: 512,
                roll: 0,
                pitch: 0,
                yaw: 90,
                outputFormat: "webp",
                quality: 80,
            };
            expect(() => (0, validation_1.validateSingleRender)(validRequest)).not.toThrow();
        });
        it("should throw ValidationError for invalid requests", () => {
            const invalidRequest = {
                model: "not-a-url",
                width: 32,
                quality: 150,
            };
            expect(() => (0, validation_1.validateSingleRender)(invalidRequest)).toThrow(validation_1.ValidationError);
        });
        it("should accept minimal valid request", () => {
            const minimalRequest = {
                model: "https://example.com/model.glb",
            };
            expect(() => (0, validation_1.validateSingleRender)(minimalRequest)).not.toThrow();
        });
    });
    describe("validateBatchRender", () => {
        it("should validate a valid batch request", () => {
            const validRequest = {
                model: "https://example.com/model.glb",
                frames: [
                    { width: 512, height: 512 },
                    { pitch: 90, outputFormat: "png" },
                ],
            };
            expect(() => (0, validation_1.validateBatchRender)(validRequest)).not.toThrow();
        });
        it("should throw ValidationError for invalid batch requests", () => {
            const invalidRequest = {
                model: "not-a-url",
                frames: [],
            };
            expect(() => (0, validation_1.validateBatchRender)(invalidRequest)).toThrow(validation_1.ValidationError);
        });
    });
    describe("validateSequenceRender", () => {
        it("should validate a valid sequence request", () => {
            const validRequest = {
                model: "https://example.com/model.glb",
                frameCount: 8,
                rotationAxis: "y",
            };
            expect(() => (0, validation_1.validateSequenceRender)(validRequest)).not.toThrow();
        });
        it("should throw ValidationError for invalid sequence requests", () => {
            const invalidRequest = {
                model: "not-a-url",
                frameCount: 0,
                rotationAxis: "invalid",
            };
            expect(() => (0, validation_1.validateSequenceRender)(invalidRequest)).toThrow(validation_1.ValidationError);
        });
    });
    describe("validateAnimationName", () => {
        it("should accept valid animation names", () => {
            expect((0, validation_1.validateAnimationName)("Take 001")).toBe("Take 001");
            expect((0, validation_1.validateAnimationName)("idle_animation")).toBe("idle_animation");
        });
        it("should return null for undefined/null", () => {
            expect((0, validation_1.validateAnimationName)(undefined)).toBe(null);
            expect((0, validation_1.validateAnimationName)(null)).toBe(null);
        });
        it("should reject non-string values", () => {
            expect(() => (0, validation_1.validateAnimationName)(123)).toThrow(validation_1.ValidationError);
            expect(() => (0, validation_1.validateAnimationName)({})).toThrow(validation_1.ValidationError);
        });
    });
    describe("validateCurrentTime", () => {
        it("should accept valid time values", () => {
            expect((0, validation_1.validateCurrentTime)(0)).toBe(0);
            expect((0, validation_1.validateCurrentTime)(1.5)).toBe(1.5);
            expect((0, validation_1.validateCurrentTime)(10)).toBe(10);
        });
        it("should return null for undefined/null", () => {
            expect((0, validation_1.validateCurrentTime)(undefined)).toBe(null);
            expect((0, validation_1.validateCurrentTime)(null)).toBe(null);
        });
        it("should reject negative values", () => {
            expect(() => (0, validation_1.validateCurrentTime)(-1)).toThrow(validation_1.ValidationError);
        });
        it("should reject non-number values", () => {
            expect(() => (0, validation_1.validateCurrentTime)("1.5")).toThrow(validation_1.ValidationError);
            expect(() => (0, validation_1.validateCurrentTime)({})).toThrow(validation_1.ValidationError);
        });
    });
    describe("validateTimeRange", () => {
        it("should accept valid time ranges", () => {
            const result = (0, validation_1.validateTimeRange)(0, 2.5);
            expect(result).toEqual({ startTime: 0, endTime: 2.5 });
        });
        it("should accept partial ranges", () => {
            const result1 = (0, validation_1.validateTimeRange)(1, undefined);
            expect(result1).toEqual({ startTime: 1, endTime: null });
            const result2 = (0, validation_1.validateTimeRange)(undefined, 3);
            expect(result2).toEqual({ startTime: null, endTime: 3 });
        });
        it("should return nulls for undefined values", () => {
            const result = (0, validation_1.validateTimeRange)(undefined, undefined);
            expect(result).toEqual({ startTime: null, endTime: null });
        });
        it("should reject invalid ranges (end before start)", () => {
            expect(() => (0, validation_1.validateTimeRange)(2, 1)).toThrow(validation_1.ValidationError);
        });
        it("should reject negative values", () => {
            expect(() => (0, validation_1.validateTimeRange)(-1, 2)).toThrow(validation_1.ValidationError);
            expect(() => (0, validation_1.validateTimeRange)(0, -1)).toThrow(validation_1.ValidationError);
        });
    });
    describe("camera orbit params", () => {
        it("should validate cameraOrbitX/Y and distance defaults", () => {
            expect((0, validation_1.validateCameraOrbitX)(undefined)).toBe(0);
            expect((0, validation_1.validateCameraOrbitY)(undefined)).toBe(75);
            expect((0, validation_1.validateCameraDistance)(undefined)).toBe(105);
        });
        it("should accept valid angles and distance", () => {
            expect((0, validation_1.validateCameraOrbitX)(45)).toBe(45);
            expect((0, validation_1.validateCameraOrbitY)(-90)).toBe(-90);
            expect((0, validation_1.validateCameraDistance)(150)).toBe(150);
        });
        it("should reject invalid angles or distance", () => {
            expect(() => (0, validation_1.validateCameraOrbitY)(200)).toThrow(validation_1.ValidationError);
            expect(() => (0, validation_1.validateCameraDistance)(0)).toThrow(validation_1.ValidationError);
            expect(() => (0, validation_1.validateCameraOrbitX)("a")).toThrow(validation_1.ValidationError);
        });
        it("should validate orbit swing per axis", () => {
            expect((0, validation_1.validateCameraOrbitSwingX)(0)).toBe(0);
            expect((0, validation_1.validateCameraOrbitSwingX)(60)).toBe(60);
            expect((0, validation_1.validateCameraOrbitSwingY)(120)).toBe(120);
            expect(() => (0, validation_1.validateCameraOrbitSwingX)(-1)).toThrow(validation_1.ValidationError);
            expect(() => (0, validation_1.validateCameraOrbitSwingY)(130)).toThrow(validation_1.ValidationError);
        });
        it("should validate rotation orbit axis", () => {
            expect((0, validation_1.validateCameraOrbitRotation)("x")).toBe("x");
            expect((0, validation_1.validateCameraOrbitRotation)("Y")).toBe("y");
            expect((0, validation_1.validateCameraOrbitRotation)(null)).toBe(null);
            expect(() => (0, validation_1.validateCameraOrbitRotation)("z")).toThrow(validation_1.ValidationError);
        });
    });
    describe("validateFrameCount", () => {
        it("should accept valid frame counts", () => {
            expect((0, validation_1.validateFrameCount)(1)).toBe(1);
            expect((0, validation_1.validateFrameCount)(8)).toBe(8);
            expect((0, validation_1.validateFrameCount)(16)).toBe(16);
        });
        it("should reject frame counts outside valid range", () => {
            expect(() => (0, validation_1.validateFrameCount)(0)).toThrow(validation_1.ValidationError);
            expect(() => (0, validation_1.validateFrameCount)(2000)).toThrow(validation_1.ValidationError);
        });
        it("should reject non-integer values", () => {
            expect(() => (0, validation_1.validateFrameCount)(1.5)).toThrow(validation_1.ValidationError);
            expect(() => (0, validation_1.validateFrameCount)("4")).toThrow(validation_1.ValidationError);
        });
    });
    describe("validateRotationAxis", () => {
        it("should accept valid lowercase axes", () => {
            expect((0, validation_1.validateRotationAxis)("x")).toBe("x");
            expect((0, validation_1.validateRotationAxis)("y")).toBe("y");
            expect((0, validation_1.validateRotationAxis)("z")).toBe("z");
        });
        it("should accept valid uppercase and mixed case axes", () => {
            expect((0, validation_1.validateRotationAxis)("X")).toBe("x");
            expect((0, validation_1.validateRotationAxis)("Y")).toBe("y");
            expect((0, validation_1.validateRotationAxis)("Z")).toBe("z");
            expect((0, validation_1.validateRotationAxis)("X")).toBe("x");
            expect((0, validation_1.validateRotationAxis)("y")).toBe("y");
            expect((0, validation_1.validateRotationAxis)("Z")).toBe("z");
        });
        it("should accept null/undefined", () => {
            expect((0, validation_1.validateRotationAxis)(undefined)).toBe(null);
            expect((0, validation_1.validateRotationAxis)(null)).toBe(null);
        });
        it("should reject invalid values", () => {
            expect(() => (0, validation_1.validateRotationAxis)("a")).toThrow(validation_1.ValidationError);
            expect(() => (0, validation_1.validateRotationAxis)("")).toThrow(validation_1.ValidationError);
            expect(() => (0, validation_1.validateRotationAxis)(123)).toThrow(validation_1.ValidationError);
            expect(() => (0, validation_1.validateRotationAxis)({})).toThrow(validation_1.ValidationError);
        });
    });
});
//# sourceMappingURL=validation.test.js.map