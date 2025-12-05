# Simulador de fútbol (Frontend)

Aplicación React + Vite para simular partidos y administrar catálogos de equipos y jugadores. Este README documenta cómo se realizan las peticiones al backend, cómo se almacenan los estados de carga/error y cómo se mantiene el JWT para las llamadas autenticadas.

## Cliente HTTP
- Archivo: `src/api/httpClient.js`.
- Base URL: `VITE_API_URL` (fallback `http://localhost:8080`).
- El token JWT se inyecta en el header `Authorization: Bearer <token>` mediante `setAuthToken` cuando la sesión cambia (`SessionProvider`).
- El helper `httpRequest(path, { method, body })` serializa automáticamente el cuerpo JSON y propaga mensajes de error del backend.

## Servicios de datos
- `src/api/equiposService.js`: CRUD de equipos contra `/api/equipos`.
- `src/api/jugadoresService.js`: CRUD de jugadores contra `/api/jugadores`.
- Todos los servicios usan `httpRequest`, por lo que heredan el manejo de base URL y JWT.

## Flujo de datos y estados
1. **Autenticación** (`src/session/SessionProvider.jsx`)
   - Login/registro llaman a `/api/auth/login` y `/api/auth/register`.
   - Al recibir `{ token, username, role }`, se persiste en `localStorage` y se llama a `setAuthToken(token)` para que todas las peticiones posteriores incluyan el JWT.
2. **Carga de catálogos** (`src/pages/Catalogos.jsx`)
   - `useAsyncResource` controla `loading` y `error` para equipos y jugadores.
   - `fetchEquipos` y `fetchJugadores` poblan el estado local `items`. Los mensajes de error se muestran en pantalla.
3. **Mutaciones**
   - Crear/actualizar elimina la bandera `saving*`, envía el payload al servicio y actualiza el estado local (`setItems`) sin recargar la página.
   - Eliminar remueve el item del array local tras completar la petición DELETE.
4. **Estados globales vs locales**
   - El JWT y el usuario viven en el contexto de sesión (`useSession`), accesible desde cualquier componente.
   - Los catálogos usan estado local para representar la tabla en pantalla y responder de inmediato a las mutaciones.

## Vistas afectadas
- Nueva pantalla protegida `/catalogos` (solo rol `ADMIN`) para gestionar equipos y jugadores con formularios, errores y estados de carga.
- La navegación muestra el enlace "Catálogos" cuando el usuario autenticado tiene rol `ADMIN`.

## Desarrollo
```bash
npm install
npm run dev
```

Configura `VITE_API_URL` en un archivo `.env` para apuntar al backend adecuado.
