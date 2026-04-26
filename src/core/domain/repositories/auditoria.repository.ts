export type EventoAuditoria =
  | "login_exitoso"
  | "login_fallido"
  | "cuenta_bloqueada"
  | "logout"
  | "refresh_token"
  | "registro_local"
  | "registro_iniciado"
  | "registro_verificado"
  | "registro_completado"
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
  | "logout_global"
  | "solicitud_codigo_login"
  | "login_codigo_exitoso"
  | "login_codigo_fallido";

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
