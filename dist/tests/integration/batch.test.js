"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../helpers");
describe("Batch Render Endpoint", () => {
    it("should render a batch of 2 frames with different settings", async () => {
        const result = await (0, helpers_1.makeRequest)("/batch", {
            model: helpers_1.ANIMATED_MORPH_CUBE,
            frames: [
                { width: 300, height: 300 },
                { pitch: 90, outputFormat: "png" },
            ],
        });
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        expect(result.data.images).toHaveLength(2);
        expect(result.data.images[0].image).toMatch(/^data:image\/webp;base64,/);
        (0, helpers_1.saveTestImage)("batch-2/batch_frame_0.webp", result.data.images[0].image);
        expect(result.data.images[1].image).toMatch(/^data:image\/png;base64,/);
        (0, helpers_1.saveTestImage)("batch-2/batch_frame_1.png", result.data.images[1].image);
    }, 120000);
    it("should render a complex batch of 4 frames", async () => {
        const result = await (0, helpers_1.makeRequest)("/batch", {
            model: helpers_1.IRIDESCENT_DISH_WITH_OLIVES,
            frames: [
                { background: "#00FF00" },
                { skybox: helpers_1.HDRI },
                {
                    scaleX: 2,
                    scaleY: 2,
                    scaleZ: 2,
                    outputFormat: "png",
                    skyboxColor: "radial-gradient(circle, #ffffff, #00abff)",
                },
                { shadowIntensity: 1, outputFormat: "avif", quality: 10 },
            ],
        });
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        expect(result.data.images).toHaveLength(4);
        expect(result.data.images[0].image).toMatch(/^data:image\/webp;base64,/);
        (0, helpers_1.saveTestImage)("batch-4/batch_frame_0.webp", result.data.images[0].image);
        expect(result.data.images[1].image).toMatch(/^data:image\/webp;base64,/);
        (0, helpers_1.saveTestImage)("batch-4/batch_frame_1.webp", result.data.images[1].image);
        expect(result.data.images[2].image).toMatch(/^data:image\/png;base64,/);
        (0, helpers_1.saveTestImage)("batch-4/batch_frame_2.png", result.data.images[2].image);
        expect(result.data.images[3].image).toMatch(/^data:image\/avif;base64,/);
        (0, helpers_1.saveTestImage)("batch-4/batch_frame_3.avif", result.data.images[3].image);
    }, 240000);
});
//# sourceMappingURL=batch.test.js.map