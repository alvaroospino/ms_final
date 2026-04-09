export interface SendVerificationEmailParams {
  to: string;
  recipientName: string;
  code: string;
  expiresAt: Date;
  expiresInMinutes: number;
}

export interface SendPasswordRecoveryEmailParams {
  to: string;
  recipientName: string;
  code: string;
  expiresAt: Date;
  expiresInMinutes: number;
}

export interface EmailService {
  sendVerificationEmail(params: SendVerificationEmailParams): Promise<void>;
  sendPasswordRecoveryEmail(params: SendPasswordRecoveryEmailParams): Promise<void>;
}
