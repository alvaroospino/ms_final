export interface PersonaResponseDto {
  id: string;
  nombres: string | null;
  apellidos: string | null;
  nombreCompleto: string | null;
  correo: string | null;
  celular: string | null;
  estado: number;
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}
