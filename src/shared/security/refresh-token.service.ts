import { createHash, createSecretKey } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";

import {
  DecodedRefreshToken,
  RefreshTokenPayload,
  RefreshTokenService,
} from "@/core/domain/services/refresh-token.service.js";
import { jwtConfig } from "@/shared/config/database.config.js";

function getExpirationDate(expiresIn: string): Date {
  const now = new Date();

  const match = /^(\d+)([mhd])$/.exec(expiresIn);
  if (!match) {
    throw new Error(`Formato inválido de expiración: ${expiresIn}`);
  }

  const value = Number(match[1]);
  const unit = match[2];

  if (unit === "m") now.setMinutes(now.getMinutes() + value);
  if (unit === "h") now.setHours(now.getHours() + value);
  if (unit === "d") now.setDate(now.getDate() + value);

  return now;
}

export class JwtRefreshTokenService implements RefreshTokenService {
  private readonly secretKey = createSecretKey(
    Buffer.from(jwtConfig.refreshSecret, "utf-8"),
  );

  async generateRefreshToken(payload: RefreshTokenPayload): Promise<{
    token: string;
    expiresAt: Date;
  }> {
    const expiresAt = getExpirationDate(jwtConfig.refreshExpiresIn);

    const token = await new SignJWT({
      authId: payload.authId,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setSubject(payload.sub)
      .setIssuer(jwtConfig.issuer)
      .setIssuedAt()
      .setExpirationTime(jwtConfig.refreshExpiresIn)
      .sign(this.secretKey);

    return {
      token,
      expiresAt,
    };
  }

  async verifyRefreshToken(token: string): Promise<DecodedRefreshToken> {
    const { payload } = await jwtVerify(token, this.secretKey, {
      issuer: jwtConfig.issuer,
    });

    return {
      sub: String(payload.sub),
      authId: String(payload.authId),
      iss: String(payload.iss),
      iat: payload.iat,
      exp: payload.exp,
    };
  }

  async hashToken(token: string): Promise<string> {
    return createHash("sha256").update(token).digest("hex");
  }
}