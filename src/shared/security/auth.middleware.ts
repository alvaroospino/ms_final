import { FastifyReply, FastifyRequest } from "fastify";

import { InvalidTokenError } from "../../core/application/use-cases/errors/auth-errors.js";
import { JoseJwtService } from "./jwt.service.js";

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
      uuidAcceso: payload.uuidAcceso,
      identificador: payload.identificador,
      tipoIdentificador: payload.tipoIdentificador,
      correo: payload.correo,
      nombres: payload.nombres,
      apellidos: payload.apellidos,
      nombreCompleto: payload.nombreCompleto,
      estado: payload.estado,
      activa: payload.activa,
      esEmpresa: payload.esEmpresa,
      roles: payload.roles,
      permisos: payload.permisos,
      expiraEn: payload.expiraEn,
    };
  } catch {
    throw new InvalidTokenError("Token invalido o expirado");
  }
}
