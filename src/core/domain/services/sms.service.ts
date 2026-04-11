export interface SendVerificationSmsParams {
  to: string;
  code: string;
  expiresAt: Date;
  expiresInMinutes: number;
}

export interface SmsService {
  sendVerificationCode(params: SendVerificationSmsParams): Promise<void>;
}
