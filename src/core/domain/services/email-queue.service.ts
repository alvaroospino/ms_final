export interface QueueVerificationEmailParams {
  to: string;
  recipientName: string;
  code: string;
  expiresAt: Date;
  expiresInMinutes: number;
}

export interface QueuePasswordRecoveryEmailParams {
  to: string;
  recipientName: string;
  code: string;
  expiresAt: Date;
  expiresInMinutes: number;
}

export interface EmailQueueService {
  enqueueVerificationEmail(params: QueueVerificationEmailParams): Promise<void>;
  enqueuePasswordRecoveryEmail(params: QueuePasswordRecoveryEmailParams): Promise<void>;
}
