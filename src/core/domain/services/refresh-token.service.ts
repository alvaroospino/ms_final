export interface RefreshTokenPayload {
  sub: string;
  authId: string;
}

export interface DecodedRefreshToken {
  sub: string;
  authId: string;
  iss: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenService {
  generateRefreshToken(payload: RefreshTokenPayload): Promise<{
    token: string;
    expiresAt: Date;
  }>;

  verifyRefreshToken(token: string): Promise<DecodedRefreshToken>;

  hashToken(token: string): Promise<string>;
}