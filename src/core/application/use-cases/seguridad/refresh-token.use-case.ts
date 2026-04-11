import { InvalidTokenError } from "@/core/application/use-cases/errors/auth-errors.js";
import { PersonaRepository } from "@/core/domain/repositories/persona.repository.js";
import { JwtService } from "@/core/domain/services/jwt.service.js";
import { RefreshTokenService } from "@/core/domain/services/refresh-token.service.js";

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  persona: {
    id: string;
    nombres: string | null;
    apellidos: string | null;
    nombreCompleto: string | null;
    correo: string | null;
    celular: string | null;
    identificador: string;
    tipoIdentificador: "correo" | "celular";
    estado: number;
    activa: boolean;
  };
}

export class RefreshTokenUseCase {
  constructor(
    private readonly repository: PersonaRepository,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenResult> {
    const rawRefreshToken = input.refreshToken.trim();
    if (!rawRefreshToken) {
      throw new InvalidTokenError("Refresh token requerido");
    }

    let decoded: { sub: string; authId: string };
    try {
      const payload = await this.refreshTokenService.verifyRefreshToken(rawRefreshToken);
      decoded = { sub: payload.sub, authId: payload.authId };
    } catch {
      throw new InvalidTokenError("Refresh token invalido o expirado");
    }

    const tokenHash = await this.refreshTokenService.hashToken(rawRefreshToken);
    const session = await this.repository.findRefreshTokenSessionByHash(tokenHash);

    if (!session) {
      throw new InvalidTokenError("Refresh token no reconocido");
    }

    if (session.estadoToken !== 1 || session.fechaRevocacion) {
      throw new InvalidTokenError("Refresh token revocado o inactivo");
    }

    if (session.idPersona !== decoded.sub || session.idAutenticacion !== decoded.authId) {
      throw new InvalidTokenError("Refresh token no corresponde a la sesion");
    }

    await this.repository.revocarRefreshToken({ idToken: session.idToken });

    const roles = await this.repository.findRolesByPersonaId(session.persona.id);
    const permisos = await this.repository.findPermisosByPersonaId(session.persona.id);

    const access = await this.jwtService.generateAccessToken({
      sub: session.persona.id,
      authId: session.idAutenticacion,
      identificador: session.identificador,
      tipoIdentificador: session.tipoIdentificador,
      correo: session.correo,
      roles: roles.map((rol) => rol.nombre),
      permisos: permisos.map((permiso) => permiso.nombre),
    });

    const refresh = await this.refreshTokenService.generateRefreshToken({
      sub: session.persona.id,
      authId: session.idAutenticacion,
    });

    const newRefreshHash = await this.refreshTokenService.hashToken(refresh.token);
    await this.repository.guardarRefreshToken({
      idIngreso: session.idIngreso,
      tokenHash: newRefreshHash,
    });

    return {
      accessToken: access.token,
      refreshToken: refresh.token,
      accessTokenExpiresAt: access.expiresAt.toISOString(),
      refreshTokenExpiresAt: refresh.expiresAt.toISOString(),
      persona: {
        id: session.persona.id,
        nombres: session.persona.nombres,
        apellidos: session.persona.apellidos,
        nombreCompleto: session.persona.nombreCompleto || null,
        correo: session.persona.correo,
        celular: session.persona.celular,
        identificador: session.identificador,
        tipoIdentificador: session.tipoIdentificador,
        estado: session.persona.estado,
        activa: session.persona.estaActiva(),
      },
    };
  }
}
