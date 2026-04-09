# Playground React para endpoints

Cliente React para probar el microservicio de seguridad sin Postman.

## Flujo recomendado

1. Levanta el backend en `http://localhost:3000`.
2. Entra a esta carpeta:
   `cd frontend-tester`
3. Instala dependencias:
   `npm install`
4. Inicia el playground:
   `npm run dev`

## Qué puedes probar

- Registro local
- Inicio de sesión
- Refresh token
- Logout y logout global
- `/api/auth/me`
- Envío y confirmación de verificación de correo
- Recuperación y cambio de clave
- Requests manuales a cualquier endpoint

## Notas

- La base URL del API se puede cambiar desde la interfaz.
- Los tokens se guardan en `localStorage`.
- Si la respuesta del backend incluye `accessToken` o `refreshToken`, la app los captura automáticamente.
