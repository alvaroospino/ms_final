import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

import { AccessControlController } from "../controllers/access-control.controller.js";
import { assignPermissionToRoleRequestSchema } from "../dto/request/assign-permission-to-role.request.dto.js";
import { assignRoleToPersonaRequestSchema } from "../dto/request/assign-role-to-persona.request.dto.js";
import { createPermissionRequestSchema } from "../dto/request/create-permission.request.dto.js";
import { createRoleRequestSchema } from "../dto/request/create-role.request.dto.js";
import { authMiddleware } from "../../../../../../shared/security/auth.middleware.js";
import { requireRoles } from "../../../../../../shared/security/authorization.middleware.js";

const personaParamsSchema = z.object({
  idPersona: z.string().min(1),
});

const personaRoleParamsSchema = z.object({
  idPersona: z.string().min(1),
  idRol: z.string().min(1),
});

const roleParamsSchema = z.object({
  idRol: z.string().min(1),
});

const rolePermissionParamsSchema = z.object({
  idRol: z.string().min(1),
  idPermiso: z.string().min(1),
});

export const AccessControlRoutes: FastifyPluginAsyncZod = async (app): Promise<void> => {
  const controller = new AccessControlController();

  app.get(
    "/api/roles",
    { preHandler: [authMiddleware, requireRoles(["ADMIN"])] },
    controller.getAllRoles,
  );

  app.post(
    "/api/roles",
    {
      preHandler: [authMiddleware, requireRoles(["ADMIN"])],
      schema: { body: createRoleRequestSchema },
    },
    controller.createRole,
  );

  app.get(
    "/api/permisos",
    { preHandler: [authMiddleware, requireRoles(["ADMIN"])] },
    controller.getAllPermissions,
  );

  app.post(
    "/api/permisos",
    {
      preHandler: [authMiddleware, requireRoles(["ADMIN"])],
      schema: { body: createPermissionRequestSchema },
    },
    controller.createPermission,
  );

  app.get(
    "/api/personas/:idPersona/roles",
    {
      preHandler: [authMiddleware, requireRoles(["ADMIN"])],
      schema: { params: personaParamsSchema },
    },
    controller.getPersonaRoles,
  );

  app.post(
    "/api/personas/:idPersona/roles",
    {
      preHandler: [authMiddleware, requireRoles(["ADMIN"])],
      schema: {
        params: personaParamsSchema,
        body: assignRoleToPersonaRequestSchema,
      },
    },
    controller.assignRoleToPersona,
  );

  app.delete(
    "/api/personas/:idPersona/roles/:idRol",
    {
      preHandler: [authMiddleware, requireRoles(["ADMIN"])],
      schema: { params: personaRoleParamsSchema },
    },
    controller.removeRoleFromPersona,
  );

  app.get(
    "/api/roles/:idRol/permisos",
    {
      preHandler: [authMiddleware, requireRoles(["ADMIN"])],
      schema: { params: roleParamsSchema },
    },
    controller.getRolePermissions,
  );

  app.post(
    "/api/roles/:idRol/permisos",
    {
      preHandler: [authMiddleware, requireRoles(["ADMIN"])],
      schema: {
        params: roleParamsSchema,
        body: assignPermissionToRoleRequestSchema,
      },
    },
    controller.assignPermissionToRole,
  );

  app.delete(
    "/api/roles/:idRol/permisos/:idPermiso",
    {
      preHandler: [authMiddleware, requireRoles(["ADMIN"])],
      schema: { params: rolePermissionParamsSchema },
    },
    controller.removePermissionFromRole,
  );
};
