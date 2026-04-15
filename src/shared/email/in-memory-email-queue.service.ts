import {
  EmailQueueService,
  QueuePasswordRecoveryEmailParams,
  QueueVerificationEmailParams,
} from "../../core/domain/services/email-queue.service.js";
import { EmailService } from "../../core/domain/services/email.service.js";

type EmailJob =
  | { type: "verification"; payload: QueueVerificationEmailParams }
  | { type: "password_recovery"; payload: QueuePasswordRecoveryEmailParams };

export class InMemoryEmailQueueService implements EmailQueueService {
  private queue: EmailJob[] = [];
  private processing = false;

  constructor(private readonly emailService: EmailService) {}

  async enqueueVerificationEmail(params: QueueVerificationEmailParams): Promise<void> {
    this.queue.push({ type: "verification", payload: params });
    this.scheduleProcessing();
  }

  async enqueuePasswordRecoveryEmail(params: QueuePasswordRecoveryEmailParams): Promise<void> {
    this.queue.push({ type: "password_recovery", payload: params });
    this.scheduleProcessing();
  }

  private scheduleProcessing(): void {
    if (this.processing) return;
    this.processing = true;
    setImmediate(() => {
      void this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) continue;

      try {
        if (job.type === "verification") {
          await this.emailService.sendVerificationEmail(job.payload);
          continue;
        }

        await this.emailService.sendPasswordRecoveryEmail(job.payload);
      } catch (error) {
        console.error("Error procesando cola de correos:", error);
      }
    }

    this.processing = false;

    if (this.queue.length > 0) {
      this.scheduleProcessing();
    }
  }
}
