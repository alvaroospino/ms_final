export type EventoAuditoria =
  | "login_exitoso"
  | "login_fallido"
  | "cuenta_bloqueada"
  | "logout"
  | "refresh_token"
  | "registro_local"
  | "envio_verificacion_correo"
  | "verificacion_correo"
  | "solicitud_recuperacion_clave"
  | "cambio_clave"
  | "creacion_rol"
  | "creacion_permiso"
  | "asignacion_rol"
  | "remocion_rol"
  | "asignacion_permiso"
  | "remocion_permiso"
  | "logout_global";

export interface RegistrarEventoParams {
  idPersona?: string | null;
  idAutenticacion?: string | null;
  idIngreso?: number | null;
  evento: EventoAuditoria;
  ip?: string | null;
  agenteUsuario?: string | null;
  detalle?: Record<string, unknown> | null;
}

export interface AuditoriaRepository {
  registrar(params: RegistrarEventoParams): Promise<void>;
}
