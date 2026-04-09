import {
  bigint,
  customType,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const inet = customType<{ data: string }>({
  dataType() {
    return "inet";
  },
});

export const personas = pgTable("personas", {
  id: uuid("id_persona").primaryKey(),
  nombres: varchar("nombres_persona", { length: 120 }).notNull(),
  apellidos: varchar("apellidos_persona", { length: 120 }).notNull(),
  correo: varchar("correo_persona", { length: 255 }).notNull(),
  celular: varchar("celular_persona", { length: 20 }),
  estado: smallint("estado_persona").notNull(),
  fechaEliminacion: timestamp("fecha_eliminacion_persona", { withTimezone: true }),
  fechaCreacion: timestamp("fecha_creacion_persona", { withTimezone: true }).notNull(),
  fechaActualizacion: timestamp("fecha_actualizacion_persona", { withTimezone: true }).notNull(),
});

export const autenticacionesPersona = pgTable("autenticaciones_persona", {
  id: uuid("id_autenticacion").primaryKey(),
  idPersona: uuid("id_persona").notNull(),
  proveedor: varchar("proveedor_autenticacion", { length: 30 }).notNull(),
  identificadorExterno: varchar("identificador_externo_autenticacion", { length: 255 }),
  hashClave: varchar("hash_clave_autenticacion", { length: 255 }),
  verificado: smallint("verificado_autenticacion").notNull(),
  estado: smallint("estado_autenticacion").notNull(),
  requiereCambioClave: smallint("requiere_cambio_clave_autenticacion").notNull(),
  intentosFallidos: smallint("intentos_fallidos_autenticacion").notNull(),
  bloqueadoHasta: timestamp("bloqueado_hasta_autenticacion", { withTimezone: true }),
  ultimoIngreso: timestamp("ultimo_ingreso_autenticacion", { withTimezone: true }),
  fechaCreacion: timestamp("fecha_creacion_autenticacion", { withTimezone: true }).notNull(),
  fechaActualizacion: timestamp("fecha_actualizacion_autenticacion", { withTimezone: true }).notNull(),
});

export const ingresos = pgTable("ingresos", {
  id: bigint("id_ingreso", { mode: "number" }).primaryKey(),
  idAutenticacion: uuid("id_autenticacion"),
  resultado: smallint("resultado_ingreso").notNull(),
  ip: inet("ip_ingreso"),
  agenteUsuario: varchar("agente_usuario_ingreso", { length: 300 }),
  dispositivo: varchar("dispositivo_ingreso", { length: 200 }),
  fechaInicio: timestamp("fecha_inicio_ingreso", { withTimezone: true }).notNull(),
  fechaFin: timestamp("fecha_fin_ingreso", { withTimezone: true }),
});

export const tokensRefresco = pgTable("tokens_refresco", {
  id: bigint("id_token", { mode: "number" }).primaryKey(),
  idIngreso: bigint("id_ingreso", { mode: "number" }).notNull(),
  hashToken: varchar("hash_token", { length: 255 }).notNull(),
  estado: smallint("estado_token").notNull(),
  fechaRevocacion: timestamp("fecha_revocacion_token", { withTimezone: true }),
  fechaCreacion: timestamp("fecha_creacion_token", { withTimezone: true }).notNull(),
});

export const roles = pgTable("roles", {
  id: uuid("id_rol").primaryKey(),
  codigo: varchar("codigo_rol", { length: 60 }).notNull(),
  nombre: varchar("nombre_rol", { length: 100 }).notNull(),
  descripcion: varchar("descripcion_rol", { length: 300 }),
  esSistema: smallint("es_sistema_rol").notNull(),
  fechaCreacion: timestamp("fecha_creacion_rol", { withTimezone: true }).notNull(),
  fechaActualizacion: timestamp("fecha_actualizacion_rol", { withTimezone: true }).notNull(),
});

export const permisos = pgTable("permisos", {
  id: uuid("id_permiso").primaryKey(),
  codigo: varchar("codigo_permiso", { length: 100 }).notNull(),
  nombre: varchar("nombre_permiso", { length: 150 }).notNull(),
  descripcion: varchar("descripcion_permiso", { length: 300 }),
  fechaCreacion: timestamp("fecha_creacion_permiso", { withTimezone: true }).notNull(),
  fechaActualizacion: timestamp("fecha_actualizacion_permiso", { withTimezone: true }).notNull(),
});

export const personasRoles = pgTable("personas_roles", {
  idPersona: uuid("id_persona").notNull(),
  idRol: uuid("id_rol").notNull(),
  idPersonaAutoriza: uuid("id_persona_autoriza"),
  fechaAsignacion: timestamp("fecha_asignacion_persona_rol", { withTimezone: true }).notNull(),
});

export const rolesPermisos = pgTable("roles_permisos", {
  idRol: uuid("id_rol").notNull(),
  idPermiso: uuid("id_permiso").notNull(),
  fechaAsignacion: timestamp("fecha_asignacion_rol_permiso", { withTimezone: true }).notNull(),
});

export const codigosVerificacion = pgTable("codigos_verificacion", {
  id: bigint("id_codigo", { mode: "number" }).primaryKey(),
  idAutenticacion: uuid("id_autenticacion").notNull(),
  tipo: varchar("tipo_codigo", { length: 30 }).notNull(),
  hashCodigo: varchar("hash_codigo", { length: 255 }).notNull(),
  estado: smallint("estado_codigo").notNull(),
  intentos: smallint("intentos_codigo").notNull(),
  fechaExpiracion: timestamp("fecha_expiracion_codigo", { withTimezone: true }).notNull(),
  fechaUso: timestamp("fecha_uso_codigo", { withTimezone: true }),
  fechaCreacion: timestamp("fecha_creacion_codigo", { withTimezone: true }).notNull(),
});

export const auditoria = pgTable("auditoria", {
  id: bigint("id_auditoria", { mode: "number" }).primaryKey(),
  idPersona: uuid("id_persona"),
  idAutenticacion: uuid("id_autenticacion"),
  idIngreso: bigint("id_ingreso", { mode: "number" }),
  evento: varchar("evento_auditoria", { length: 60 }).notNull(),
  ip: inet("ip_auditoria"),
  agenteUsuario: varchar("agente_usuario_auditoria", { length: 300 }),
  detalle: text("detalle_auditoria"),
  fecha: timestamp("fecha_auditoria", { withTimezone: true }).notNull(),
});