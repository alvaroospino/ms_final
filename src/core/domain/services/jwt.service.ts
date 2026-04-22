import { TipoIdentificadorAcceso } from "../repositories/registro-pendiente.repository.js";

export interface JwtAccessPayload {
  sub: string;
  authId: string;
  identificador: string;
  tipoIdentificador: TipoIdentificadorAcceso;
  correo: string | null;
  nombres: string | null;
  apellidos: string | null;
  nombreCompleto: string | null;
  estado: number;
  activa: boolean;
  esEmpresa: boolean;
  roles: string[];
  permisos: string[];
}

export interface JwtTokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export interface DecodedAccessToken {
  sub: string;
  authId: string;
  uuidAcceso: string;
  identificador: string;
  tipoIdentificador: TipoIdentificadorAcceso;
  correo: string | null;
  nombres: string | null;
  apellidos: string | null;
  nombreCompleto: string | null;
  estado: number;
  activa: boolean;
  esEmpresa: boolean;
  roles: string[];
  permisos: string[];
  expiraEn?: number;
  iss: string;
  iat?: number;
  exp?: number;
}

export interface JwtService {
  generateAccessToken(payload: JwtAccessPayload): Promise<{
    token: string;
    expiresAt: Date;
  }>;

  verifyAccessToken(token: string): Promise<DecodedAccessToken>;
}
