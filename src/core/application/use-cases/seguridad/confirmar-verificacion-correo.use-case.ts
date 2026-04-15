import { createHash } from "node:crypto";
import { ValidationError } from "../errors/application-errors.js";
import {
  CodigoAgotadoError,
  CodigoInvalidoError,
  CorreoYaVerificadoError,
} from "../errors/verificacion-errors.js";
import { InvalidTokenError } from "../errors/auth-errors.js";
import { PersonaRepository } from "../../../domain/repositories/persona.repository.js";
import { CodigoVerificacionRepository } from "../../../domain/repositories/codigo-verificacion.repository.js";
import { AuditoriaRepository } from "../../../domain/repositories/auditoria.repository.js";

export interface ConfirmarVerificacionCorreoInput {
  idAutenticacion: string;
  codigo: string;
  ip?: string | null;
  agenteUsuario?: string | null;
}

const MAX_INTENTOS = 5;

export class ConfirmarVerificacionCorreoUseCase {
  constructor(
    private readonly personaRepo: PersonaRepository,
    private readonly codigoRepo: CodigoVerificacionRepository,
    private readonly auditoriaRepo: AuditoriaRepository,
  ) {}

  async execute(input: ConfirmarVerificacionCorreoInput): Promise<{ success: true }> {
    const codigo = input.codigo.trim();

    if (!codigo) {
      throw new ValidationError([{ field: "codigo", message: "El c�digo es obligatorio" }]);
    }

    const auth = await this.personaRepo.findAutenticacionById(input.idAutenticacion);
    if (!auth) throw new InvalidTokenError("Autenticaci�n no encontrada");

    if (auth.verificado) throw new CorreoYaVerificadoError();

    const registro = await this.codigoRepo.findCodigoActivoByAutenticacionAndTipo(
      input.idAutenticacion,
      "verificacion",
    );

    if (!registro) throw new CodigoInvalidoError();

    if (registro.fechaExpiracion < new Date()) {
      throw new CodigoInvalidoError("El c�digo ha expirado");
    }

    if (registro.intentos >= MAX_INTENTOS) {
      throw new CodigoAgotadoError();
    }

    const hashIngresado = createHash("sha256").update(codigo).digest("hex");

    if (hashIngresado !== registro.hashCodigo) {
      await this.codigoRepo.incrementarIntentosCodigo(registro.id);
      throw new CodigoInvalidoError("C�digo incorrecto");
    }

    await this.codigoRepo.marcarCodigoUsado(registro.id);
    await this.personaRepo.marcarCorreoVerificado(input.idAutenticacion);

    await this.auditoriaRepo.registrar({
      idPersona: auth.idPersona,
      idAutenticacion: input.idAutenticacion,
      evento: "verificacion_correo",
      ip: input.ip,
      agenteUsuario: input.agenteUsuario,
    });

    return { success: true };
  }
}
