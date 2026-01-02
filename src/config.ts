const envInt = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const envString = (name: string, fallback: string): string => {
  const raw = process.env[name];
  return raw && raw.trim().length > 0 ? raw : fallback;
};

export const LIMITS = {
  JSON_BODY_MAX_SIZE: envString("JSON_BODY_MAX_SIZE", "150mb"),
  MODEL_MAX_BYTES: envInt("MODEL_MAX_BYTES", 150 * 1024 * 1024), // 150 MB
  TIMEOUT_SINGLE_MS: envInt("TIMEOUT_SINGLE_MS", 60_000),
  TIMEOUT_BATCH_BASE_MS: envInt("TIMEOUT_BATCH_BASE_MS", 60_000),
  TIMEOUT_BATCH_PER_FRAME_MS: envInt("TIMEOUT_BATCH_PER_FRAME_MS", 15_000),
  TIMEOUT_SEQUENCE_BASE_MS: envInt("TIMEOUT_SEQUENCE_BASE_MS", 60_000),
  TIMEOUT_SEQUENCE_PER_FRAME_MS: envInt("TIMEOUT_SEQUENCE_PER_FRAME_MS", 5_000),
  MAX_FRAMES_PER_REQUEST: envInt("MAX_FRAMES_PER_REQUEST", 256), // for batch/sequence requests
};

export const NETWORK = {
  ALLOW_HTTP: true,
  BLOCK_PRIVATE_IPS: true,
};
