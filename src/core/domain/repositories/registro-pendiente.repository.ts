export type TipoIdentificadorAcceso = "correo" | "celular";

export interface RegistroPendienteRecord {
  id: string;
  tipoIdentificador: TipoIdentificadorAcceso;
  identificador: string;
  hashCodigo: string;
  intentos: number;
  verificado: boolean;
  completado: boolean;
  fechaExpiracion: Date;
  fechaVerificacion: Date | null;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export interface CrearRegistroPendienteParams {
  tipoIdentificador: TipoIdentificadorAcceso;
  identificador: string;
  hashCodigo: string;
  fechaExpiracion: Date;
}

export interface RegistroPendienteRepository {
  upsert(params: CrearRegistroPendienteParams): Promise<RegistroPendienteRecord>;
  findActivoByIdentificador(identificador: string): Promise<RegistroPendienteRecord | null>;
  incrementarIntentos(id: string): Promise<number>;
  marcarVerificado(id: string): Promise<void>;
  marcarCompletado(id: string): Promise<void>;
}
