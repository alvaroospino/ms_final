export class Persona {
  constructor(
    public readonly id: string,
    public readonly nombres: string | null,
    public readonly apellidos: string | null,
    public readonly correo: string | null,
    public readonly celular: string | null,
    public readonly estado: number,
    public readonly fechaCreacion: Date,
    public readonly fechaActualizacion: Date,
  ) {
    this.validar();
  }

  private validar(): void {
    if (!this.id.trim()) throw new Error("El id de la persona es requerido");
    if (![0, 1, 2, 3].includes(this.estado)) {
      throw new Error("Estado de persona invalido");
    }
  }

  get nombreCompleto(): string {
    return `${this.nombres ?? ""} ${this.apellidos ?? ""}`.trim();
  }

  estaActiva(): boolean {
    return this.estado === 1;
  }
}
