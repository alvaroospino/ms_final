import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { PersonaController } from "@/modules/seguridad/infrastructure/interface/http/controllers/persona.controller.js";
import { loginPersonaLocalRequestSchema } from "@/modules/seguridad/infrastructure/interface/http/dto/request/login-persona-local.request.dto.js";
import { registerPersonaLocalRequestSchema } from "@/modules/seguridad/infrastructure/interface/http/dto/request/register-persona-local.request.dto.js";
import { refreshTokenRequestSchema } from "@/modules/seguridad/infrastructure/interface/http/dto/request/refresh-token.request.dto.js";
import { logoutRequestSchema } from "@/modules/seguridad/infrastructure/interface/http/dto/request/logout.request.dto.js";
import { confirmarVerificacionCorreoRequestSchema } from "@/modules/seguridad/infrastructure/interface/http/dto/request/confirmar-verificacion-correo.request.dto.js";
import { solicitarRecuperacionClaveRequestSchema } from "@/modules/seguridad/infrastructure/interface/http/dto/request/solicitar-recuperacion-clave.request.dto.js";
import { restablecerClaveRequestSchema } from "@/modules/seguridad/infrastructure/interface/http/dto/request/restablecer-clave.request.dto.js";
import { cambiarClaveRequestSchema } from "@/modules/seguridad/infrastructure/interface/http/dto/request/cambiar-clave.request.dto.js";
import { authMiddleware } from "@/shared/security/auth.middleware.js";
import { requireRoles, requirePermissions } from "@/shared/security/authorization.middleware.js";

export const PersonasRoutes: FastifyPluginAsyncZod = async (app): Promise<void> => {
  const controller = new PersonaController();

  // ─── Personas ──────────────────────────────────────────────────────────────
  app.get(
    "/api/personas",
    { preHandler: [authMiddleware] },
    controller.getAll,
  );

  app.get("/api/personas/count", controller.count);

  app.post(
    "/api/personas/register-local",
    { schema: { body: registerPersonaLocalRequestSchema } },
    controller.registerLocal,
  );

  // ─── Autenticación ─────────────────────────────────────────────────────────
  app.post(
    "/api/auth/login-local",
    { schema: { body: loginPersonaLocalRequestSchema } },
    controller.loginLocal,
  );

  app.post(
    "/api/auth/refresh",
    { schema: { body: refreshTokenRequestSchema } },
    controller.refreshToken,
  );

  app.post(
    "/api/auth/logout",
    { schema: { body: logoutRequestSchema } },
    controller.logout,
  );

  app.post(
    "/api/auth/logout-global",
    { preHandler: [authMiddleware] },
    controller.logoutGlobal,
  );

  app.get(
    "/api/auth/me",
    { preHandler: [authMiddleware] },
    controller.me,
  );

  // ─── Sesiones ──────────────────────────────────────────────────────────────
  app.get(
    "/api/auth/sessions",
    { preHandler: [authMiddleware] },
    controller.getMySessions,
  );

  app.get(
    "/api/auth/sessions/:idIngreso",
    { preHandler: [authMiddleware] },
    controller.getMySessionDetail,
  );

  // ─── Verificación de correo ────────────────────────────────────────────────
  app.post(
    "/api/auth/verificar-correo/enviar",
    { preHandler: [authMiddleware] },
    controller.enviarVerificacionCorreo,
  );

  app.post(
    "/api/auth/verificar-correo/confirmar",
    {
      preHandler: [authMiddleware],
      schema: { body: confirmarVerificacionCorreoRequestSchema },
    },
    controller.confirmarVerificacionCorreo,
  );

  // ─── Recuperación de contraseña ────────────────────────────────────────────
  app.post(
    "/api/auth/recuperar-clave",
    { schema: { body: solicitarRecuperacionClaveRequestSchema } },
    controller.solicitarRecuperacionClave,
  );

  app.post(
    "/api/auth/restablecer-clave",
    { schema: { body: restablecerClaveRequestSchema } },
    controller.restablecerClave,
  );

  app.post(
    "/api/auth/cambiar-clave",
    {
      preHandler: [authMiddleware],
      schema: { body: cambiarClaveRequestSchema },
    },
    controller.cambiarClave,
  );

  // ─── Rutas de prueba de autorización ──────────────────────────────────────
  app.get(
    "/api/admin/test",
    { preHandler: [authMiddleware, requireRoles(["ADMIN"])] },
    async (_request, reply) =>
      reply.status(200).send({ message: "Acceso autorizado por rol ADMIN" }),
  );

  app.get(
    "/api/permisos/test",
    { preHandler: [authMiddleware, requirePermissions(["leer_personas"])] },
    async (_request, reply) =>
      reply.status(200).send({ message: "Acceso autorizado por permiso" }),
  );
};
