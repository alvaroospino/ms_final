Esta carpeta guarda las imagenes base del flujo de autenticacion.

Archivos por defecto:
- `persona-default.svg`
- `empresa-default.svg`

La ruta puede cambiarse con `APP_IMAGE_BASE_DIR`.
Los nombres de archivo por defecto pueden cambiarse con:
- `APP_DEFAULT_PERSONA_IMAGE_NAME`
- `APP_DEFAULT_EMPRESA_IMAGE_NAME`

La respuesta de autenticacion lee estas imagenes, las convierte a base64 y las envia como `fotoApp`.
