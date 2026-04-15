import { SendPasswordRecoveryEmailParams } from "../../../core/domain/services/email.service.js";
import { EmailTemplate, escapeHtml, formatExpirationDate } from "./email-template.utils.js";

export function buildPasswordRecoveryEmailTemplate(
  params: SendPasswordRecoveryEmailParams,
): EmailTemplate {
  const expiresAt = formatExpirationDate(params.expiresAt);
  const expiresInMinutesText = `${params.expiresInMinutes} minutos`;

  return {
    subject: "Recupera tu clave",
    text: [
      `Hola ${params.recipientName},`,
      "",
      "Recibimos una solicitud para recuperar tu clave en PAYGO.",
      `Tu codigo de recuperacion es: ${params.code}`,
      `Este codigo vence en ${expiresInMinutesText}.`,
      `Hora limite aproximada: ${expiresAt}.`,
      "",
      "Si no realizaste esta solicitud, puedes ignorar este mensaje.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
        <p>Hola ${escapeHtml(params.recipientName)},</p>
        <p>Recibimos una solicitud para recuperar tu clave en PAYGO.</p>
        <p>Tu codigo de recuperacion es:</p>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 16px 0;">
          ${escapeHtml(params.code)}
        </div>
        <p><strong>Este codigo vence en ${escapeHtml(expiresInMinutesText)}.</strong></p>
        <p>Hora limite aproximada: ${escapeHtml(expiresAt)}.</p>
        <p>Si no realizaste esta solicitud, puedes ignorar este mensaje.</p>
      </div>
    `,
  };
}
