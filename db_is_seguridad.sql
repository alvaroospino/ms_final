-- =============================================================
-- MICROSERVICIO DE SEGURIDAD / AUTENTICACION (PROYECTO TIPO PAYGO)
-- VERSION ACTUALIZADA
-- POSTGRESQL - 2026
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- TABLA: personas
-- Identidad minima del usuario dentro del sistema.
-- Los datos de perfil pueden completarse despues desde la app.
-- =============================================================
CREATE TABLE personas (
    id_persona UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nombres_persona VARCHAR(120),
    apellidos_persona VARCHAR(120),

    correo_persona VARCHAR(255),
    celular_persona VARCHAR(20),

    estado_persona SMALLINT NOT NULL DEFAULT 1,

    fecha_eliminacion_persona TIMESTAMPTZ,
    fecha_creacion_persona TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_actualizacion_persona TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_correo_persona UNIQUE (correo_persona),
    CONSTRAINT uq_celular_persona UNIQUE (celular_persona),
    CONSTRAINT chk_estado_persona CHECK (estado_persona IN (0,1,2,3))
);

CREATE INDEX idx_personas_estado ON personas (estado_persona);

-- =============================================================
-- TABLA: fotos_persona
-- Una persona puede tener varias fotos, pero solo una principal.
-- =============================================================
CREATE TABLE fotos_persona (
    id_foto BIGSERIAL PRIMARY KEY,
    id_persona UUID NOT NULL,
    url_foto TEXT NOT NULL,
    es_principal_foto SMALLINT NOT NULL DEFAULT 0,
    fecha_creacion_foto TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_fotos_persona_personas
        FOREIGN KEY (id_persona)
        REFERENCES personas(id_persona)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_es_principal_foto CHECK (es_principal_foto IN (0,1))
);

CREATE INDEX idx_fotos_persona_id_persona ON fotos_persona (id_persona);

CREATE UNIQUE INDEX uq_foto_principal_por_persona
ON fotos_persona (id_persona)
WHERE es_principal_foto = 1;

-- =============================================================
-- TABLA: autenticaciones_persona
-- El login local ahora guarda un identificador unico:
-- correo o celular.
-- =============================================================
CREATE TABLE autenticaciones_persona (
    id_autenticacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_persona UUID NOT NULL,

    proveedor_autenticacion VARCHAR(30) NOT NULL,
    tipo_identificador_autenticacion VARCHAR(20),
    identificador_autenticacion VARCHAR(255),
    identificador_externo_autenticacion VARCHAR(255),

    hash_clave_autenticacion VARCHAR(255),

    verificado_autenticacion SMALLINT NOT NULL DEFAULT 0,
    estado_autenticacion SMALLINT NOT NULL DEFAULT 1,
    requiere_cambio_clave_autenticacion SMALLINT NOT NULL DEFAULT 0,
    intentos_fallidos_autenticacion SMALLINT NOT NULL DEFAULT 0,

    bloqueado_hasta_autenticacion TIMESTAMPTZ,
    ultimo_ingreso_autenticacion TIMESTAMPTZ,

    fecha_creacion_autenticacion TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_actualizacion_autenticacion TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_autenticaciones_persona_personas
        FOREIGN KEY (id_persona)
        REFERENCES personas(id_persona)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_proveedor_autenticacion
        CHECK (proveedor_autenticacion IN ('local','google','microsoft','apple')),

    CONSTRAINT chk_tipo_identificador_autenticacion
        CHECK (
            tipo_identificador_autenticacion IS NULL
            OR tipo_identificador_autenticacion IN ('correo','celular')
        ),

    CONSTRAINT chk_verificado_autenticacion CHECK (verificado_autenticacion IN (0,1)),
    CONSTRAINT chk_estado_autenticacion CHECK (estado_autenticacion IN (0,1,2,3)),
    CONSTRAINT chk_requiere_cambio_clave_autenticacion CHECK (requiere_cambio_clave_autenticacion IN (0,1)),

    CONSTRAINT uq_persona_proveedor_autenticacion UNIQUE (id_persona, proveedor_autenticacion),
    CONSTRAINT uq_proveedor_identificador_externo_autenticacion
        UNIQUE (proveedor_autenticacion, identificador_externo_autenticacion),
    CONSTRAINT uq_identificador_autenticacion UNIQUE (identificador_autenticacion),

    CONSTRAINT chk_logica_autenticacion
        CHECK (
            (
                proveedor_autenticacion = 'local'
                AND identificador_autenticacion IS NOT NULL
                AND tipo_identificador_autenticacion IS NOT NULL
                AND identificador_externo_autenticacion IS NULL
                AND hash_clave_autenticacion IS NOT NULL
            )
            OR
            (
                proveedor_autenticacion IN ('google','microsoft','apple')
                AND identificador_autenticacion IS NULL
                AND tipo_identificador_autenticacion IS NULL
                AND identificador_externo_autenticacion IS NOT NULL
                AND hash_clave_autenticacion IS NULL
            )
        )
);

CREATE INDEX idx_autenticaciones_persona_id_persona ON autenticaciones_persona (id_persona);
CREATE INDEX idx_autenticaciones_persona_proveedor ON autenticaciones_persona (proveedor_autenticacion);
CREATE INDEX idx_autenticaciones_persona_identificador ON autenticaciones_persona (identificador_autenticacion);

-- =============================================================
-- TABLA: registros_pendientes
-- Registro previo a la creacion de la cuenta definitiva.
-- =============================================================
CREATE TABLE registros_pendientes (
    id_registro_pendiente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_identificador_registro VARCHAR(20) NOT NULL,
    identificador_registro VARCHAR(255) NOT NULL,
    hash_codigo_registro VARCHAR(255) NOT NULL,
    intentos_registro SMALLINT NOT NULL DEFAULT 0,
    verificado_registro SMALLINT NOT NULL DEFAULT 0,
    completado_registro SMALLINT NOT NULL DEFAULT 0,
    fecha_expiracion_registro TIMESTAMPTZ NOT NULL,
    fecha_verificacion_registro TIMESTAMPTZ,
    fecha_creacion_registro TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_actualizacion_registro TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_identificador_registro UNIQUE (identificador_registro),
    CONSTRAINT chk_tipo_identificador_registro CHECK (tipo_identificador_registro IN ('correo','celular')),
    CONSTRAINT chk_verificado_registro CHECK (verificado_registro IN (0,1)),
    CONSTRAINT chk_completado_registro CHECK (completado_registro IN (0,1))
);

CREATE INDEX idx_registros_pendientes_identificador
ON registros_pendientes (identificador_registro);

-- =============================================================
-- TABLA: roles
-- =============================================================
CREATE TABLE roles (
    id_rol UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_rol VARCHAR(60) NOT NULL,
    nombre_rol VARCHAR(100) NOT NULL,
    descripcion_rol VARCHAR(300),
    es_sistema_rol SMALLINT NOT NULL DEFAULT 0,
    fecha_creacion_rol TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_actualizacion_rol TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_codigo_rol UNIQUE (codigo_rol),
    CONSTRAINT chk_es_sistema_rol CHECK (es_sistema_rol IN (0,1))
);

-- =============================================================
-- TABLA: permisos
-- =============================================================
CREATE TABLE permisos (
    id_permiso UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_permiso VARCHAR(100) NOT NULL,
    nombre_permiso VARCHAR(150) NOT NULL,
    descripcion_permiso VARCHAR(300),
    fecha_creacion_permiso TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_actualizacion_permiso TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_codigo_permiso UNIQUE (codigo_permiso)
);

-- =============================================================
-- TABLA: roles_permisos
-- =============================================================
CREATE TABLE roles_permisos (
    id_rol UUID NOT NULL,
    id_permiso UUID NOT NULL,
    fecha_asignacion_rol_permiso TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (id_rol, id_permiso),

    CONSTRAINT fk_roles_permisos_roles
        FOREIGN KEY (id_rol)
        REFERENCES roles(id_rol)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_roles_permisos_permisos
        FOREIGN KEY (id_permiso)
        REFERENCES permisos(id_permiso)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =============================================================
-- TABLA: personas_roles
-- =============================================================
CREATE TABLE personas_roles (
    id_persona UUID NOT NULL,
    id_rol UUID NOT NULL,
    id_persona_autoriza UUID,
    fecha_asignacion_persona_rol TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (id_persona, id_rol),

    CONSTRAINT fk_personas_roles_personas
        FOREIGN KEY (id_persona)
        REFERENCES personas(id_persona)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_personas_roles_roles
        FOREIGN KEY (id_rol)
        REFERENCES roles(id_rol)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_personas_roles_autoriza
        FOREIGN KEY (id_persona_autoriza)
        REFERENCES personas(id_persona)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =============================================================
-- TABLA: codigos_verificacion
-- OTP asociado a una autenticacion ya creada.
-- =============================================================
CREATE TABLE codigos_verificacion (
    id_codigo BIGSERIAL PRIMARY KEY,
    id_autenticacion UUID NOT NULL,
    tipo_codigo VARCHAR(30) NOT NULL,
    hash_codigo VARCHAR(255) NOT NULL,
    estado_codigo SMALLINT NOT NULL DEFAULT 0,
    intentos_codigo SMALLINT NOT NULL DEFAULT 0,
    fecha_expiracion_codigo TIMESTAMPTZ NOT NULL,
    fecha_uso_codigo TIMESTAMPTZ,
    fecha_creacion_codigo TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_codigos_verificacion_autenticaciones
        FOREIGN KEY (id_autenticacion)
        REFERENCES autenticaciones_persona(id_autenticacion)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_tipo_codigo
        CHECK (tipo_codigo IN ('verificacion','recuperacion_clave','inicio_sesion')),

    CONSTRAINT chk_estado_codigo CHECK (estado_codigo IN (0,1,2))
);

CREATE INDEX idx_codigos_verificacion_id_autenticacion
ON codigos_verificacion (id_autenticacion);

-- =============================================================
-- TABLA: ingresos
-- =============================================================
CREATE TABLE ingresos (
    id_ingreso BIGSERIAL PRIMARY KEY,
    id_autenticacion UUID,
    resultado_ingreso SMALLINT NOT NULL,
    ip_ingreso INET,
    agente_usuario_ingreso VARCHAR(300),
    dispositivo_ingreso VARCHAR(200),
    fecha_inicio_ingreso TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_fin_ingreso TIMESTAMPTZ,

    CONSTRAINT fk_ingresos_autenticaciones
        FOREIGN KEY (id_autenticacion)
        REFERENCES autenticaciones_persona(id_autenticacion)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_resultado_ingreso CHECK (resultado_ingreso IN (0,1,2))
);

CREATE INDEX idx_ingresos_id_autenticacion ON ingresos (id_autenticacion);

-- =============================================================
-- TABLA: tokens_refresco
-- =============================================================
CREATE TABLE tokens_refresco (
    id_token BIGSERIAL PRIMARY KEY,
    id_ingreso BIGINT NOT NULL,
    hash_token VARCHAR(255) NOT NULL,
    estado_token SMALLINT NOT NULL DEFAULT 1,
    fecha_revocacion_token TIMESTAMPTZ,
    fecha_creacion_token TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_hash_token UNIQUE (hash_token),
    CONSTRAINT fk_tokens_refresco_ingresos
        FOREIGN KEY (id_ingreso)
        REFERENCES ingresos(id_ingreso)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT chk_estado_token CHECK (estado_token IN (0,1,2))
);

CREATE INDEX idx_tokens_refresco_id_ingreso ON tokens_refresco (id_ingreso);

-- =============================================================
-- TABLA: auditoria
-- =============================================================
CREATE TABLE auditoria (
    id_auditoria BIGSERIAL PRIMARY KEY,
    id_persona UUID,
    id_autenticacion UUID,
    id_ingreso BIGINT,
    evento_auditoria VARCHAR(60) NOT NULL,
    ip_auditoria INET,
    agente_usuario_auditoria VARCHAR(300),
    detalle_auditoria JSONB,
    fecha_auditoria TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_auditoria_id_persona ON auditoria (id_persona);
CREATE INDEX idx_auditoria_id_autenticacion ON auditoria (id_autenticacion);
CREATE INDEX idx_auditoria_id_ingreso ON auditoria (id_ingreso);
CREATE INDEX idx_auditoria_fecha ON auditoria (fecha_auditoria);

-- =============================================================
-- OWNER
-- Ajusta 'user_is' segun el usuario real del servidor.
-- =============================================================
ALTER TABLE personas OWNER TO user_is;
ALTER TABLE fotos_persona OWNER TO user_is;
ALTER TABLE autenticaciones_persona OWNER TO user_is;
ALTER TABLE registros_pendientes OWNER TO user_is;
ALTER TABLE roles OWNER TO user_is;
ALTER TABLE permisos OWNER TO user_is;
ALTER TABLE roles_permisos OWNER TO user_is;
ALTER TABLE personas_roles OWNER TO user_is;
ALTER TABLE codigos_verificacion OWNER TO user_is;
ALTER TABLE ingresos OWNER TO user_is;
ALTER TABLE tokens_refresco OWNER TO user_is;
ALTER TABLE auditoria OWNER TO user_is;
