export interface PersonaResponseDto {
  id: string;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  correo: string;
  celular: string | null;
  estado: number;
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}