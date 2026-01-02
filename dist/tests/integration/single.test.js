"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../helpers");
describe("Single Render Endpoint", () => {
    it("should render model with default settings and print metadata", async () => {
        const result = await (0, helpers_1.makeRequest)("/single", {
            model: helpers_1.ANIMATED_MORPH_CUBE,
            includeMetadata: true,
        });
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        expect(result.data.image).toBeDefined();
        expect(result.data.image).toMatch(/^data:image\/webp;base64,/);
        expect(result.data.metadata).toBeDefined();
        console.log("Single Render Metadata:", JSON.stringify(result.data.metadata, null, 2));
        expect(result.data.metadata.triangles).toBeGreaterThan(0);
        expect(result.data.metadata.vertices).toBeGreaterThan(0);
        expect(result.data.metadata.meshes).toBeGreaterThan(0);
        (0, helpers_1.saveTestImage)("single_default.webp", result.data.image);
    }, 100000);
    it("should reject invalid model URL", async () => {
        const result = await (0, helpers_1.makeRequest)("/single", {
            model: "https://this-url-is.invalid/nonexistent.glb",
        });
        expect(result.status).toBe(422);
        expect(result.data.success).toBe(false);
        expect(result.data.error).toBeDefined();
    });
    it("should have a light blue background (css hex #ADD8E6)", async () => {
        const result = await (0, helpers_1.makeRequest)("/single", {
            model: helpers_1.ANIMATED_MORPH_CUBE,
            skybox: "#ADD8E6",
        });
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        (0, helpers_1.saveTestImage)("single_light_blue_hex.webp", result.data.image);
    }, 60000);
    it("should render with a background color", async () => {
        const result = await (0, helpers_1.makeRequest)("/single", {
            model: helpers_1.FOX,
            background: "#FFA500",
        });
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        (0, helpers_1.saveTestImage)("single_fox_orange_bg.webp", result.data.image);
    }, 60000);
    it("should have a light blue gradient background (linear-gradient)", async () => {
        const result = await (0, helpers_1.makeRequest)("/single", {
            model: helpers_1.ANIMATED_MORPH_CUBE,
            skybox: "linear-gradient(to right, #ffffff, #00abff)",
        });
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        (0, helpers_1.saveTestImage)("single_light_blue_linear-gradient.webp", result.data.image);
    }, 60000);
    it("should render with an environment image", async () => {
        const result = await (0, helpers_1.makeRequest)("/single", {
            model: helpers_1.GLAM_VELVET_SOFA,
            environment: helpers_1.HDRI,
        });
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        (0, helpers_1.saveTestImage)("single_sofa_hdri_env.webp", result.data.image);
    }, 120000);
    it("should have a light blue gradient background (radial-gradient)", async () => {
        const result = await (0, helpers_1.makeRequest)("/single", {
            model: helpers_1.ANIMATED_MORPH_CUBE,
            skybox: "radial-gradient(circle, #ffffff, #00abff)",
        });
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        (0, helpers_1.saveTestImage)("single_light_blue_radial-gradient.webp", result.data.image);
    }, 60000);
    it("should render with a skybox image and variant", async () => {
        const result = await (0, helpers_1.makeRequest)("/single", {
            model: helpers_1.MATERIALS_VARIANTS_SHOE,
            skybox: helpers_1.HDRI,
            skyboxHeight: "1.5m",
            variantName: "Beach",
        });
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        (0, helpers_1.saveTestImage)("single_shoe_skybox_variant.webp", result.data.image);
    }, 120000);
    it("should have a light blue background (hsl)", async () => {
        const result = await (0, helpers_1.makeRequest)("/single", {
            model: helpers_1.ANIMATED_MORPH_CUBE,
            skybox: "hsl(210, 100%, 80%)",
        });
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        (0, helpers_1.saveTestImage)("single_light_blue_hsl.webp", result.data.image);
    }, 60000);
    it("should render with custom scale and avif output", async () => {
        const result = await (0, helpers_1.makeRequest)("/single", {
            model: helpers_1.MATERIALS_VARIANTS_SHOE,
            scaleX: 1.5,
            outputFormat: "avif",
        });
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        expect(result.data.image).toMatch(/^data:image\/avif;base64,/);
        (0, helpers_1.saveTestImage)("single_shoe_scaled.avif", result.data.image);
    }, 60000);
    it("should render with PNG output format", async () => {
        const result = await (0, helpers_1.makeRequest)("/single", {
            model: helpers_1.ANIMATED_MORPH_CUBE,
            outputFormat: "png",
            quality: 90,
        });
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        expect(result.data.image).toMatch(/^data:image\/png;base64,/);
        (0, helpers_1.saveTestImage)("single_png.png", result.data.image);
    }, 60000);
    it("should render with custom orientation and background gradient", async () => {
        const result = await (0, helpers_1.makeRequest)("/single", {
            model: helpers_1.ANIMATED_MORPH_CUBE,
            background: "radial-gradient(circle, #5f5f5f 0%, #141414 120%)",
            roll: 0,
            pitch: 0,
            yaw: 45,
        });
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        (0, helpers_1.saveTestImage)("single_rotated_45deg_radial-gradient.webp", result.data.image);
    }, 60000);
    it("should render fox with HDRI skybox passed as base64", async () => {
        const hdriBase64 = await (0, helpers_1.urlToBase64)(helpers_1.HDRI);
        const result = await (0, helpers_1.makeRequest)("/single", {
            model: helpers_1.FOX,
            skybox: hdriBase64,
        });
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        (0, helpers_1.saveTestImage)("single_fox_hdri_base64.webp", result.data.image);
    }, 120000);
    it("should handle base64 model input", async () => {
        const base64Model = await (0, helpers_1.urlToBase64)(helpers_1.ANIMATED_MORPH_CUBE);
        const result = await (0, helpers_1.makeRequest)("/single", {
            model: base64Model,
        });
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        (0, helpers_1.saveTestImage)("single_base64_input.webp", result.data.image);
    }, 90000);
    it("should render with custom orientation, tone mapping, and dimensions", async () => {
        const result = await (0, helpers_1.makeRequest)("/single", {
            model: helpers_1.MATERIALS_VARIANTS_SHOE,
            roll: 10,
            pitch: 20,
            yaw: 30,
            toneMapping: "aces",
            width: 2048,
            height: 1024,
            outputFormat: "png",
        });
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        expect(result.data.image).toMatch(/^data:image\/png;base64,/);
        (0, helpers_1.saveTestImage)("single_shoe_custom_settings.png", result.data.image);
    }, 120000);
    it("should render with custom dimensions and background image", async () => {
        const result = await (0, helpers_1.makeRequest)("/single", {
            model: helpers_1.ANIMATED_MORPH_CUBE,
            background: "https://upload.wikimedia.org/wikipedia/en/7/7d/Lenna_%28test_image%29.png",
            width: 512,
            height: 512,
        });
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        (0, helpers_1.saveTestImage)("single_512x512_background_image.webp", result.data.image);
    }, 60000);
    it("should have a light blue background (css lightblue)", async () => {
        const result = await (0, helpers_1.makeRequest)("/single", {
            model: helpers_1.ANIMATED_MORPH_CUBE,
            skybox: "lightblue",
        });
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        (0, helpers_1.saveTestImage)("single_light_blue.webp", result.data.image);
    }, 60000);
});
//# sourceMappingURL=single.test.js.map