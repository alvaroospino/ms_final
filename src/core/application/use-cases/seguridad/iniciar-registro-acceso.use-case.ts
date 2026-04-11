import { createHash } from "node:crypto";

import { AuditoriaRepository } from "@/core/domain/repositories/auditoria.repository.js";
import { PersonaRepository } from "@/core/domain/repositories/persona.repository.js";
import { RegistroPendienteRepository } from "@/core/domain/repositories/registro-pendiente.repository.js";
import { EmailQueueService } from "@/core/domain/services/email-queue.service.js";
import { SmsService } from "@/core/domain/services/sms.service.js";
import { PersonaAlreadyExistsError } from "@/core/application/use-cases/errors/persona-errors.js";
import { ValidationError } from "@/core/application/use-cases/errors/application-errors.js";
import { parseAccessIdentifier } from "@/shared/utils/access-identifier.js";

export interface IniciarRegistroAccesoInput {
  identificador: string;
  ip?: string | null;
  agenteUsuario?: string | null;
}

const EXPIRACION_MINUTOS = 15;

export class IniciarRegistroAccesoUseCase {
  constructor(
    private readonly personaRepo: PersonaRepository,
    private readonly registroPendienteRepo: RegistroPendienteRepository,
    private readonly auditoriaRepo: AuditoriaRepository,
    private readonly emailQueue: EmailQueueService,
    private readonly smsService: SmsService,
  ) {}

  async execute(input: IniciarRegistroAccesoInput): Promise<{
    identificador: string;
    tipoIdentificador: "correo" | "celular";
    expiraEn: Date;
    mensaje: string;
  }> {
    let parsed;
    try {
      parsed = parseAccessIdentifier(input.identificador);
    } catch {
      throw new ValidationError([
        { field: "identificador", message: "Debes ingresar un correo o celular valido" },
      ]);
    }

    const existing = await this.personaRepo.findByIdentificador(parsed.valor);
    if (existing) {
      throw new PersonaAlreadyExistsError();
    }

    const codigoPlano = String(Math.floor(100000 + Math.random() * 900000));
    const hashCodigo = createHash("sha256").update(codigoPlano).digest("hex");
    const fechaExpiracion = new Date(Date.now() + EXPIRACION_MINUTOS * 60 * 1000);

    await this.registroPendienteRepo.upsert({
      tipoIdentificador: parsed.tipo,
      identificador: parsed.valor,
      hashCodigo,
      fechaExpiracion,
    });

    if (parsed.tipo === "correo") {
      await this.emailQueue.enqueueVerificationEmail({
        to: parsed.valor,
        recipientName: parsed.valor,
        code: codigoPlano,
        expiresAt: fechaExpiracion,
        expiresInMinutes: EXPIRACION_MINUTOS,
      });
    } else {
      await this.smsService.sendVerificationCode({
        to: parsed.valor,
        code: codigoPlano,
        expiresAt: fechaExpiracion,
        expiresInMinutes: EXPIRACION_MINUTOS,
      });
    }

    await this.auditoriaRepo.registrar({
      evento: "registro_iniciado",
      ip: input.ip,
      agenteUsuario: input.agenteUsuario,
      detalle: {
        identificador: parsed.valor,
        tipoIdentificador: parsed.tipo,
      },
    });

    return {
      identificador: parsed.valor,
      tipoIdentificador: parsed.tipo,
      expiraEn: fechaExpiracion,
      mensaje: `Codigo enviado al ${parsed.tipo}`,
    };
  }
}
