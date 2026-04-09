import { FastifyReply, FastifyRequest } from "fastify";
import { ForbiddenError } from "@/core/application/use-cases/errors/auth-errors.js";

export function requireRoles(requiredRoles: string[]) {
  return async function (request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    const user = request.user;

    if (!user) {
      throw new ForbiddenError("Usuario no autenticado");
    }

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));

    if (!hasRole) {
      throw new ForbiddenError("No tienes el rol necesario para acceder a este recurso");
    }
  };
}

export function requirePermissions(requiredPermissions: string[]) {
  return async function (request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    const user = request.user;

    if (!user) {
      throw new ForbiddenError("Usuario no autenticado");
    }

    const hasPermission = requiredPermissions.every((permission) =>
      user.permisos.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenError("No tienes los permisos necesarios para acceder a este recurso");
    }
  };
}
