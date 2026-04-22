import { InvalidTokenError } from "../errors/auth-errors.js";
import { PersonaRepository } from "../../../domain/repositories/persona.repository.js";
import { JwtService } from "../../../domain/services/jwt.service.js";
import { RefreshTokenService } from "../../../domain/services/refresh-token.service.js";
import { inferEsEmpresaFromRoles } from "../../../../shared/utils/company-role.js";

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenResult {
  tokenApp: string;
  refreshToken: string;
  expiraEn: number;
  refreshExpiraEn: number;
  esEmpresa: boolean;
  usuario: {
    id: string;
    nombres: string | null;
    apellidos: string | null;
    nombreCompleto: string | null;
    correo: string | null;
    identificador: string;
    tipoIdentificador: "correo" | "celular";
    estado: number;
    activa: boolean;
    roles: string[];
    permisos: string[];
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
    const nombres = session.persona.nombres;
    const apellidos = session.persona.apellidos;
    const nombreCompleto = session.persona.nombreCompleto || null;
    const activa = session.persona.estaActiva();
    const roleNames = roles.map((rol) => rol.nombre);
    const permissionNames = permisos.map((permiso) => permiso.nombre);
    const esEmpresa = inferEsEmpresaFromRoles(roleNames);

    const access = await this.jwtService.generateAccessToken({
      sub: session.persona.id,
      authId: session.idAutenticacion,
      identificador: session.identificador,
      tipoIdentificador: session.tipoIdentificador,
      correo: session.correo,
      nombres,
      apellidos,
      nombreCompleto,
      estado: session.persona.estado,
      activa,
      esEmpresa,
      roles: roleNames,
      permisos: permissionNames,
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
      tokenApp: access.token,
      refreshToken: refresh.token,
      expiraEn: access.expiresAt.getTime(),
      refreshExpiraEn: refresh.expiresAt.getTime(),
      esEmpresa,
      usuario: {
        id: session.persona.id,
        nombres,
        apellidos,
        nombreCompleto,
        correo: session.persona.correo,
        identificador: session.identificador,
        tipoIdentificador: session.tipoIdentificador,
        estado: session.persona.estado,
        activa,
        roles: roleNames,
        permisos: permissionNames,
      },
    };
  }
}
