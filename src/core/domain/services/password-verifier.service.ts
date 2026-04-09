export interface PasswordVerifierService {
  verify(password: string, hashedPassword: string): Promise<boolean>;
}