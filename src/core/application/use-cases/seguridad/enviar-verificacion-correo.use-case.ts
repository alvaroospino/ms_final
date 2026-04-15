import { createHash } from "node:crypto";
import { CorreoYaVerificadoError } from "../errors/verificacion-errors.js";
import { ValidationError } from "../errors/application-errors.js";
import { InvalidTokenError } from "../errors/auth-errors.js";
import { PersonaRepository } from "../../../domain/repositories/persona.repository.js";
import { CodigoVerificacionRepository } from "../../../domain/repositories/codigo-verificacion.repository.js";
import { AuditoriaRepository } from "../../../domain/repositories/auditoria.repository.js";
import { EmailQueueService } from "../../../domain/services/email-queue.service.js";

export interface EnviarVerificacionCorreoInput {
  idAutenticacion: string;
  ip?: string | null;
  agenteUsuario?: string | null;
}

export interface EnviarVerificacionCorreoResult {
  mensaje: string;
  expiraEn: Date;
}

const EXPIRACION_MINUTOS = 15;

export class EnviarVerificacionCorreoUseCase {
  constructor(
    private readonly personaRepo: PersonaRepository,
    private readonly codigoRepo: CodigoVerificacionRepository,
    private readonly auditoriaRepo: AuditoriaRepository,
    private readonly emailQueue: EmailQueueService,
  ) {}

  async execute(input: EnviarVerificacionCorreoInput): Promise<EnviarVerificacionCorreoResult> {
    const auth = await this.personaRepo.findAutenticacionById(input.idAutenticacion);

    if (!auth) {
      throw new InvalidTokenError("Autenticacion no encontrada");
    }

    if (auth.verificado) {
      throw new CorreoYaVerificadoError();
    }

    if (!auth.correo) {
      throw new ValidationError([
        { field: "correo", message: "La cuenta actual no fue registrada con correo" },
      ]);
    }

    await this.codigoRepo.invalidarCodigosAnteriores(input.idAutenticacion, "verificacion");

    const codigoPlano = String(Math.floor(100000 + Math.random() * 900000));
    const hashCodigo = createHash("sha256").update(codigoPlano).digest("hex");
    const fechaExpiracion = new Date(Date.now() + EXPIRACION_MINUTOS * 60 * 1000);

    await this.codigoRepo.crearCodigo({
      idAutenticacion: input.idAutenticacion,
      tipo: "verificacion",
      hashCodigo,
      fechaExpiracion,
    });

    await this.emailQueue.enqueueVerificationEmail({
      to: auth.correo,
      recipientName: auth.persona.nombreCompleto || auth.identificador,
      code: codigoPlano,
      expiresAt: fechaExpiracion,
      expiresInMinutes: EXPIRACION_MINUTOS,
    });

    await this.auditoriaRepo.registrar({
      idAutenticacion: input.idAutenticacion,
      idPersona: auth.idPersona,
      evento: "envio_verificacion_correo",
      ip: input.ip,
      agenteUsuario: input.agenteUsuario,
      detalle: { correo: auth.correo, queue: "verification" },
    });

    return {
      mensaje: `Codigo de verificacion encolado para el correo ${auth.correo}`,
      expiraEn: fechaExpiracion,
    };
  }
}
