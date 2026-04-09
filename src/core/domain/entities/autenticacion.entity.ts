export type ProveedorAutenticacion = "local" | "google" | "microsoft" | "apple";

export class Autenticacion {
  constructor(
    public readonly id: string,
    public readonly idPersona: string,
    public readonly proveedor: ProveedorAutenticacion,
    public readonly identificadorExterno: string | null,
    public readonly verificado: boolean,
    public readonly estado: number,
    public readonly ultimoIngreso: Date | null,
  ) {
    this.validar();
  }

  private validar(): void {
    if (!this.id.trim()) throw new Error("El id de autenticación es requerido");
    if (!this.idPersona.trim()) throw new Error("El id de persona es requerido");

    if (!["local", "google", "microsoft", "apple"].includes(this.proveedor)) {
      throw new Error("Proveedor de autenticación inválido");
    }

    if (![0, 1, 2, 3].includes(this.estado)) {
      throw new Error("Estado de autenticación inválido");
    }
  }
}