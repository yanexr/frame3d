"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../helpers");
describe("Sequence Render Endpoint", () => {
    it("should render 12-frame rotation sequence", async () => {
        const result = await (0, helpers_1.makeRequest)("/sequence", {
            model: helpers_1.ANIMATED_MORPH_CUBE,
            frameCount: 12,
            rotationAxis: "y",
            cameraOrbitSwingY: 100,
        });
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        expect(result.data.images).toHaveLength(12);
        for (const image of result.data.images) {
            expect(image.image).toMatch(/^data:image\/webp;base64,/);
            (0, helpers_1.saveTestImage)(`sequence-dynamic_orbit_rotation_y/sequence_frame_${image.index}.webp`, image.image);
        }
    }, 120000);
    it("should render an 8-frame animation sequence", async () => {
        const result = await (0, helpers_1.makeRequest)("/sequence", {
            model: helpers_1.ANIMATED_MORPH_CUBE,
            frameCount: 8,
            animationName: "Square",
        });
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        expect(result.data.images).toHaveLength(8);
        for (const image of result.data.images) {
            expect(image.image).toMatch(/^data:image\/webp;base64,/);
            (0, helpers_1.saveTestImage)(`sequence-animation/sequence_frame_${image.index}.webp`, image.image);
        }
    }, 120000);
    it("should render a short animation sequence with a blue background", async () => {
        const result = await (0, helpers_1.makeRequest)("/sequence", {
            model: helpers_1.ANIMATED_MORPH_CUBE,
            frameCount: 8,
            animationName: "auto",
            endTime: 0.5,
            background: "#0000FF",
        });
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        expect(result.data.images).toHaveLength(8);
        for (const image of result.data.images) {
            expect(image.image).toMatch(/^data:image\/webp;base64,/);
            (0, helpers_1.saveTestImage)(`sequence-short-animation/sequence_frame_${image.index}.webp`, image.image);
        }
    }, 120000);
    it("should render a 16-frame rotation sequence with a skybox", async () => {
        const result = await (0, helpers_1.makeRequest)("/sequence", {
            model: helpers_1.DRAGON_ATTENUATION,
            frameCount: 16,
            skybox: helpers_1.HDRI,
            skyboxHeight: "50cm",
            rotationAxis: "y",
            cameraOrbitSwingY: 100,
        });
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        expect(result.data.images).toHaveLength(16);
        for (const image of result.data.images) {
            expect(image.image).toMatch(/^data:image\/webp;base64,/);
            (0, helpers_1.saveTestImage)(`sequence-dragon-skybox/sequence_frame_${image.index}.webp`, image.image);
        }
    }, 240000);
    it("should render a 7-frame animation sequence of a fox running", async () => {
        const result = await (0, helpers_1.makeRequest)("/sequence", {
            model: helpers_1.FOX,
            frameCount: 7,
            animationName: "Run",
            background: "#FFFFFF",
            shadowIntensity: 0.5,
            rotationAxis: "y",
        });
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        expect(result.data.images).toHaveLength(7);
        for (const image of result.data.images) {
            expect(image.image).toMatch(/^data:image\/webp;base64,/);
            (0, helpers_1.saveTestImage)(`sequence-fox-run/sequence_frame_${image.index}.webp`, image.image);
        }
    }, 180000);
    it("should render a dragon with rotationOrbit X and cameraOrbitSwingY of 120", async () => {
        const result = await (0, helpers_1.makeRequest)("/sequence", {
            model: helpers_1.DRAGON_ATTENUATION,
            frameCount: 8,
            shadowIntensity: 0.5,
            rotationOrbit: "x",
            cameraOrbitSwingY: 120,
        });
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        expect(result.data.images).toHaveLength(8);
        for (const image of result.data.images) {
            expect(image.image).toMatch(/^data:image\/webp;base64,/);
            (0, helpers_1.saveTestImage)(`sequence-dragon-rotationOrbitX-cameraOrbitSwingY120/sequence_frame_${image.index}.webp`, image.image);
        }
    }, 180000);
});
//# sourceMappingURL=sequence.test.js.map