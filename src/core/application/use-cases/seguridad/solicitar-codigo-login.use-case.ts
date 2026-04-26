import { createHash } from "node:crypto";

import { AccountBlockedError, InvalidCredentialsError } from "../errors/auth-errors.js";
import { ValidationError } from "../errors/application-errors.js";
import { AuditoriaRepository } from "../../../domain/repositories/auditoria.repository.js";
import { PersonaRepository } from "../../../domain/repositories/persona.repository.js";
import { CodigoVerificacionRepository } from "../../../domain/repositories/codigo-verificacion.repository.js";
import { EmailQueueService } from "../../../domain/services/email-queue.service.js";
import { SmsService } from "../../../domain/services/sms.service.js";
import { parseAccessIdentifier } from "../../../../shared/utils/access-identifier.js";

export interface SolicitarCodigoLoginInput {
  identificador: string;
  ip?: string | null;
  agenteUsuario?: string | null;
}

export interface SolicitarCodigoLoginResult {
  mensaje: string;
  tipoIdentificador: "correo" | "celular";
  expiraEn: Date;
}

const EXPIRACION_MINUTOS = 10;

export class SolicitarCodigoLoginUseCase {
  constructor(
    private readonly personaRepo: PersonaRepository,
    private readonly codigoRepo: CodigoVerificacionRepository,
    private readonly auditoriaRepo: AuditoriaRepository,
    private readonly emailQueue: EmailQueueService,
    private readonly smsService: SmsService,
  ) {}

  async execute(input: SolicitarCodigoLoginInput): Promise<SolicitarCodigoLoginResult> {
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

    await this.codigoRepo.invalidarCodigosAnteriores(auth.id, "inicio_sesion");

    const codigoPlano = String(Math.floor(100000 + Math.random() * 900000));
    const hashCodigo = createHash("sha256").update(codigoPlano).digest("hex");
    const fechaExpiracion = new Date(Date.now() + EXPIRACION_MINUTOS * 60 * 1000);

    await this.codigoRepo.crearCodigo({
      idAutenticacion: auth.id,
      tipo: "inicio_sesion",
      hashCodigo,
      fechaExpiracion,
    });

    if (parsed.tipo === "correo") {
      await this.emailQueue.enqueueVerificationEmail({
        to: parsed.valor,
        recipientName: auth.persona.nombreCompleto || parsed.valor,
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
      idPersona: auth.idPersona,
      idAutenticacion: auth.id,
      evento: "solicitud_codigo_login",
      ip: input.ip,
      agenteUsuario: input.agenteUsuario,
      detalle: { identificador: parsed.valor, tipoIdentificador: parsed.tipo },
    });

    return {
      mensaje: `Codigo de acceso enviado al ${parsed.tipo}`,
      tipoIdentificador: parsed.tipo,
      expiraEn: fechaExpiracion,
    };
  }
}
