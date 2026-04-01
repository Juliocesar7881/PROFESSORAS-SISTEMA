const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const URL_REGEX = /https?:\/\/[^\s]+/gi;
const LONG_NUMBER_REGEX = /\b\d{6,}\b/g;

function sanitizeString(input: string) {
  return input.replace(EMAIL_REGEX, "[email]").replace(URL_REGEX, "[url]").replace(LONG_NUMBER_REGEX, "[redacted]");
}

export function sanitizeUnknown(value: unknown): unknown {
  if (typeof value === "string") {
    return sanitizeString(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeUnknown(item));
  }

  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};

    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      if (["nome", "name", "foto", "photo", "image", "avatar", "aluno"].includes(key.toLowerCase())) {
        output[key] = "[redacted]";
      } else {
        output[key] = sanitizeUnknown(item);
      }
    });

    return output;
  }

  return value;
}
