import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { PasswordHasherService } from "../../core/domain/services/password-hasher.service.js";
import { PasswordVerifierService } from "../../core/domain/services/password-verifier.service.js";

const scrypt = promisify(scryptCallback);

export class PasswordHasher implements PasswordHasherService, PasswordVerifierService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

    return `scrypt$${salt}$${derivedKey.toString("hex")}`;
  }

  async verify(password: string, hashedPassword: string): Promise<boolean> {
    const [algorithm, salt, storedHash] = hashedPassword.split("$");

    if (algorithm !== "scrypt" || !salt || !storedHash) {
      return false;
    }

    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    const storedBuffer = Buffer.from(storedHash, "hex");

    if (derivedKey.length !== storedBuffer.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, storedBuffer);
  }
}
