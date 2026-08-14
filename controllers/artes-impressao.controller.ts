import { z } from "zod";

import {
  artesImpressaoExportSchema,
  artesImpressaoFotosQuerySchema,
} from "@/dtos/artes-impressao.dto";
import { ValidationError } from "@/dtos/errors";
import { fail, ok } from "@/lib/http";
import type { RequestContext } from "@/middleware/api";
import { ArtesImpressaoService } from "@/services/artes-impressao.service";

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "true" || value === "on" || value === "1";
}

function parseJsonField(value: FormDataEntryValue | null, fieldName: string) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    throw new ValidationError(`Campo ${fieldName} invalido`);
  }
}

export class ArtesImpressaoController {
  private readonly artesService = new ArtesImpressaoService();

  listPhotos = async (request: Request, context: RequestContext) => {
    try {
      const query = artesImpressaoFotosQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
      const fotos = await this.artesService.listPhotos(context.userId!, query);
      return ok(fotos);
    } catch (error) {
      return fail(error);
    }
  };

  exportPdf = async (request: Request, context: RequestContext) => {
    try {
      const formData = await request.formData();
      const uploadIds = formData.getAll("uploadIds").map((value) => String(value));
      const uploads = formData
        .getAll("uploads")
        .filter((item): item is File => item instanceof File && item.size > 0);

      if (uploadIds.length !== uploads.length) {
        throw new ValidationError("A lista de fotos temporarias esta inconsistente.");
      }

      const payload = artesImpressaoExportSchema.parse({
        preset: String(formData.get("preset") ?? ""),
        items: parseJsonField(formData.get("items"), "items"),
        uploadMeta: parseJsonField(formData.get("uploadMeta"), "uploadMeta") ?? [],
        titulo: String(formData.get("titulo") ?? ""),
        legenda: String(formData.get("legenda") ?? ""),
        nomeEscola: String(formData.get("nomeEscola") ?? ""),
        nomeProfessora: String(formData.get("nomeProfessora") ?? ""),
        dataLabel: String(formData.get("dataLabel") ?? ""),
        includeAlunoName: parseBoolean(formData.get("includeAlunoName")),
        includeTurmaName: parseBoolean(formData.get("includeTurmaName")),
        includeDate: parseBoolean(formData.get("includeDate")),
      });

      const result = await this.artesService.exportPdf(
        context.userId!,
        payload,
        uploads.map((file, index) => ({
          id: z.string().trim().min(1).parse(uploadIds[index]),
          file,
        })),
      );

      return new Response(Buffer.from(result.bytes), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=\"${result.fileName}\"`,
          "Cache-Control": "private, no-store, max-age=0",
        },
      });
    } catch (error) {
      return fail(error);
    }
  };
}
