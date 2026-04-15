import { InvalidTokenError } from "../errors/auth-errors.js";
import { PersonaRepository } from "../../../domain/repositories/persona.repository.js";
import { RefreshTokenService } from "../../../domain/services/refresh-token.service.js";
import { AuditoriaRepository } from "../../../domain/repositories/auditoria.repository.js";

export interface LogoutInput {
  refreshToken: string;
  ip?: string | null;
  agenteUsuario?: string | null;
}

export class LogoutUseCase {
  constructor(
    private readonly repository: PersonaRepository,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly auditoriaRepo: AuditoriaRepository,
  ) {}

  async execute(input: LogoutInput): Promise<{ success: true }> {
    const rawRefreshToken = input.refreshToken.trim();

    if (!rawRefreshToken) {
      throw new InvalidTokenError("Refresh token requerido");
    }

    try {
      await this.refreshTokenService.verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new InvalidTokenError("Refresh token inv�lido o expirado");
    }

    const tokenHash = await this.refreshTokenService.hashToken(rawRefreshToken);
    const session = await this.repository.findRefreshTokenSessionByHash(tokenHash);

    if (!session) {
      throw new InvalidTokenError("Refresh token no reconocido");
    }

    if (session.estadoToken !== 1 || session.fechaRevocacion) {
      throw new InvalidTokenError("Refresh token revocado o inactivo");
    }

    await this.repository.revocarRefreshToken({ idToken: session.idToken });
    await this.repository.cerrarIngreso(session.idIngreso);

    await this.auditoriaRepo.registrar({
      idPersona: session.idPersona,
      idAutenticacion: session.idAutenticacion,
      idIngreso: session.idIngreso,
      evento: "logout",
      ip: input.ip,
      agenteUsuario: input.agenteUsuario,
    });

    return { success: true };
  }
}
