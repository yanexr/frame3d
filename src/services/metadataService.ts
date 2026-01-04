import { NodeIO } from "@gltf-transform/core";
import {
  KHRONOS_EXTENSIONS,
  EXTMeshGPUInstancing,
  EXTMeshoptCompression,
  EXTTextureAVIF,
  EXTTextureWebP,
} from "@gltf-transform/extensions";
import { ModelMetadata, AnimationInfo } from "../types/api";

const ALL_EXTENSIONS = [
  ...KHRONOS_EXTENSIONS,
  EXTMeshGPUInstancing,
  EXTMeshoptCompression,
  EXTTextureAVIF,
  EXTTextureWebP,
];

/**
 * Extracts basic metadata from a GLB model buffer.
 * @param glbBuffer The GLB model as an ArrayBuffer or Buffer.
 * @returns Parsed model metadata.
 */
export async function extractMetadata(
  glbBuffer: ArrayBuffer | Buffer
): Promise<ModelMetadata> {
  const view =
    glbBuffer instanceof Buffer
      ? new Uint8Array(glbBuffer)
      : new Uint8Array(glbBuffer);
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const document = await io.readBinary(view);
  const root = document.getRoot();

  const meshes = root.listMeshes();
  const materials = root.listMaterials();
  const textures = root.listTextures();
  const animations = root.listAnimations();

  let totalVertices = 0;
  let totalTriangles = 0;

  // Count vertices and triangles
  for (const mesh of meshes) {
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute("POSITION");
      if (pos) totalVertices += pos.getCount();

      const indices = prim.getIndices();
      if (indices) {
        totalTriangles += indices.getCount() / 3;
      } else if (pos) {
        totalTriangles += pos.getCount() / 3;
      }
    }
  }

  // Check if any material uses textures
  const isTextured = materials.some(
    (material) =>
      material.getBaseColorTexture() ||
      material.getNormalTexture() ||
      material.getEmissiveTexture() ||
      material.getOcclusionTexture() ||
      material.getMetallicRoughnessTexture()
  );

  // Extract animation information
  const animationInfos: AnimationInfo[] = animations.map((animation) => {
    const samplers = animation.listSamplers();
    const channels = animation.listChannels();

    // Calculate duration by finding the maximum time across all samplers
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
