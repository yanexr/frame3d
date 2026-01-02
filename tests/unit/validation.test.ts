import {
  validateModel,
  validateDimensions,
  validateOrientation,
  validateFrameCount,
  validateSingleRender,
  validateBatchRender,
  validateSequenceRender,
  validateAnimationName,
  validateCurrentTime,
  validateTimeRange,
  validateCameraOrbitX,
  validateCameraOrbitY,
  validateCameraDistance,
  validateCameraOrbitSwingX,
  validateCameraOrbitSwingY,
  validateCameraOrbitRotation,
  validateRotationAxis,
  ValidationError,
} from "../../src/utils/validation";

describe("Validation Utils", () => {
  describe("ValidationError", () => {
    it("should create ValidationError with correct properties", () => {
      const error = new ValidationError("Test error message");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.name).toBe("ValidationError");
      expect(error.message).toBe("Test error message");
    });

    it("should be throwable and catchable", () => {
      expect(() => {
        throw new ValidationError("Custom validation error");
      }).toThrow(ValidationError);

      try {
        throw new ValidationError("Custom validation error");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toBe(
          "Custom validation error"
        );
      }
    });
  });

  describe("validateModel", () => {
    it("should accept valid URLs", () => {
      expect(() =>
        validateModel("https://example.com/model.glb")
      ).not.toThrow();
      expect(() => validateModel("http://example.com/model.glb")).not.toThrow();
    });

    it("should accept valid base64 data URLs", () => {
      const dataUrl = "data:model/gltf-binary;base64,SGVsbG8gV29ybGQ=";
      expect(() => validateModel(dataUrl)).not.toThrow();
    });

    it("should reject invalid model formats", () => {
      expect(() => validateModel("not-a-url")).toThrow(ValidationError);
      expect(() => validateModel(123)).toThrow(ValidationError);
    });
  });

  describe("validateDimensions", () => {
    it("should accept valid dimensions", () => {
      const result = validateDimensions(512, 512);
      expect(result).toEqual({ width: 512, height: 512 });
    });

    it("should use defaults when not provided", () => {
      const result = validateDimensions();
      expect(result).toEqual({ width: 1024, height: 1024 });
    });

    it("should reject dimensions outside valid range", () => {
      expect(() => validateDimensions(32, 512)).toThrow(ValidationError); // Too small
      expect(() => validateDimensions(512, 3000)).toThrow(ValidationError); // Too large
    });
  });

  describe("validateOrientation", () => {
    it("should accept valid orientation values", () => {
      const result = validateOrientation(90, 180, 270);
      expect(result).toEqual({
        roll: 90,
        pitch: 180,
        yaw: 270,
      });
    });

    it("should use defaults when not provided", () => {
      const result = validateOrientation();
      expect(result).toEqual({
        roll: 0,
        pitch: 0,
        yaw: 0,
      });
    });

    it("should reject non-number values", () => {
      expect(() => validateOrientation("90", 0, 0)).toThrow(ValidationError);
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

      expect(() => validateSingleRender(validRequest)).not.toThrow();
    });

    it("should throw ValidationError for invalid requests", () => {
      const invalidRequest = {
        model: "not-a-url",
        width: 32, // Too small
        quality: 150, // Too high
      };

      expect(() => validateSingleRender(invalidRequest)).toThrow(
        ValidationError
      );
    });

    it("should accept minimal valid request", () => {
      const minimalRequest = {
        model: "https://example.com/model.glb",
      };

      expect(() => validateSingleRender(minimalRequest)).not.toThrow();
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

      expect(() => validateBatchRender(validRequest)).not.toThrow();
    });

    it("should throw ValidationError for invalid batch requests", () => {
      const invalidRequest = {
        model: "not-a-url",
        frames: [], // Empty frames array
      };

      expect(() => validateBatchRender(invalidRequest)).toThrow(
        ValidationError
      );
    });
  });

  describe("validateSequenceRender", () => {
    it("should validate a valid sequence request", () => {
      const validRequest = {
        model: "https://example.com/model.glb",
        frameCount: 8,
        rotationAxis: "y",
      };

      expect(() => validateSequenceRender(validRequest)).not.toThrow();
    });

    it("should throw ValidationError for invalid sequence requests", () => {
      const invalidRequest = {
        model: "not-a-url",
        frameCount: 0, // Invalid frame count
        rotationAxis: "invalid",
      };

      expect(() => validateSequenceRender(invalidRequest)).toThrow(
        ValidationError
      );
    });
  });

  describe("validateAnimationName", () => {
    it("should accept valid animation names", () => {
      expect(validateAnimationName("Take 001")).toBe("Take 001");
      expect(validateAnimationName("idle_animation")).toBe("idle_animation");
    });

    it("should return null for undefined/null", () => {
      expect(validateAnimationName(undefined)).toBe(null);
      expect(validateAnimationName(null)).toBe(null);
    });

    it("should reject non-string values", () => {
      expect(() => validateAnimationName(123)).toThrow(ValidationError);
      expect(() => validateAnimationName({})).toThrow(ValidationError);
    });
  });

  describe("validateCurrentTime", () => {
    it("should accept valid time values", () => {
      expect(validateCurrentTime(0)).toBe(0);
      expect(validateCurrentTime(1.5)).toBe(1.5);
      expect(validateCurrentTime(10)).toBe(10);
    });

    it("should return null for undefined/null", () => {
      expect(validateCurrentTime(undefined)).toBe(null);
      expect(validateCurrentTime(null)).toBe(null);
    });

    it("should reject negative values", () => {
      expect(() => validateCurrentTime(-1)).toThrow(ValidationError);
    });

    it("should reject non-number values", () => {
      expect(() => validateCurrentTime("1.5")).toThrow(ValidationError);
      expect(() => validateCurrentTime({})).toThrow(ValidationError);
    });
  });

  describe("validateTimeRange", () => {
    it("should accept valid time ranges", () => {
      const result = validateTimeRange(0, 2.5);
      expect(result).toEqual({ startTime: 0, endTime: 2.5 });
    });

    it("should accept partial ranges", () => {
      const result1 = validateTimeRange(1, undefined);
      expect(result1).toEqual({ startTime: 1, endTime: null });

      const result2 = validateTimeRange(undefined, 3);
      expect(result2).toEqual({ startTime: null, endTime: 3 });
    });

    it("should return nulls for undefined values", () => {
      const result = validateTimeRange(undefined, undefined);
      expect(result).toEqual({ startTime: null, endTime: null });
    });

    it("should reject invalid ranges (end before start)", () => {
      expect(() => validateTimeRange(2, 1)).toThrow(ValidationError);
    });

    it("should reject negative values", () => {
      expect(() => validateTimeRange(-1, 2)).toThrow(ValidationError);
      expect(() => validateTimeRange(0, -1)).toThrow(ValidationError);
    });
  });

  describe("camera orbit params", () => {
    it("should validate cameraOrbitX/Y and distance defaults", () => {
      expect(validateCameraOrbitX(undefined)).toBe(0);
      expect(validateCameraOrbitY(undefined)).toBe(75);
      expect(validateCameraDistance(undefined)).toBe(105);
    });

    it("should accept valid angles and distance", () => {
      expect(validateCameraOrbitX(45)).toBe(45);
      expect(validateCameraOrbitY(-90)).toBe(-90);
      expect(validateCameraDistance(150)).toBe(150);
    });

    it("should reject invalid angles or distance", () => {
      expect(() => validateCameraOrbitY(200)).toThrow(ValidationError);
      expect(() => validateCameraDistance(0)).toThrow(ValidationError);
      expect(() => validateCameraOrbitX("a" as any)).toThrow(ValidationError);
    });

    it("should validate orbit swing per axis", () => {
      expect(validateCameraOrbitSwingX(0)).toBe(0);
      expect(validateCameraOrbitSwingX(60)).toBe(60);
      expect(validateCameraOrbitSwingY(120)).toBe(120);
      expect(() => validateCameraOrbitSwingX(-1)).toThrow(ValidationError);
      expect(() => validateCameraOrbitSwingY(130)).toThrow(ValidationError);
    });

    it("should validate rotation orbit axis", () => {
      expect(validateCameraOrbitRotation("x")).toBe("x");
      expect(validateCameraOrbitRotation("Y")).toBe("y");
      expect(validateCameraOrbitRotation(null)).toBe(null);
      expect(() => validateCameraOrbitRotation("z")).toThrow(ValidationError);
    });
  });

  describe("validateFrameCount", () => {
    it("should accept valid frame counts", () => {
      expect(validateFrameCount(1)).toBe(1);
      expect(validateFrameCount(8)).toBe(8);
      expect(validateFrameCount(16)).toBe(16);
    });

    it("should reject frame counts outside valid range", () => {
      expect(() => validateFrameCount(0)).toThrow(ValidationError);
      expect(() => validateFrameCount(2000)).toThrow(ValidationError); // Too many
    });

    it("should reject non-integer values", () => {
      expect(() => validateFrameCount(1.5)).toThrow(ValidationError);
      expect(() => validateFrameCount("4")).toThrow(ValidationError);
    });
  });

  describe("validateRotationAxis", () => {
    it("should accept valid lowercase axes", () => {
      expect(validateRotationAxis("x")).toBe("x");
      expect(validateRotationAxis("y")).toBe("y");
      expect(validateRotationAxis("z")).toBe("z");
    });
    it("should accept valid uppercase and mixed case axes", () => {
      expect(validateRotationAxis("X")).toBe("x");
      expect(validateRotationAxis("Y")).toBe("y");
      expect(validateRotationAxis("Z")).toBe("z");
      expect(validateRotationAxis("X")).toBe("x");
      expect(validateRotationAxis("y")).toBe("y");
      expect(validateRotationAxis("Z")).toBe("z");
    });
    it("should accept null/undefined", () => {
      expect(validateRotationAxis(undefined)).toBe(null);
      expect(validateRotationAxis(null)).toBe(null);
    });
    it("should reject invalid values", () => {
      expect(() => validateRotationAxis("a")).toThrow(ValidationError);
      expect(() => validateRotationAxis("")).toThrow(ValidationError);
      expect(() => validateRotationAxis(123)).toThrow(ValidationError);
      expect(() => validateRotationAxis({})).toThrow(ValidationError);
    });
  });
});
