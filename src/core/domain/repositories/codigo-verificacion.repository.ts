export type TipoCodigo = "verificacion" | "recuperacion_clave" | "inicio_sesion";

export interface CrearCodigoParams {
  idAutenticacion: string;
  tipo: TipoCodigo;
  hashCodigo: string;
  fechaExpiracion: Date;
}

export interface CodigoRecord {
  id: number;
  idAutenticacion: string;
  tipo: TipoCodigo;
  hashCodigo: string;
  estado: number; // 0=pendiente, 1=usado, 2=expirado
  intentos: number;
  fechaExpiracion: Date;
  fechaUso: Date | null;
  fechaCreacion: Date;
}

export interface CodigoVerificacionRepository {
  crearCodigo(params: CrearCodigoParams): Promise<CodigoRecord>;
  findCodigoActivoByAutenticacionAndTipo(
    idAutenticacion: string,
    tipo: TipoCodigo,
  ): Promise<CodigoRecord | null>;
  incrementarIntentosCodigo(idCodigo: number): Promise<number>;
  marcarCodigoUsado(idCodigo: number): Promise<void>;
  invalidarCodigosAnteriores(idAutenticacion: string, tipo: TipoCodigo): Promise<void>;
}
