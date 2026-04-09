import { createHash } from "node:crypto";
import { ValidationError } from "@/core/application/use-cases/errors/application-errors.js";
import { PersonaRepository } from "@/core/domain/repositories/persona.repository.js";
import { CodigoVerificacionRepository } from "@/core/domain/repositories/codigo-verificacion.repository.js";
import { AuditoriaRepository } from "@/core/domain/repositories/auditoria.repository.js";
import { EmailQueueService } from "@/core/domain/services/email-queue.service.js";
import { CorreoElectronico } from "@/core/domain/value-objects/correo-electronico.value-object.js";

export interface SolicitarRecuperacionClaveInput {
  correo: string;
  ip?: string | null;
  agenteUsuario?: string | null;
}

export interface SolicitarRecuperacionClaveResult {
  mensaje: string;
  expiraEn?: Date;
}

const EXPIRACION_MINUTOS = 30;

export class SolicitarRecuperacionClaveUseCase {
  constructor(
    private readonly personaRepo: PersonaRepository,
    private readonly codigoRepo: CodigoVerificacionRepository,
    private readonly auditoriaRepo: AuditoriaRepository,
    private readonly emailQueue: EmailQueueService,
  ) {}

  async execute(input: SolicitarRecuperacionClaveInput): Promise<SolicitarRecuperacionClaveResult> {
    let correo: string;
    try {
      correo = new CorreoElectronico(input.correo).toString();
    } catch {
      throw new ValidationError([{ field: "correo", message: "Correo invalido" }]);
    }

    const auth = await this.personaRepo.findAutenticacionLocalByCorreo(correo);

    if (!auth) {
      return {
        mensaje: "Si el correo esta registrado, recibiras un codigo de recuperacion",
      };
    }

    await this.codigoRepo.invalidarCodigosAnteriores(auth.id, "recuperacion_clave");

    const codigoPlano = String(Math.floor(100000 + Math.random() * 900000));
    const hashCodigo = createHash("sha256").update(codigoPlano).digest("hex");
    const fechaExpiracion = new Date(Date.now() + EXPIRACION_MINUTOS * 60 * 1000);

    await this.codigoRepo.crearCodigo({
      idAutenticacion: auth.id,
      tipo: "recuperacion_clave",
      hashCodigo,
      fechaExpiracion,
    });

    await this.emailQueue.enqueuePasswordRecoveryEmail({
      to: correo,
      recipientName: auth.persona.nombreCompleto,
      code: codigoPlano,
      expiresAt: fechaExpiracion,
      expiresInMinutes: EXPIRACION_MINUTOS,
    });

    await this.auditoriaRepo.registrar({
      idPersona: auth.idPersona,
      idAutenticacion: auth.id,
      evento: "solicitud_recuperacion_clave",
      ip: input.ip,
      agenteUsuario: input.agenteUsuario,
      detalle: { correo, queue: "password_recovery" },
    });

    return {
      mensaje: "Si el correo esta registrado, recibiras un codigo de recuperacion",
      expiraEn: fechaExpiracion,
    };
  }
}
