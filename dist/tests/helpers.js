"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HDRI = exports.GLAM_VELVET_SOFA = exports.IRIDESCENT_DISH_WITH_OLIVES = exports.MATERIALS_VARIANTS_SHOE = exports.DRAGON_ATTENUATION = exports.FOX = exports.ANIMATED_MORPH_CUBE = exports.TEST_OUTPUT_DIR = exports.TEST_PORT = exports.TEST_URL = void 0;
exports.startTestServer = startTestServer;
exports.stopTestServer = stopTestServer;
exports.urlToBase64 = urlToBase64;
exports.saveTestImage = saveTestImage;
exports.makeRequest = makeRequest;
exports.makeGetRequest = makeGetRequest;
const app_1 = __importDefault(require("../src/app"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const renderService_1 = require("../src/services/renderService");
exports.TEST_URL = "http://localhost:3001";
exports.TEST_PORT = 3001;
exports.TEST_OUTPUT_DIR = path.join(__dirname, "output");
exports.ANIMATED_MORPH_CUBE = "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/AnimatedMorphCube/glTF-Binary/AnimatedMorphCube.glb";
exports.FOX = "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Fox/glTF-Binary/Fox.glb";
exports.DRAGON_ATTENUATION = "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/DragonAttenuation/glTF-Binary/DragonAttenuation.glb";
exports.MATERIALS_VARIANTS_SHOE = "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb";
exports.IRIDESCENT_DISH_WITH_OLIVES = "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/IridescentDishWithOlives/glTF-Binary/IridescentDishWithOlives.glb";
exports.GLAM_VELVET_SOFA = "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/GlamVelvetSofa/glTF-Binary/GlamVelvetSofa.glb";
exports.HDRI = "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/brown_photostudio_01_2k.hdr";
async function startTestServer() {
    if (global.server) {
        return;
    }
    const server = app_1.default.listen(exports.TEST_PORT);
    global.server = server;
    await new Promise((resolve) => {
        server.on("listening", () => {
            console.log(`Test server started on port ${exports.TEST_PORT}`);
            resolve();
        });
    });
}
async function stopTestServer() {
    if (global.server) {
        const server = global.server;
        await new Promise((resolve, reject) => {
            server.close((err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
        global.server = undefined;
    }
    await (0, renderService_1.closeBrowser)();
}
async function urlToBase64(url) {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const extension = url.split(".").pop()?.toLowerCase();
    let mimeType;
    switch (extension) {
        case "glb":
            mimeType = "model/gltf-binary";
            break;
        case "png":
            mimeType = "image/png";
            break;
        case "jpg":
        case "jpeg":
            mimeType = "image/jpeg";
            break;
        case "hdr":
            mimeType = "image/vnd.radiance";
            break;
        default:
            mimeType = "application/octet-stream";
    }
    return `data:${mimeType};base64,${base64}`;
}
function saveTestImage(filename, base64Data) {
    const fullPath = path.join(exports.TEST_OUTPUT_DIR, filename);
    const outputDir = path.dirname(fullPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const base64Content = base64Data.split(",")[1];
    if (!base64Content) {
        throw new Error("Invalid base64 data format");
    }
    const buffer = Buffer.from(base64Content, "base64");
    fs.writeFileSync(fullPath, buffer);
}
async function makeRequest(endpoint, body) {
    const url = `${exports.TEST_URL}${endpoint}`;
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!data.success && data.error) {
        console.error(`[${endpoint}] Error:`, data.error.message, data.error.details || "");
    }
    if (data.warnings?.length > 0) {
        console.warn(`[${endpoint}] Warnings:`, data.warnings);
    }
    return { status: response.status, data };
}
async function makeGetRequest(endpoint) {
    const url = `${exports.TEST_URL}${endpoint}`;
    const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    if (!data.success && data.error) {
        console.error(`[${endpoint}] Error:`, data.error.message, data.error.details || "");
    }
    return { status: response.status, data };
}
//# sourceMappingURL=helpers.js.map