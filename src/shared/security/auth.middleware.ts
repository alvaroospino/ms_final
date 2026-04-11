import { FastifyReply, FastifyRequest } from "fastify";

import { InvalidTokenError } from "@/core/application/use-cases/errors/auth-errors.js";
import { JoseJwtService } from "@/shared/security/jwt.service.js";

const jwtService = new JoseJwtService();

export async function authMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new InvalidTokenError("Token requerido");
  }

  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) {
    throw new InvalidTokenError("Formato de token invalido");
  }

  try {
    const payload = await jwtService.verifyAccessToken(token);

    request.user = {
      sub: payload.sub,
      authId: payload.authId,
      identificador: payload.identificador,
      tipoIdentificador: payload.tipoIdentificador,
      correo: payload.correo,
      roles: payload.roles,
      permisos: payload.permisos,
    };
  } catch {
    throw new InvalidTokenError("Token invalido o expirado");
  }
}
