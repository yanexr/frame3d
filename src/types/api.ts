export enum ErrorCode {
  INVALID_MODEL = "INVALID_MODEL",
  DOWNLOAD_FAILED = "DOWNLOAD_FAILED",
  RENDER_FAILED = "RENDER_FAILED",
  INVALID_PARAMS = "INVALID_PARAMS",
  TIMEOUT = "TIMEOUT",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export type OutputFormat = "webp" | "png" | "avif";
export type ToneMapping = "neutral" | "aces" | "agx";
export type RotationAxis = "x" | "y" | "z";

export interface SingleRenderRequest {
  model: string; // URL or base64 data
  width?: number;
  height?: number;
  roll?: number;
  pitch?: number;
  yaw?: number;
  cameraOrbitX?: number; // theta in degrees
  cameraOrbitY?: number; // phi in degrees
  cameraDistance?: number; // percent distance
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
  shadowIntensity?: number;
  shadowSoftness?: number;
  background?: string;
  environment?: string | null;
  skybox?: string | null;
  skyboxHeight?: string;
  exposure?: number;
  toneMapping?: ToneMapping;
  variantName?: string | null;
  outputFormat?: OutputFormat;
  quality?: number;
  includeMetadata?: boolean;
  animationName?: string | null;
  currentTime?: number | null; // in seconds
}

export interface SingleRenderResponse {
  success: true;
  image: string; // base64 data URL
  metadata?: ModelMetadata;
  warnings?: string[];
}

export interface BatchFrame {
  width?: number;
  height?: number;
  roll?: number;
  pitch?: number;
  yaw?: number;
  cameraOrbitX?: number; // theta in degrees
  cameraOrbitY?: number; // phi in degrees
  cameraDistance?: number; // percent distance
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
  shadowIntensity?: number;
  shadowSoftness?: number;
  background?: string;
  environment?: string | null;
  skybox?: string | null;
  skyboxHeight?: string;
  exposure?: number;
  toneMapping?: ToneMapping;
  variantName?: string | null;
  outputFormat?: OutputFormat;
  quality?: number;
  animationName?: string | null;
  currentTime?: number | null; // in seconds
}

export interface BatchRenderRequest {
  model: string;
  includeMetadata?: boolean;
  updateFraming?: boolean;
  frames: BatchFrame[];
}

export interface BatchRenderResponse {
  success: true;
  images: Array<{
    index: number;
    image: string;
  }>;
  metadata?: ModelMetadata;
  warnings?: string[];
}

export interface SequenceRenderRequest {
  model: string;
  frameCount?: number;
  width?: number;
  height?: number;
  roll?: number;
  pitch?: number;
  yaw?: number;
  rotationAxis?: RotationAxis | null;
  cameraOrbitX?: number; // theta in degrees
  cameraOrbitY?: number; // phi in degrees
  cameraDistance?: number; // percent distance
  cameraOrbitSwingX?: number; // swing range in degrees (0-120)
  cameraOrbitSwingY?: number; // swing range in degrees (0-120)
  rotationOrbit?: "x" | "y" | null; // rotate camera orbit over frames
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
  shadowIntensity?: number;
  shadowSoftness?: number;
  background?: string;
  environment?: string | null;
  skybox?: string | null;
  skyboxHeight?: string;
  exposure?: number;
  toneMapping?: ToneMapping;
  variantName?: string | null;
  outputFormat?: OutputFormat;
  quality?: number;
  includeMetadata?: boolean;
  updateFraming?: boolean;
  animationName?: string | null;
  startTime?: number | null; // in seconds
  endTime?: number | null; // in seconds
}

export interface SequenceRenderResponse {
  success: true;
  images: Array<{
    index: number;
    image: string;
  }>;
  metadata?: ModelMetadata;
  warnings?: string[];
}

export interface RenderOption {
  width?: number;
  height?: number;
  roll?: number;
  pitch?: number;
  yaw?: number;
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
  exposure?: number;
  shadowIntensity?: number;
  shadowSoftness?: number;
  background?: string;
  environment?: string | null;
  skybox?: string | null;
  skyboxHeight?: string;
  toneMapping?: ToneMapping;
  variantName?: string | null;
  animationName?: string | null;
  currentTime?: number | null; // in seconds
  cameraOrbit?: string | null; // e.g. "0deg 75deg 105%"
  updateFraming?: boolean;
}

export interface ModelMetadata {
  triangles: number;
  vertices: number;
  meshes: number;
  materials: string[];
  textures: number;
  fileSize: number;
  isTextured: boolean;
  animations: AnimationInfo[];
}

export interface AnimationInfo {
  name: string;
  duration: number; // in seconds
  channels: number;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: string;
  };
}

export interface HealthResponse {
  status: "ok";
  timestamp: string;
}
