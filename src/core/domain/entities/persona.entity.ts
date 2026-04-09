import { CorreoElectronico } from "@/core/domain/value-objects/correo-electronico.value-object.js";

export class Persona {
  constructor(
    public readonly id: string,
    public readonly nombres: string,
    public readonly apellidos: string,
    public readonly correo: CorreoElectronico,
    public readonly celular: string | null,
    public readonly estado: number,
    public readonly fechaCreacion: Date,
    public readonly fechaActualizacion: Date,
  ) {
    this.validar();
  }

  private validar(): void {
    if (!this.id.trim()) throw new Error("El id de la persona es requerido");
    if (!this.nombres.trim()) throw new Error("Los nombres son requeridos");
    if (!this.apellidos.trim()) throw new Error("Los apellidos son requeridos");
    if (![0, 1, 2, 3].includes(this.estado)) {
      throw new Error("Estado de persona inválido");
    }
  }

  get nombreCompleto(): string {
    return `${this.nombres} ${this.apellidos}`.trim();
  }

  estaActiva(): boolean {
    return this.estado === 1;
  }
}