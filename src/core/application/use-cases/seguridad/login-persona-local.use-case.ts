import {
  InvalidCredentialsError,
  AccountBlockedError,
} from "@/core/application/use-cases/errors/auth-errors.js";
import { ValidationError } from "@/core/application/use-cases/errors/application-errors.js";
import { PersonaRepository } from "@/core/domain/repositories/persona.repository.js";
import { PasswordVerifierService } from "@/core/domain/services/password-verifier.service.js";
import { JwtService } from "@/core/domain/services/jwt.service.js";
import { RefreshTokenService } from "@/core/domain/services/refresh-token.service.js";
import { AuditoriaRepository } from "@/core/domain/repositories/auditoria.repository.js";
import { CorreoElectronico } from "@/core/domain/value-objects/correo-electronico.value-object.js";

export interface LoginPersonaLocalInput {
  correo: string;
  clave: string;
  ip?: string | null;
  agenteUsuario?: string | null;
  dispositivo?: string | null;
}

const MAX_INTENTOS = 5;
const BLOQUEO_MINUTOS = 15;

export class LoginPersonaLocalUseCase {
  constructor(
    private readonly repository: PersonaRepository,
    private readonly passwordVerifier: PasswordVerifierService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly auditoriaRepo: AuditoriaRepository,
  ) {}

  async execute(input: LoginPersonaLocalInput) {
    const correo = new CorreoElectronico(input.correo).toString();
    const clave = input.clave.trim();

    if (!clave) {
      throw new ValidationError([
        { field: "clave", message: "La clave es obligatoria" },
      ]);
    }

    const auth = await this.repository.findAutenticacionLocalByCorreo(correo);

    if (!auth) {
      throw new InvalidCredentialsError();
    }

    if (auth.bloqueadoHasta && auth.bloqueadoHasta.getTime() > Date.now()) {
      throw new AccountBlockedError(auth.bloqueadoHasta);
    }

    const isValid = await this.passwordVerifier.verify(clave, auth.hashClave);

    if (!isValid) {
      const intentos = await this.repository.incrementarIntentosFallidos(auth.id);

      // Registrar ingreso fallido
      await this.repository.registrarIngreso({
        idAutenticacion: auth.id,
        resultado: 0,
        ip: input.ip ?? null,
        agenteUsuario: input.agenteUsuario ?? null,
        dispositivo: input.dispositivo ?? null,
      });

      await this.auditoriaRepo.registrar({
        idPersona: auth.persona.id,
        idAutenticacion: auth.id,
        evento: "login_fallido",
        ip: input.ip,
        agenteUsuario: input.agenteUsuario,
        detalle: { intentos, correo },
      });

      if (intentos >= MAX_INTENTOS) {
        const bloqueadoHasta = new Date(Date.now() + BLOQUEO_MINUTOS * 60 * 1000);
        await this.repository.bloquearAutenticacion(auth.id, bloqueadoHasta);

        await this.auditoriaRepo.registrar({
          idPersona: auth.persona.id,
          idAutenticacion: auth.id,
          evento: "cuenta_bloqueada",
          ip: input.ip,
          agenteUsuario: input.agenteUsuario,
          detalle: { bloqueadoHasta, correo },
        });

        throw new AccountBlockedError(bloqueadoHasta);
      }

      throw new InvalidCredentialsError();
    }

    await this.repository.reiniciarIntentosFallidosYActualizarIngreso(auth.id);

    const ingreso = await this.repository.registrarIngreso({
      idAutenticacion: auth.id,
      resultado: 1,
      ip: input.ip ?? null,
      agenteUsuario: input.agenteUsuario ?? null,
      dispositivo: input.dispositivo ?? null,
    });

    const roles = await this.repository.findRolesByPersonaId(auth.persona.id);
    const permisos = await this.repository.findPermisosByPersonaId(auth.persona.id);

    const payload = {
      sub: auth.persona.id,
      authId: auth.id,
      correo: auth.persona.correo.toString(),
      roles: roles.map((rol) => rol.nombre),
      permisos: permisos.map((permiso) => permiso.nombre),
    };

    const access = await this.jwtService.generateAccessToken(payload);

    const refresh = await this.refreshTokenService.generateRefreshToken({
      sub: auth.persona.id,
      authId: auth.id,
    });

    const refreshHash = await this.refreshTokenService.hashToken(refresh.token);

    await this.repository.guardarRefreshToken({
      idIngreso: ingreso.idIngreso,
      tokenHash: refreshHash,
    });

    await this.auditoriaRepo.registrar({
      idPersona: auth.persona.id,
      idAutenticacion: auth.id,
      idIngreso: ingreso.idIngreso,
      evento: "login_exitoso",
      ip: input.ip,
      agenteUsuario: input.agenteUsuario,
    });

    return {
      persona: {
        id: auth.persona.id,
        nombres: auth.persona.nombres,
        apellidos: auth.persona.apellidos,
        nombreCompleto: auth.persona.nombreCompleto,
        correo: auth.persona.correo.toString(),
        celular: auth.persona.celular,
        estado: auth.persona.estado,
        activa: auth.persona.estaActiva(),
      },
      accessToken: access.token,
      refreshToken: refresh.token,
      accessTokenExpiresAt: access.expiresAt.toISOString(),
      refreshTokenExpiresAt: refresh.expiresAt.toISOString(),
      ingreso: {
        id: ingreso.idIngreso,
        fechaInicio: ingreso.fechaInicio.toISOString(),
      },
    };
  }
}
