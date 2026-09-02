const isProduction = process.env.NODE_ENV === "production";
const groqKey = process.env.GROQ_API_KEY ?? "";
const openAIKey = process.env.OPENAI_API_KEY ?? "";

export type ModelProvider = "groq" | "openai";

function provider(value: string | undefined, fallback: ModelProvider): ModelProvider {
  if (!value) return fallback;
  if (value === "groq" || value === "openai") return value;
  throw new Error(`Unsupported model provider: ${value}`);
}

const defaultProvider: ModelProvider = groqKey ? "groq" : "openai";
const aiProvider = provider(process.env.CLIO_AI_PROVIDER, defaultProvider);
const voiceProvider = provider(process.env.CLIO_VOICE_PROVIDER, aiProvider);

function csv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

export const config = {
  isProduction,
  port: Number(process.env.PORT ?? 3000),
  allowedOrigins: csv(process.env.CLIO_ALLOWED_ORIGINS),
  jwtSecret: process.env.CLIO_JWT_SECRET ?? "",
  enrollmentCode: process.env.CLIO_DEVICE_ENROLLMENT_CODE ?? "",
  groqKey,
  openAIKey,
  aiProvider,
  voiceProvider,
  aiModel: process.env.CLIO_AI_MODEL ?? (
    aiProvider === "groq" ? "openai/gpt-oss-20b" : "gpt-5.6-luna"
  ),
  transcriptionModel: process.env.CLIO_TRANSCRIPTION_MODEL ?? (
    voiceProvider === "groq" ? "whisper-large-v3-turbo" : "gpt-4o-transcribe"
  ),
  ttsModel: process.env.CLIO_TTS_MODEL ?? (
    voiceProvider === "groq" ? "canopylabs/orpheus-v1-english" : "gpt-4o-mini-tts"
  ),
  ttsVoice: process.env.CLIO_TTS_VOICE ?? (voiceProvider === "groq" ? "hannah" : "coral"),
};

export function providerKey(modelProvider: ModelProvider) {
  return modelProvider === "groq" ? config.groqKey : config.openAIKey;
}

export function providerBaseUrl(modelProvider: ModelProvider) {
  return modelProvider === "groq" ? "https://api.groq.com/openai/v1" : undefined;
}

export function assertServerConfig() {
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  if (config.jwtSecret.length < 32) {
    throw new Error("CLIO_JWT_SECRET must contain at least 32 characters.");
  }

  if (config.enrollmentCode.length < 8) {
    throw new Error("CLIO_DEVICE_ENROLLMENT_CODE must contain at least 8 characters.");
  }

  if (config.isProduction && config.allowedOrigins.length === 0) {
    throw new Error("CLIO_ALLOWED_ORIGINS is required in production.");
  }
}
