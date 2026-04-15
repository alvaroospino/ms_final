import nodemailer from "nodemailer";
import {
  EmailService,
  SendPasswordRecoveryEmailParams,
  SendVerificationEmailParams,
} from "../../core/domain/services/email.service.js";
import { emailConfig } from "../config/database.config.js";
import { buildPasswordRecoveryEmailTemplate } from "./templates/password-recovery-email.template.js";
import { buildVerificationEmailTemplate } from "./templates/verification-email.template.js";

export class NodemailerEmailService implements EmailService {
  private readonly transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth:
      emailConfig.user && emailConfig.password
        ? {
            user: emailConfig.user,
            pass: emailConfig.password,
          }
        : undefined,
  });

  async sendVerificationEmail(params: SendVerificationEmailParams): Promise<void> {
    const template = buildVerificationEmailTemplate(params);

    await this.transporter.sendMail({
      from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
      to: params.to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
  }

  async sendPasswordRecoveryEmail(params: SendPasswordRecoveryEmailParams): Promise<void> {
    const template = buildPasswordRecoveryEmailTemplate(params);

    await this.transporter.sendMail({
      from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
      to: params.to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
  }
}
