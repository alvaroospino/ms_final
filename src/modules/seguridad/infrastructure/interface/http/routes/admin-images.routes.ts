import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

import { appImageConfig } from "../../../../../../shared/config/database.config.js";
import { appImageService } from "../../../../../../shared/assets/app-image.service.js";
import { buildSuccessResponse } from "../../../../../../shared/http/api-response.js";
import { authMiddleware } from "../../../../../../shared/security/auth.middleware.js";
import { requireRoles } from "../../../../../../shared/security/authorization.middleware.js";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const tipoParamSchema = z.object({
  tipo: z.enum(["persona", "empresa"]),
});

export const AdminImagesRoutes: FastifyPluginAsyncZod = async (app): Promise<void> => {
  app.put(
    "/api/admin/imagen-defecto/:tipo",
    {
      preHandler: [authMiddleware, requireRoles(["ADMIN"])],
      schema: { params: tipoParamSchema },
    },
    async (request, reply) => {
      const { tipo } = request.params;

      const file = await request.file({ limits: { fileSize: MAX_FILE_SIZE_BYTES } });

      if (!file) {
        return reply.status(400).send({
          error: "BadRequest",
          message: "Se requiere un archivo de imagen en el campo 'imagen'",
        });
      }

      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        await file.toBuffer();
        return reply.status(400).send({
          error: "BadRequest",
          message: "Tipo de archivo no permitido. Use JPG, PNG, SVG o WebP",
        });
      }

      let buffer: Buffer;
      try {
        buffer = await file.toBuffer();
      } catch {
        return reply.status(400).send({
          error: "BadRequest",
          message: `El archivo supera el tamaño máximo de ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`,
        });
      }

      const esEmpresa = tipo === "empresa";
      const fileName = esEmpresa
        ? appImageConfig.defaultEmpresaImageName
        : appImageConfig.defaultPersonaImageName;

      const filePath = resolve(process.cwd(), appImageConfig.baseDir, fileName);

      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, buffer);

      appImageService.invalidateDefaultImage(esEmpresa);

      return reply.status(200).send(
        buildSuccessResponse(200, "Imagen predeterminada actualizada correctamente", {
          tipo,
          fileName,
          tamanoBytes: buffer.byteLength,
          mimeType: file.mimetype,
        }),
      );
    },
  );
};
