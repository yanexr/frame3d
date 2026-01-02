"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImage = processImage;
const sharp_1 = __importDefault(require("sharp"));
async function processImage(buffer, format, quality) {
    let processedBuffer;
    switch (format) {
        case "png":
            processedBuffer = buffer;
            break;
        case "avif":
            processedBuffer = await (0, sharp_1.default)(buffer).avif({ quality }).toBuffer();
            break;
        case "webp":
        default:
            processedBuffer = await (0, sharp_1.default)(buffer).webp({ quality }).toBuffer();
            break;
    }
    const mimeType = `image/${format}`;
    const base64 = processedBuffer.toString("base64");
    return `data:${mimeType};base64,${base64}`;
}
//# sourceMappingURL=imageService.js.map