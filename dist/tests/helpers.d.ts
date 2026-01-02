export declare const TEST_URL = "http://localhost:3001";
export declare const TEST_PORT = 3001;
export declare const TEST_OUTPUT_DIR: string;
export declare const ANIMATED_MORPH_CUBE = "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/AnimatedMorphCube/glTF-Binary/AnimatedMorphCube.glb";
export declare const FOX = "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/Fox/glTF-Binary/Fox.glb";
export declare const DRAGON_ATTENUATION = "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/DragonAttenuation/glTF-Binary/DragonAttenuation.glb";
export declare const MATERIALS_VARIANTS_SHOE = "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb";
export declare const IRIDESCENT_DISH_WITH_OLIVES = "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/IridescentDishWithOlives/glTF-Binary/IridescentDishWithOlives.glb";
export declare const GLAM_VELVET_SOFA = "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/GlamVelvetSofa/glTF-Binary/GlamVelvetSofa.glb";
export declare const HDRI = "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/brown_photostudio_01_2k.hdr";
export declare function startTestServer(): Promise<void>;
export declare function stopTestServer(): Promise<void>;
export declare function urlToBase64(url: string): Promise<string>;
export declare function saveTestImage(filename: string, base64Data: string): void;
export declare function makeRequest(endpoint: string, body: any): Promise<any>;
export declare function makeGetRequest(endpoint: string): Promise<any>;
//# sourceMappingURL=helpers.d.ts.map