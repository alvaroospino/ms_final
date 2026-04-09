export interface PasswordHasherService {
  hash(password: string): Promise<string>;
}