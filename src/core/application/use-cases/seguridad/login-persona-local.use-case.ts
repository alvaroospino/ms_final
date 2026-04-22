import {
  AccountBlockedError,
  InvalidCredentialsError,
} from "../errors/auth-errors.js";
import { ValidationError } from "../errors/application-errors.js";
import { AuditoriaRepository } from "../../../domain/repositories/auditoria.repository.js";
import { PersonaRepository } from "../../../domain/repositories/persona.repository.js";
import { JwtService } from "../../../domain/services/jwt.service.js";
import { PasswordVerifierService } from "../../../domain/services/password-verifier.service.js";
import { RefreshTokenService } from "../../../domain/services/refresh-token.service.js";
import { parseAccessIdentifier } from "../../../../shared/utils/access-identifier.js";
import { inferEsEmpresaFromRoles } from "../../../../shared/utils/company-role.js";

export interface LoginPersonaLocalInput {
  identificador: string;
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
    const clave = input.clave.trim();
    if (!clave) {
      throw new ValidationError([{ field: "clave", message: "La clave es obligatoria" }]);
    }

    let identificador: string;
    try {
      identificador = parseAccessIdentifier(input.identificador).valor;
    } catch {
      throw new ValidationError([
        { field: "identificador", message: "Debes ingresar un correo o celular valido" },
      ]);
    }

    const auth = await this.repository.findAutenticacionLocalByIdentificador(identificador);
    if (!auth) {
      throw new InvalidCredentialsError();
    }

    if (auth.bloqueadoHasta && auth.bloqueadoHasta.getTime() > Date.now()) {
      throw new AccountBlockedError(auth.bloqueadoHasta);
    }

    const isValid = await this.passwordVerifier.verify(clave, auth.hashClave);
    if (!isValid) {
      const intentos = await this.repository.incrementarIntentosFallidos(auth.id);

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
        detalle: { intentos, identificador },
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
          detalle: { bloqueadoHasta, identificador },
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
    const nombres = auth.persona.nombres;
    const apellidos = auth.persona.apellidos;
    const nombreCompleto = auth.persona.nombreCompleto || null;
    const activa = auth.persona.estaActiva();
    const roleNames = roles.map((rol) => rol.nombre);
    const permissionNames = permisos.map((permiso) => permiso.nombre);
    const esEmpresa = inferEsEmpresaFromRoles(roleNames);

    const access = await this.jwtService.generateAccessToken({
      sub: auth.persona.id,
      authId: auth.id,
      identificador: auth.identificador,
      tipoIdentificador: auth.tipoIdentificador,
      correo: auth.correo,
      nombres,
      apellidos,
      nombreCompleto,
      estado: auth.persona.estado,
      activa,
      esEmpresa,
      roles: roleNames,
      permisos: permissionNames,
    });

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
      detalle: { identificador: auth.identificador, tipoIdentificador: auth.tipoIdentificador },
    });

    return {
      tokenApp: access.token,
      refreshToken: refresh.token,
      expiraEn: access.expiresAt.getTime(),
      refreshExpiraEn: refresh.expiresAt.getTime(),
      esEmpresa,
      usuario: {
        id: auth.persona.id,
        nombres,
        apellidos,
        nombreCompleto,
        correo: auth.persona.correo,
        identificador: auth.identificador,
        tipoIdentificador: auth.tipoIdentificador,
        estado: auth.persona.estado,
        activa,
        roles: roleNames,
        permisos: permissionNames,
      },
      ingreso: {
        id: ingreso.idIngreso,
        fechaInicio: ingreso.fechaInicio.toISOString(),
      },
    };
  }
}
