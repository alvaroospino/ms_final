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
      uuidAcceso: payload.authId,
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
      expiraEn: expiresAt.getTime(),
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
      uuidAcceso: String(payload.uuidAcceso ?? payload.authId),
      identificador: String(payload.identificador),
      tipoIdentificador:
        payload.tipoIdentificador === "celular" ? "celular" : "correo",
      correo: typeof payload.correo === "string" ? payload.correo : null,
      nombres: typeof payload.nombres === "string" ? payload.nombres : null,
      apellidos: typeof payload.apellidos === "string" ? payload.apellidos : null,
      nombreCompleto:
        typeof payload.nombreCompleto === "string" ? payload.nombreCompleto : null,
      estado: typeof payload.estado === "number" ? payload.estado : 0,
      activa: payload.activa === true,
      esEmpresa: payload.esEmpresa === true,
      roles: Array.isArray(payload.roles) ? payload.roles.map(String) : [],
      permisos: Array.isArray(payload.permisos) ? payload.permisos.map(String) : [],
      expiraEn: typeof payload.expiraEn === "number" ? payload.expiraEn : undefined,
      iss: String(payload.iss),
      iat: payload.iat,
      exp: payload.exp,
    };
  }
}
