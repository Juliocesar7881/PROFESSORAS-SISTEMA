import { randomUUID } from "node:crypto";

import { config } from "dotenv";
import sharp from "sharp";

async function main() {
  config({ path: ".env.local" });
  const testStartedAt = new Date();
  const deviceName = `record-photo-integration-${randomUUID()}`;
  const [
    { env },
    { prisma },
    { supabaseAdmin },
    { createMobileLoginCode, exchangeMobileLoginCode },
    { RegistroService },
    canonicalConfirmRoute,
    compatibilityConfirmRoute,
  ] = await Promise.all([
    import("@/lib/env"),
    import("@/lib/prisma"),
    import("@/lib/supabase-admin"),
    import("@/lib/mobile-auth"),
    import("@/services/registro.service"),
    import("@/app/api/registros/[id]/fotos/[fotoId]/confirmar/route"),
    import("@/app/api/registros/[id]/fotos/[fotoId]/route"),
  ]);
  const service = new RegistroService();
  const aluno = await prisma.aluno.findFirst({
    where: { deletedAt: null },
    select: { id: true, userId: true },
  });
  if (!aluno) throw new Error("Nenhuma crianca ativa para o teste integrado.");

  const clientMutationId = `integration-${randomUUID()}`;
  let recordId = "";
  let mobileSessionId = "";
  try {
    const loginCode = await createMobileLoginCode(aluno.userId);
    const mobileSession = await exchangeMobileLoginCode(loginCode, deviceName);
    mobileSessionId = (await prisma.mobileSession.findFirstOrThrow({
      where: { userId: aluno.userId, deviceName },
      select: { id: true },
    })).id;

    const input = {
      alunoId: aluno.id,
      texto: "Registro temporario de validacao do upload resiliente.",
      dataRegistro: new Date(),
      clientMutationId,
    };
    const created = await service.create(aluno.userId, input, []);
    recordId = created.registro.id;
    const duplicate = await service.create(aluno.userId, input, []);
    if (!duplicate.duplicated || duplicate.registro.id !== recordId) {
      throw new Error("A idempotencia do registro falhou.");
    }

    for (let index = 0; index < 6; index += 1) {
      const buffer = await sharp({
        create: {
          width: 1440,
          height: 1080,
          channels: 3,
          background: { r: 80 + index * 10, g: 120, b: 160 },
        },
      }).jpeg({ quality: 82 }).toBuffer();
      const [reservation] = await service.presignPhotoUploads(aluno.userId, recordId, {
        uploads: [{
          clientUploadId: `integration_${index}_${randomUUID()}`,
          mimeType: "image/jpeg",
          tamanhoBytes: buffer.length,
          ordem: index,
        }],
      });
      if (!reservation.signedUrl) throw new Error(`URL assinada ausente para a foto ${index + 1}.`);

      const uploaded = await fetch(reservation.signedUrl, {
        method: "PUT",
        headers: {
          "x-upsert": "true",
          "content-type": "image/jpeg",
          "cache-control": "max-age=3600",
        },
        body: new Uint8Array(buffer),
      });
      if (!uploaded.ok) throw new Error(`Upload direto falhou com HTTP ${uploaded.status}.`);

      const routeModule = index === 0 ? compatibilityConfirmRoute : canonicalConfirmRoute;
      const confirmation = await routeModule.POST(
        new Request(`http://localhost/api/registros/${recordId}/fotos/${reservation.photoId}${index === 0 ? "" : "/confirmar"}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${mobileSession.token}` },
        }),
        { params: Promise.resolve({ id: recordId, fotoId: reservation.photoId }) },
      );
      if (!confirmation.ok) {
        const payload = await confirmation.text();
        throw new Error(`Confirmacao HTTP falhou com ${confirmation.status}: ${payload.slice(0, 500)}`);
      }
    }

    const verified = await prisma.observacao.findUniqueOrThrow({
      where: { id: recordId },
      include: { fotos: { where: { deletedAt: null } } },
    });
    if (verified.fotos.length !== 6 || verified.fotos.some((photo) => photo.status !== "PRONTA")) {
      throw new Error(`Estado inesperado: ${verified.fotos.length} fotos prontas.`);
    }

    let limitRejected = false;
    try {
      await service.presignPhotoUploads(aluno.userId, recordId, {
        uploads: [{
          clientUploadId: `integration_extra_${randomUUID()}`,
          mimeType: "image/jpeg",
          tamanhoBytes: 1024,
          ordem: 5,
        }],
      });
    } catch {
      limitRejected = true;
    }
    if (!limitRejected) throw new Error("A setima foto nao foi rejeitada.");

    const word = await service.exportWordToUrl(aluno.userId, { ids: [recordId], delivery: "url" });
    const downloaded = await fetch(word.downloadUrl);
    if (!downloaded.ok || (await downloaded.arrayBuffer()).byteLength === 0) {
      throw new Error("O download Word temporario falhou.");
    }

    console.log(JSON.stringify({
      recordCreatedFirst: true,
      duplicatePrevented: true,
      directPhotosReady: verified.fotos.length,
      canonicalConfirmRoute: true,
      compatibilityConfirmRoute: true,
      seventhRejected: true,
      wordUrlStatus: downloaded.status,
    }));
  } finally {
    if (recordId) {
      const photos = await prisma.fotoObservacao.findMany({
        where: { observacaoId: recordId },
        select: { storageKey: true },
      });
      if (photos.length) {
        await supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET).remove(photos.map((photo) => photo.storageKey));
      }
      await prisma.observacao.deleteMany({ where: { id: recordId } });
    }
    if (mobileSessionId) await prisma.mobileSession.deleteMany({ where: { id: mobileSessionId } });
    await prisma.mobileLoginCode.deleteMany({
      where: { userId: aluno.userId, createdAt: { gte: testStartedAt }, usedAt: { not: null } },
    });
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
