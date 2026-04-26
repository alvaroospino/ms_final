import { ExternalServiceError } from "../../core/application/use-cases/errors/application-errors.js";
import { SendVerificationSmsParams, SmsService } from "../../core/domain/services/sms.service.js";
import { smsConfig } from "../config/database.config.js";

export class HttpSmsService implements SmsService {
  async sendVerificationCode(params: SendVerificationSmsParams): Promise<void> {
    if (!smsConfig.endpoint) {
      throw new ExternalServiceError(
        "No existe configuracion del microservicio SMS para enviar codigos",
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), smsConfig.timeoutMs);

    try {
      const response = await fetch(smsConfig.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(smsConfig.apiKey ? { "X-API-KEY": smsConfig.apiKey } : {}),
        },
        body: JSON.stringify({
          destinatario: params.to,
          contenido: `Tu codigo de verificacion es ${params.code}. Expira en ${params.expiresInMinutes} minutos.`,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ExternalServiceError(
          `El microservicio SMS respondio con estado ${response.status}`,
        );
      }
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }

      throw new ExternalServiceError("No fue posible comunicarse con el microservicio SMS", error);
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class NoopSmsService implements SmsService {
  async sendVerificationCode(): Promise<void> {
    throw new ExternalServiceError(
      "El envio de SMS no esta configurado en este entorno",
    );
  }
}
