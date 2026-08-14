import { env } from "@/lib/env";

type GoogleAiPart = {
  inlineData?: { data: string; mimeType: string };
  text?: string;
  thought?: boolean;
};

type GoogleAiResponse = {
  candidates?: Array<{ content?: { parts?: GoogleAiPart[] } }>;
};

type GenerateGoogleTextInput = {
  maxOutputTokens: number;
  models?: string[];
  prompt: string;
  system?: string;
  temperature: number;
};

type GenerateGoogleJsonInput<T> = GenerateGoogleTextInput & {
  file?: {
    data: Buffer;
    mimeType: string;
  };
  jsonSchema: unknown;
  parse: (value: unknown) => T;
};

const TEXT_MODELS = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
const AUDIO_MODELS = ["gemini-3.1-flash-lite", "gemini-3.5-flash"];

function extractText(body: GoogleAiResponse) {
  return (body.candidates?.[0]?.content?.parts ?? [])
    .filter((part) => !part.thought)
    .map((part) => part.text ?? "")
    .join("")
    .replace(/^```(?:text|markdown)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

async function generateContent(input: {
  maxOutputTokens: number;
  models: string[];
  parse?: (value: string) => unknown;
  parts: GoogleAiPart[];
  responseJsonSchema?: unknown;
  system?: string;
  temperature: number;
}) {
  if (!env.GEMINI_API_KEY) return null;

  for (const model of input.models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            systemInstruction: input.system ? { parts: [{ text: input.system }] } : undefined,
            contents: [{ role: "user", parts: input.parts }],
            generationConfig: {
              temperature: input.temperature,
              maxOutputTokens: input.maxOutputTokens,
              responseMimeType: input.responseJsonSchema ? "application/json" : undefined,
              responseJsonSchema: input.responseJsonSchema,
            },
          }),
          signal: AbortSignal.timeout(65_000),
        },
      );
      const body = await response.json() as GoogleAiResponse;
      if (!response.ok) {
        console.warn(`[google-ai] modelo ${model} respondeu HTTP ${response.status}`);
        continue;
      }

      const text = extractText(body);
      if (!text) continue;

      try {
        const parsed = input.parse?.(text);
        return { text, parsed, model: `google/${model}` };
      } catch (error) {
        console.warn(
          `[google-ai] modelo ${model} retornou uma resposta invalida`,
          error instanceof Error ? error.message : "erro desconhecido",
        );
      }
    } catch (error) {
      console.warn(
        `[google-ai] modelo ${model} indisponivel`,
        error instanceof Error ? error.message : "erro desconhecido",
      );
    }
  }

  return null;
}

export function generateGoogleText(input: GenerateGoogleTextInput) {
  return generateContent({
    ...input,
    models: input.models ?? TEXT_MODELS,
    parts: [{ text: input.prompt }],
  });
}

export async function generateGoogleJson<T>(input: GenerateGoogleJsonInput<T>) {
  const result = await generateContent({
    models: input.models ?? TEXT_MODELS,
    parts: [
      { text: input.prompt },
      ...(input.file
        ? [{
            inlineData: {
              data: input.file.data.toString("base64"),
              mimeType: input.file.mimeType,
            },
          }]
        : []),
    ],
    system: input.system,
    temperature: input.temperature,
    maxOutputTokens: input.maxOutputTokens,
    responseJsonSchema: input.jsonSchema,
    parse: (text) => input.parse(JSON.parse(text)),
  });

  if (!result || result.parsed === undefined) return null;
  return { data: result.parsed as T, model: result.model };
}

export function transcribeGoogleAudio(input: {
  audio: Buffer;
  language: string;
  mimeType: string;
}) {
  const language = input.language.toLowerCase().startsWith("pt") ? "portugues do Brasil" : input.language;
  return generateContent({
    models: AUDIO_MODELS,
    parts: [
      {
        text: [
          `Transcreva integralmente a fala deste audio em ${language}.`,
          "Preserve nomes proprios e a ordem das ideias. Corrija apenas pontuacao e concordancia obvias.",
          "Nao resuma, nao comente e nao acrescente informacoes. Responda somente com a transcricao.",
        ].join(" "),
      },
      {
        inlineData: {
          data: input.audio.toString("base64"),
          mimeType: input.mimeType,
        },
      },
    ],
    temperature: 0,
    maxOutputTokens: 4096,
  });
}
