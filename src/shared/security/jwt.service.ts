import { createSecretKey } from "node:crypto";

import { jwtVerify, SignJWT } from "jose";

import {
  DecodedAccessToken,
  JwtAccessPayload,
  JwtService,
} from "../../core/domain/services/jwt.service.js";
import { jwtConfig } from "../config/database.config.js";

function getExpirationDate(expiresIn: string): Date {
  const now = new Date();

  const match = /^(\d+)([mhd])$/.exec(expiresIn);
  if (!match) {
    throw new Error(`Formato invalido de expiracion: ${expiresIn}`);
  }

  const value = Number(match[1]);
  const unit = match[2];

  if (unit === "m") now.setMinutes(now.getMinutes() + value);
  if (unit === "h") now.setHours(now.getHours() + value);
  if (unit === "d") now.setDate(now.getDate() + value);

  return now;
}

export class JoseJwtService implements JwtService {
  private readonly secretKey = createSecretKey(Buffer.from(jwtConfig.accessSecret, "utf-8"));

  async generateAccessToken(payload: JwtAccessPayload): Promise<{ token: string; expiresAt: Date }> {
    const expiresAt = getExpirationDate(jwtConfig.accessExpiresIn);

    const token = await new SignJWT({
      authId: payload.authId,
      identificador: payload.identificador,
      tipoIdentificador: payload.tipoIdentificador,
      correo: payload.correo,
      roles: payload.roles,
      permisos: payload.permisos,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setSubject(payload.sub)
      .setIssuer(jwtConfig.issuer)
      .setIssuedAt()
      .setExpirationTime(jwtConfig.accessExpiresIn)
      .sign(this.secretKey);

    return { token, expiresAt };
  }

  async verifyAccessToken(token: string): Promise<DecodedAccessToken> {
    const { payload } = await jwtVerify(token, this.secretKey, { issuer: jwtConfig.issuer });

    return {
      sub: String(payload.sub),
      authId: String(payload.authId),
      identificador: String(payload.identificador),
      tipoIdentificador:
        payload.tipoIdentificador === "celular" ? "celular" : "correo",
      correo: typeof payload.correo === "string" ? payload.correo : null,
      roles: Array.isArray(payload.roles) ? payload.roles.map(String) : [],
      permisos: Array.isArray(payload.permisos) ? payload.permisos.map(String) : [],
      iss: String(payload.iss),
      iat: payload.iat,
      exp: payload.exp,
    };
  }
}
