import { z } from "zod";

import {
  createRegistroSchema,
  exportRegistrosSchema,
  presignRegistroFotosSchema,
  registroQuerySchema,
  transcreverAudioSchema,
  updateRegistroSchema,
} from "@/dtos/registro.dto";
import { ValidationError } from "@/dtos/errors";
import { fail, ok } from "@/lib/http";
import type { RequestContext } from "@/middleware/api";
import { RegistroService } from "@/services/registro.service";

const pathSchema = z.object({ id: z.string().cuid() });
const photoPathSchema = z.object({ id: z.string().cuid(), fotoId: z.string().cuid() });

function filesFromForm(formData: FormData) {
  return formData
    .getAll("fotos")
    .filter((item): item is File => item instanceof File && item.size > 0);
}

function parseStringArray(value: FormDataEntryValue | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    throw new ValidationError("Lista de imagens removidas invalida.");
  }
}

export class RegistroController {
  private readonly service = new RegistroService();

  list = async (request: Request, context: RequestContext) => {
    try {
      const query = registroQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
      return ok(await this.service.list(context.userId!, query));
    } catch (error) {
      return fail(error);
    }
  };

  find = async (_request: Request, context: RequestContext, params: { id: string }) => {
    try {
      const { id } = pathSchema.parse(params);
      return ok(await this.service.find(context.userId!, id));
    } catch (error) {
      return fail(error);
    }
  };

  create = async (request: Request, context: RequestContext) => {
    try {
      const contentType = request.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const payload = createRegistroSchema.parse(await request.json());
        return ok(await this.service.create(context.userId!, payload, []), 201);
      }

      const formData = await request.formData();
      const payload = createRegistroSchema.parse({
        alunoId: String(formData.get("alunoId") ?? ""),
        texto: String(formData.get("texto") ?? ""),
        dataRegistro: String(formData.get("dataRegistro") ?? new Date().toISOString().slice(0, 10)),
        clientMutationId: formData.get("clientMutationId")
          ? String(formData.get("clientMutationId"))
          : undefined,
      });

      return ok(await this.service.create(context.userId!, payload, filesFromForm(formData)), 201);
    } catch (error) {
      return fail(error);
    }
  };

  update = async (request: Request, context: RequestContext, params: { id: string }) => {
    try {
      const { id } = pathSchema.parse(params);
      const contentType = request.headers.get("content-type") ?? "";

      if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        const payload = updateRegistroSchema.parse({
          alunoId: formData.get("alunoId") ? String(formData.get("alunoId")) : undefined,
          texto: formData.get("texto") ? String(formData.get("texto")) : undefined,
          dataRegistro: formData.get("dataRegistro") ? String(formData.get("dataRegistro")) : undefined,
          removeFotoIds: parseStringArray(formData.get("removeFotoIds")),
          expectedUpdatedAt: formData.get("expectedUpdatedAt") ? String(formData.get("expectedUpdatedAt")) : undefined,
        });
        return ok(await this.service.update(context.userId!, id, payload, filesFromForm(formData)));
      }

      const payload = updateRegistroSchema.parse(await request.json());
      return ok(await this.service.update(context.userId!, id, payload, []));
    } catch (error) {
      return fail(error);
    }
  };

  remove = async (_request: Request, context: RequestContext, params: { id: string }) => {
    try {
      const { id } = pathSchema.parse(params);
      return ok(await this.service.remove(context.userId!, id));
    } catch (error) {
      return fail(error);
    }
  };

  restore = async (_request: Request, context: RequestContext, params: { id: string }) => {
    try {
      const { id } = pathSchema.parse(params);
      return ok(await this.service.restore(context.userId!, id));
    } catch (error) {
      return fail(error);
    }
  };

  presignPhotos = async (request: Request, context: RequestContext, params: { id: string }) => {
    try {
      const { id } = pathSchema.parse(params);
      const input = presignRegistroFotosSchema.parse(await request.json());
      return ok({ uploads: await this.service.presignPhotoUploads(context.userId!, id, input) }, 201);
    } catch (error) {
      return fail(error);
    }
  };

  confirmPhoto = async (_request: Request, context: RequestContext, params: { id: string; fotoId: string }) => {
    try {
      const { id, fotoId } = photoPathSchema.parse(params);
      return ok({ registro: await this.service.confirmPhotoUpload(context.userId!, id, fotoId) });
    } catch (error) {
      return fail(error);
    }
  };

  cancelPhoto = async (_request: Request, context: RequestContext, params: { id: string; fotoId: string }) => {
    try {
      const { id, fotoId } = photoPathSchema.parse(params);
      return ok(await this.service.cancelPhotoUpload(context.userId!, id, fotoId));
    } catch (error) {
      return fail(error);
    }
  };

  exportWord = async (request: Request, context: RequestContext) => {
    try {
      const input = exportRegistrosSchema.parse(await request.json());
      if (input.delivery === "url") {
        return ok(await this.service.exportWordToUrl(context.userId!, input), 201);
      }
      const result = await this.service.exportWord(context.userId!, input);
      return new Response(new Uint8Array(result.bytes), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${result.fileName}"`,
          "X-Exported-Records": String(result.count),
          "Cache-Control": "private, no-store",
        },
      });
    } catch (error) {
      return fail(error);
    }
  };

  transcribe = async (request: Request, context: RequestContext) => {
    void context;
    try {
      const formData = await request.formData();
      const audio = formData.get("audio");
      if (!(audio instanceof File)) throw new ValidationError("Envie um arquivo de audio.");
      const options = transcreverAudioSchema.parse({ language: formData.get("language") || "pt" });
      return ok(await this.service.transcribeAudio(audio, options.language));
    } catch (error) {
      return fail(error);
    }
  };
}
