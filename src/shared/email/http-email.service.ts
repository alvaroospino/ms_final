import { ExternalServiceError } from "../../core/application/use-cases/errors/application-errors.js";
import {
  EmailService,
  SendPasswordRecoveryEmailParams,
  SendVerificationEmailParams,
} from "../../core/domain/services/email.service.js";
import { emailConfig } from "../config/database.config.js";
import { buildPasswordRecoveryEmailTemplate } from "./templates/password-recovery-email.template.js";
import { buildVerificationEmailTemplate } from "./templates/verification-email.template.js";

interface LoginResponse {
  datos?: {
    tokenApp?: string;
    expiraEn?: number;
  };
  mensaje?: string;
}

interface SendEmailResponse {
  datos?: {
    exito?: boolean;
    mensaje?: string;
  };
  mensaje?: string;
}

export class HttpEmailService implements EmailService {
  private readonly endpoint: string;
  private readonly loginEndpoint: string;
  private readonly accessEmail: string;
  private readonly accessPassword: string;
  private readonly timeoutMs: number;
  private readonly bcc: string[];
  private cachedToken: string | null = null;
  private cachedTokenExpiresAt = 0;
  private loginInFlight: Promise<string> | null = null;

  constructor() {
    if (!emailConfig.httpEndpoint) {
      throw new Error("MAIL_HTTP_ENDPOINT no esta configurado");
    }

    this.endpoint = emailConfig.httpEndpoint;
    this.loginEndpoint = resolveLoginEndpoint();
    this.accessEmail = requireEmailHttpCredential("MAIL_HTTP_ACCESS_EMAIL");
    this.accessPassword = requireEmailHttpCredential("MAIL_HTTP_ACCESS_PASSWORD");
    this.timeoutMs = emailConfig.timeoutMs;
    this.bcc = parseBccList(emailConfig.httpBcc);
  }

  async sendVerificationEmail(params: SendVerificationEmailParams): Promise<void> {
    const template = buildVerificationEmailTemplate(params);
    await this.post(params.to, template.subject, template.html);
  }

  async sendPasswordRecoveryEmail(params: SendPasswordRecoveryEmailParams): Promise<void> {
    const template = buildPasswordRecoveryEmailTemplate(params);
    await this.post(params.to, template.subject, template.html);
  }

  private async post(para: string, asunto: string, cuerpoHtml: string): Promise<void> {
    const token = await this.getToken();
    const body = {
      para,
      asunto,
      cuerpoHtml,
      conCopiaOculta: this.bcc,
    };

    const response = await this.fetchJson<SendEmailResponse>(this.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.datos?.exito === false) {
      throw new ExternalServiceError(
        response.datos.mensaje || response.mensaje || "El microservicio de correo rechazo el envio",
      );
    }
  }

  private async getToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.cachedTokenExpiresAt) {
      return this.cachedToken;
    }

    if (!this.loginInFlight) {
      this.loginInFlight = this.authenticate().finally(() => {
        this.loginInFlight = null;
      });
    }

    return this.loginInFlight;
  }

  private async authenticate(): Promise<string> {
    const response = await this.fetchJson<LoginResponse>(this.loginEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        correoAcceso: this.accessEmail,
        claveAcceso: this.accessPassword,
      }),
    });

    const token = response.datos?.tokenApp?.trim();
    if (!token) {
      throw new ExternalServiceError(
        response.mensaje || "El login del microservicio de correo no devolvio tokenApp",
      );
    }

    this.cachedToken = token;
    this.cachedTokenExpiresAt = normalizeTokenExpiration(response.datos?.expiraEn);
    return token;
  }

  private async fetchJson<T>(url: string, init: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      const rawBody = await response.text();
      const parsedBody = rawBody ? safeJsonParse<T>(rawBody) : null;

      if (!response.ok) {
        const details = extractErrorMessage(parsedBody, rawBody);
        throw new ExternalServiceError(
          `El microservicio de correo respondio con estado ${response.status}${details ? `: ${details}` : ""}`,
        );
      }

      return (parsedBody ?? ({} as T));
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }

      throw new ExternalServiceError("No fue posible comunicarse con el microservicio de correo", error);
    } finally {
      clearTimeout(timeout);
    }
  }
}

function resolveLoginEndpoint(): string {
  if (emailConfig.httpLoginEndpoint) {
    return emailConfig.httpLoginEndpoint;
  }

  if (!emailConfig.httpEndpoint) {
    throw new Error("MAIL_HTTP_ENDPOINT no esta configurado");
  }

  try {
    const endpoint = new URL(emailConfig.httpEndpoint);
    return new URL("/auth/login", endpoint.origin).toString();
  } catch {
    throw new Error("MAIL_HTTP_LOGIN_ENDPOINT no esta configurado y MAIL_HTTP_ENDPOINT no es una URL valida");
  }
}

function requireEmailHttpCredential(name: "MAIL_HTTP_ACCESS_EMAIL" | "MAIL_HTTP_ACCESS_PASSWORD"): string {
  const value =
    name === "MAIL_HTTP_ACCESS_EMAIL" ? emailConfig.httpAccessEmail : emailConfig.httpAccessPassword;

  if (!value) {
    throw new Error(`${name} no esta configurado`);
  }

  return value;
}

function parseBccList(rawValue?: string): string[] {
  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizeTokenExpiration(expiraEn?: number): number {
  if (typeof expiraEn === "number" && Number.isFinite(expiraEn)) {
    return Math.max(Date.now() + 30_000, expiraEn - 30_000);
  }

  return Date.now() + 10 * 60 * 1000;
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function extractErrorMessage(parsedBody: unknown, rawBody: string): string {
  if (parsedBody && typeof parsedBody === "object") {
    const body = parsedBody as {
      mensaje?: unknown;
      message?: unknown;
      error?: unknown;
      datos?: { mensaje?: unknown };
    };

    const message =
      body.datos?.mensaje ?? body.mensaje ?? body.message ?? body.error;

    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }

  const compactBody = rawBody.trim();
  return compactBody ? compactBody : "";
}
