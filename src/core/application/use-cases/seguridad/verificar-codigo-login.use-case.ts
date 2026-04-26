import { createHash } from "node:crypto";

import { AccountBlockedError, InvalidCredentialsError } from "../errors/auth-errors.js";
import { ValidationError } from "../errors/application-errors.js";
import { CodigoAgotadoError, CodigoInvalidoError } from "../errors/verificacion-errors.js";
import { AuditoriaRepository } from "../../../domain/repositories/auditoria.repository.js";
import { PersonaRepository } from "../../../domain/repositories/persona.repository.js";
import { CodigoVerificacionRepository } from "../../../domain/repositories/codigo-verificacion.repository.js";
import { JwtService } from "../../../domain/services/jwt.service.js";
import { RefreshTokenService } from "../../../domain/services/refresh-token.service.js";
import { parseAccessIdentifier } from "../../../../shared/utils/access-identifier.js";
import { inferEsEmpresaFromRoles } from "../../../../shared/utils/company-role.js";

export interface VerificarCodigoLoginInput {
  identificador: string;
  codigo: string;
  ip?: string | null;
  agenteUsuario?: string | null;
  dispositivo?: string | null;
}

const MAX_INTENTOS = 5;

export class VerificarCodigoLoginUseCase {
  constructor(
    private readonly personaRepo: PersonaRepository,
    private readonly codigoRepo: CodigoVerificacionRepository,
    private readonly auditoriaRepo: AuditoriaRepository,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async execute(input: VerificarCodigoLoginInput) {
    const codigo = input.codigo.trim();
    if (!codigo) {
      throw new ValidationError([{ field: "codigo", message: "El codigo es obligatorio" }]);
    }

    let parsed;
    try {
      parsed = parseAccessIdentifier(input.identificador);
    } catch {
      throw new ValidationError([
        { field: "identificador", message: "Debes ingresar un correo o celular valido" },
      ]);
    }

    const auth = await this.personaRepo.findAutenticacionLocalByIdentificador(parsed.valor);
    if (!auth) {
      throw new InvalidCredentialsError("No existe una cuenta con ese identificador");
    }

    if (auth.bloqueadoHasta && auth.bloqueadoHasta.getTime() > Date.now()) {
      throw new AccountBlockedError(auth.bloqueadoHasta);
    }

    const registro = await this.codigoRepo.findCodigoActivoByAutenticacionAndTipo(
      auth.id,
      "inicio_sesion",
    );

    if (!registro) {
      throw new CodigoInvalidoError("No hay un codigo de acceso activo para este usuario");
    }

    if (registro.fechaExpiracion < new Date()) {
      throw new CodigoInvalidoError("El codigo ha expirado");
    }

    if (registro.intentos >= MAX_INTENTOS) {
      throw new CodigoAgotadoError();
    }

    const hashIngresado = createHash("sha256").update(codigo).digest("hex");

    if (hashIngresado !== registro.hashCodigo) {
      await this.codigoRepo.incrementarIntentosCodigo(registro.id);

      await this.auditoriaRepo.registrar({
        idPersona: auth.idPersona,
        idAutenticacion: auth.id,
        evento: "login_codigo_fallido",
        ip: input.ip,
        agenteUsuario: input.agenteUsuario,
        detalle: { identificador: parsed.valor },
      });

      throw new CodigoInvalidoError("Codigo incorrecto");
    }

    await this.codigoRepo.marcarCodigoUsado(registro.id);
    await this.personaRepo.reiniciarIntentosFallidosYActualizarIngreso(auth.id);

    const ingreso = await this.personaRepo.registrarIngreso({
      idAutenticacion: auth.id,
      resultado: 1,
      ip: input.ip ?? null,
      agenteUsuario: input.agenteUsuario ?? null,
      dispositivo: input.dispositivo ?? null,
    });

    const roles = await this.personaRepo.findRolesByPersonaId(auth.persona.id);
    const permisos = await this.personaRepo.findPermisosByPersonaId(auth.persona.id);
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
    await this.personaRepo.guardarRefreshToken({
      idIngreso: ingreso.idIngreso,
      tokenHash: refreshHash,
    });

    await this.auditoriaRepo.registrar({
      idPersona: auth.persona.id,
      idAutenticacion: auth.id,
      idIngreso: ingreso.idIngreso,
      evento: "login_codigo_exitoso",
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
