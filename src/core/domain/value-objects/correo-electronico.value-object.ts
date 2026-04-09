export class CorreoElectronico {
  public readonly value: string;

  constructor(value: string) {
    const normalized = value.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalized)) {
      throw new Error("Correo electrónico inválido");
    }

    this.value = normalized;
  }

  toString(): string {
    return this.value;
  }
}