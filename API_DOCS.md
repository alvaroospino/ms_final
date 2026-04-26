# API Microservicio de Seguridad — PAYGO

Documentación de referencia para la integración desde la app Android.

---

## Información general

| Parámetro | Valor |
|---|---|
| Base URL (desarrollo) | `http://<IP_SERVIDOR>:3060` |
| Content-Type | `application/json` |
| Autenticación | `Authorization: Bearer <tokenApp>` |

> El `tokenApp` se obtiene al completar el login o registro. Expira en **15 minutos**. Usar el refresh token para renovarlo sin que el usuario vuelva a iniciar sesión.

---

## Formato de respuesta

Todas las respuestas siguen esta estructura:

```json
{
  "codigoEstado": 200,
  "mensaje": "Descripción del resultado",
  "datos": { ... },
  "fechaHora": "2026-04-24T10:00:00.000Z"
}
```

Los errores retornan:

```json
{
  "error": "NombreDelError",
  "message": "Descripción legible del error"
}
```

---

## Flujo de registro (usuario nuevo)

### Paso 1 — Iniciar registro

Envía un código de verificación al correo o celular indicado.

**`POST /api/auth/register/iniciar`**

```json
{
  "identificador": "correo@ejemplo.com"
}
```

También acepta número de celular:

```json
{
  "identificador": "3025537852"
}
```

**Respuesta `200`**

```json
{
  "message": "Codigo enviado al correo",
  "data": {
    "identificador": "correo@ejemplo.com",
    "tipoIdentificador": "correo",
    "expiraEn": "2026-04-24T10:15:00.000Z",
    "mensaje": "Codigo enviado al correo"
  }
}
```

**Errores posibles**

| Código | Error | Causa |
|---|---|---|
| `400` | `ValidationError` | identificador vacío o inválido |
| `409` | `PersonaAlreadyExistsError` | ya existe una cuenta con ese identificador |

---

### Paso 2 — Verificar código de registro

**`POST /api/auth/register/verificar`**

```json
{
  "identificador": "3025537852",
  "codigo": "847291"
}
```

**Respuesta `200`**

```json
{
  "message": "Codigo verificado correctamente",
  "data": { "success": true }
}
```

**Errores posibles**

| Código | Error | Causa |
|---|---|---|
| `400` | `CodigoInvalidoError` | código incorrecto o expirado |
| `429` | `CodigoAgotadoError` | se superaron los 5 intentos |

---

### Paso 3 — Establecer clave (opcional / legacy)

> Este paso es parte del flujo antiguo. Con el nuevo login por código ya no es requerido para iniciar sesión, pero aún puede usarse si se desea guardar una contraseña.

**`POST /api/auth/register/establecer-clave`**

```json
{
  "identificador": "3025537852",
  "clave": "MiClave123"
}
```

Requisitos de la clave: mínimo 8 caracteres, al menos una letra y un número.

**Respuesta `201`**

```json
{
  "message": "Cuenta registrada correctamente",
  "data": {
    "id": "uuid-persona",
    "identificador": "3025537852",
    "tipoIdentificador": "celular"
  }
}
```

---

## Flujo de login por código (sin contraseña) ✅ NUEVO

Este es el flujo principal para iniciar sesión en la app.

### Paso 1 — Solicitar código de acceso

Envía un código de 6 dígitos al correo o celular. El código expira en **10 minutos**.

**`POST /api/auth/login/solicitar-codigo`**

```json
{
  "identificador": "3025537852"
}
```

También acepta correo:

```json
{
  "identificador": "correo@ejemplo.com"
}
```

**Respuesta `200`**

```json
{
  "message": "Codigo de acceso enviado al celular",
  "data": {
    "mensaje": "Codigo de acceso enviado al celular",
    "tipoIdentificador": "celular",
    "expiraEn": "2026-04-24T10:10:00.000Z"
  }
}
```

**Errores posibles**

| Código | Error | Causa |
|---|---|---|
| `400` | `ValidationError` | identificador inválido |
| `401` | `InvalidCredentialsError` | no existe cuenta con ese identificador |
| `423` | `AccountBlockedError` | cuenta bloqueada temporalmente |

---

### Paso 2 — Verificar código e iniciar sesión

**`POST /api/auth/login/verificar-codigo`**

```json
{
  "identificador": "3025537852",
  "codigo": "847291"
}
```

**Respuesta `200`**

```json
{
  "codigoEstado": 200,
  "mensaje": "Autenticacion exitosa",
  "datos": {
    "tokenApp": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "fotoApp": null,
    "expiraEn": 1745491200000,
    "refreshExpiraEn": 1746096000000,
    "esEmpresa": false
  },
  "fechaHora": "2026-04-24T10:00:00.000Z"
}
```

| Campo | Descripción |
|---|---|
| `tokenApp` | JWT para autenticar peticiones. Incluir en el header `Authorization: Bearer <tokenApp>` |
| `refreshToken` | Token para renovar el `tokenApp` cuando expire |
| `expiraEn` | Timestamp en milisegundos de expiración del `tokenApp` |
| `refreshExpiraEn` | Timestamp en milisegundos de expiración del `refreshToken` |
| `esEmpresa` | `true` si la cuenta tiene rol de empresa |
| `fotoApp` | Imagen de perfil en base64 (puede ser `null`) |

**Errores posibles**

| Código | Error | Causa |
|---|---|---|
| `400` | `CodigoInvalidoError` | código incorrecto o expirado |
| `400` | `ValidationError` | campos vacíos |
| `401` | `InvalidCredentialsError` | no existe cuenta con ese identificador |
| `423` | `AccountBlockedError` | cuenta bloqueada; incluye `blockedUntil` en la respuesta |
| `429` | `CodigoAgotadoError` | se superaron los 5 intentos con ese código |

---

## Gestión de tokens

### Renovar token de acceso

Llamar antes de que expire el `tokenApp` (campo `expiraEn`).

**`POST /api/auth/refresh`**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuesta `200`** — misma estructura que el login exitoso.

---

### Cerrar sesión

**`POST /api/auth/logout`**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuesta `200`**

```json
{
  "message": "Sesion cerrada correctamente",
  "data": { "success": true }
}
```

---

### Cerrar todas las sesiones

Requiere token válido.

**`POST /api/auth/logout-global`**  
Header: `Authorization: Bearer <tokenApp>`

**Respuesta `200`**

```json
{
  "message": "Todas las sesiones cerradas correctamente",
  "data": { ... }
}
```

---

## Información del usuario

### Obtener datos del usuario autenticado (yo mismo)

Devuelve la información del usuario dueño del token.

**`GET /api/auth/me`**  
Header: `Authorization: Bearer <tokenApp>`

**Respuesta `200`**

```json
{
  "message": "Usuario autenticado",
  "data": {
    "id": "uuid-persona",
    "authId": "uuid-autenticacion",
    "identificador": "3025537852",
    "tipoIdentificador": "celular",
    "correo": null,
    "nombres": "Juan",
    "apellidos": "Pérez",
    "nombreCompleto": "Juan Pérez",
    "estado": 1,
    "activa": true,
    "esEmpresa": false,
    "roles": ["USER"],
    "permisos": [],
    "expiraEn": 1745491200000
  }
}
```

---

### Obtener datos completos de una persona por ID ✅ NUEVO

Devuelve toda la información disponible de un usuario. Solo accesible con sesión activa.

**`GET /api/personas/:id`**  
Header: `Authorization: Bearer <tokenApp>`

Ejemplo: `GET /api/personas/550e8400-e29b-41d4-a716-446655440000`

**Respuesta `200`**

```json
{
  "message": "Persona consultada correctamente",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nombres": "Juan",
    "apellidos": "Pérez",
    "nombreCompleto": "Juan Pérez",
    "correo": "juan@ejemplo.com",
    "celular": "3025537852",
    "identificador": "3025537852",
    "tipoIdentificador": "celular",
    "verificado": true,
    "estado": 1,
    "activa": true,
    "ultimoIngreso": "2026-04-24T10:00:00.000Z",
    "roles": ["USER"],
    "permisos": [],
    "fechaCreacion": "2026-01-01T00:00:00.000Z",
    "fechaActualizacion": "2026-04-24T10:00:00.000Z"
  }
}
```

| Campo | Descripción |
|---|---|
| `identificador` | Correo o celular usado para registrarse |
| `tipoIdentificador` | `"correo"` o `"celular"` |
| `verificado` | `true` si el identificador fue verificado con código |
| `estado` | `1` = activo, `0` = inactivo |
| `activa` | `true` si la cuenta puede iniciar sesión |
| `ultimoIngreso` | Fecha/hora del último inicio de sesión exitoso (`null` si nunca) |

**Errores posibles**

| Código | Error | Causa |
|---|---|---|
| `401` | `InvalidTokenError` | sin token o token expirado |
| `404` | `NotFoundError` | no existe persona con ese ID |

---

## Sesiones activas

### Listar mis sesiones

**`GET /api/auth/sessions`**  
Header: `Authorization: Bearer <tokenApp>`

**Respuesta `200`**

```json
{
  "message": "Sesiones consultadas correctamente",
  "data": [
    {
      "idIngreso": 42,
      "idAutenticacion": "uuid",
      "resultado": 1,
      "ip": "192.168.1.1",
      "agenteUsuario": "okhttp/4.9.0",
      "dispositivo": null,
      "fechaInicio": "2026-04-24T10:00:00.000Z",
      "fechaFin": null,
      "activa": true
    }
  ],
  "total": 1
}
```

---

## Verificación de correo (post-registro)

Para cuentas registradas con correo que no han verificado aún.

### Enviar código de verificación

**`POST /api/auth/verificar-correo/enviar`**  
Header: `Authorization: Bearer <tokenApp>`  
Sin body.

### Confirmar código

**`POST /api/auth/verificar-correo/confirmar`**  
Header: `Authorization: Bearer <tokenApp>`

```json
{
  "codigo": "847291"
}
```

---

## Tabla de errores HTTP

| Código HTTP | Cuándo ocurre |
|---|---|
| `400` | Campos inválidos, código incorrecto, validación fallida |
| `401` | Sin token, token expirado, credenciales incorrectas |
| `403` | Sin permisos para el recurso |
| `404` | Recurso no encontrado |
| `409` | Conflicto: cuenta ya existe, correo ya verificado |
| `423` | Cuenta bloqueada por múltiples intentos fallidos |
| `429` | Código agotado (5 intentos) |
| `500` | Error interno del servidor |
| `502` | Error al comunicarse con servicio externo (SMS) |

---

## Flujo recomendado para la app Android

```
┌─────────────────────────────────────────────────────┐
│                   USUARIO NUEVO                     │
│                                                     │
│  1. POST /api/auth/register/iniciar                 │
│     { identificador: "correo o celular" }           │
│                    ↓                                │
│  2. POST /api/auth/register/verificar               │
│     { identificador, codigo }                       │
│                    ↓                                │
│  ✅ Registro completo — redirigir al login          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                  USUARIO EXISTENTE                  │
│                                                     │
│  1. POST /api/auth/login/solicitar-codigo           │
│     { identificador: "correo o celular" }           │
│                    ↓                                │
│  2. POST /api/auth/login/verificar-codigo           │
│     { identificador, codigo }                       │
│                    ↓                                │
│  ✅ Guardar tokenApp + refreshToken                 │
│     Guardar expiraEn para saber cuándo renovar      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│               RENOVACIÓN DE TOKEN                   │
│                                                     │
│  Cuando expiraEn < Date.now():                      │
│  POST /api/auth/refresh                             │
│  { refreshToken }                                   │
│                    ↓                                │
│  ✅ Nuevo tokenApp + nuevo refreshToken             │
└─────────────────────────────────────────────────────┘
```

---

*Generado: 2026-04-24 — Microservicio de Seguridad PAYGO*
