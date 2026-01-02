"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMetadata = extractMetadata;
const core_1 = require("@gltf-transform/core");
async function extractMetadata(glbBuffer) {
    const view = glbBuffer instanceof Buffer
        ? new Uint8Array(glbBuffer)
        : new Uint8Array(glbBuffer);
    const io = new core_1.NodeIO();
    const document = await io.readBinary(view);
    const root = document.getRoot();
    const meshes = root.listMeshes();
    const materials = root.listMaterials();
    const textures = root.listTextures();
    const animations = root.listAnimations();
    let totalVertices = 0;
    let totalTriangles = 0;
    for (const mesh of meshes) {
        for (const prim of mesh.listPrimitives()) {
            const pos = prim.getAttribute("POSITION");
            if (pos)
                totalVertices += pos.getCount();
            const indices = prim.getIndices();
            if (indices) {
                totalTriangles += indices.getCount() / 3;
            }
            else if (pos) {
                totalTriangles += pos.getCount() / 3;
            }
        }
    }
    const isTextured = materials.some((material) => material.getBaseColorTexture() ||
        material.getNormalTexture() ||
        material.getEmissiveTexture() ||
        material.getOcclusionTexture() ||
        material.getMetallicRoughnessTexture());
    const animationInfos = animations.map((animation) => {
        const samplers = animation.listSamplers();
        const channels = animation.listChannels();
        let maxTime = 0;
        for (const sampler of samplers) {
            const input = sampler.getInput();
            if (input) {
                const timeArray = input.getArray();
                if (timeArray) {
                    const lastTime = timeArray[timeArray.length - 1];
                    if (typeof lastTime === "number" && lastTime > maxTime) {
                        maxTime = lastTime;
                    }
                }
            }
        }
        return {
            name: animation.getName() || "Unnamed",
            duration: maxTime,
            channels: channels.length,
        };
    });
    return {
        triangles: Math.floor(totalTriangles),
        vertices: totalVertices,
        meshes: meshes.length,
        materials: materials.map((m) => m.getName() || "Unnamed"),
        textures: textures.length,
        fileSize: glbBuffer.byteLength,
        isTextured,
        animations: animationInfos,
    };
}
//# sourceMappingURL=metadataService.js.map