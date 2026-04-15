import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { PersonaController } from "../controllers/persona.controller.js";
import { cambiarClaveRequestSchema } from "../dto/request/cambiar-clave.request.dto.js";
import { confirmarVerificacionCorreoRequestSchema } from "../dto/request/confirmar-verificacion-correo.request.dto.js";
import { establecerClaveRegistroRequestSchema } from "../dto/request/establecer-clave-registro.request.dto.js";
import { iniciarRegistroRequestSchema } from "../dto/request/iniciar-registro.request.dto.js";
import { loginPersonaLocalRequestSchema } from "../dto/request/login-persona-local.request.dto.js";
import { logoutRequestSchema } from "../dto/request/logout.request.dto.js";
import { refreshTokenRequestSchema } from "../dto/request/refresh-token.request.dto.js";
import { restablecerClaveRequestSchema } from "../dto/request/restablecer-clave.request.dto.js";
import { solicitarRecuperacionClaveRequestSchema } from "../dto/request/solicitar-recuperacion-clave.request.dto.js";
import { verificarRegistroRequestSchema } from "../dto/request/verificar-registro.request.dto.js";
import { authMiddleware } from "../../../../../../shared/security/auth.middleware.js";
import { requirePermissions, requireRoles } from "../../../../../../shared/security/authorization.middleware.js";

export const PersonasRoutes: FastifyPluginAsyncZod = async (app): Promise<void> => {
  const controller = new PersonaController();

  app.get("/api/personas", { preHandler: [authMiddleware] }, controller.getAll);
  app.get("/api/personas/count", controller.count);

  app.post(
    "/api/auth/register/iniciar",
    { schema: { body: iniciarRegistroRequestSchema } },
    controller.iniciarRegistro,
  );

  app.post(
    "/api/auth/register/verificar",
    { schema: { body: verificarRegistroRequestSchema } },
    controller.verificarRegistro,
  );

  app.post(
    "/api/auth/register/establecer-clave",
    { schema: { body: establecerClaveRegistroRequestSchema } },
    controller.establecerClaveRegistro,
  );

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

  app.post("/api/auth/logout-global", { preHandler: [authMiddleware] }, controller.logoutGlobal);
  app.get("/api/auth/me", { preHandler: [authMiddleware] }, controller.me);

  app.get("/api/auth/sessions", { preHandler: [authMiddleware] }, controller.getMySessions);
  app.get(
    "/api/auth/sessions/:idIngreso",
    { preHandler: [authMiddleware] },
    controller.getMySessionDetail,
  );

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

  app.get(
    "/api/admin/test",
    { preHandler: [authMiddleware, requireRoles(["ADMIN"])] },
    async (_request, reply) => reply.status(200).send({ message: "Acceso autorizado por rol ADMIN" }),
  );

  app.get(
    "/api/permisos/test",
    { preHandler: [authMiddleware, requirePermissions(["leer_personas"])] },
    async (_request, reply) => reply.status(200).send({ message: "Acceso autorizado por permiso" }),
  );
};
