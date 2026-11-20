# EDUNEXA frontend

Frontend React + Vite, ubicado en `frontend/` para mantenerlo separado del backend Spring Boot.

```bash
cd frontend
npm install
npm run dev
```

La URL de la API se cambia con `VITE_API_BASE_URL` (por defecto `/api/v1`). En Vite, las peticiones `/api` se envían al gateway Node local; en producción configura la URL HTTPS pública del backend, por ejemplo `https://api.example.com/api/v1`.

## Despliegue del frontend en Vercel

Configura `frontend/` como raíz del proyecto, `npm run build` como comando de construcción y `dist` como directorio de salida. `vercel.json` dirige las rutas de React Router a la aplicación.

Define en el entorno de producción `VITE_API_BASE_URL`, `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`; `frontend/.env.production.example` muestra el formato. La URL del backend debe ser HTTPS, accesible desde Vercel y permitir el dominio publicado en su configuración CORS. La clave `anon` de Supabase es pública y debe estar protegida por políticas RLS; nunca publiques una clave `service_role`.

El repositorio conserva la API de dominio Spring Boot detrás del gateway Node y el datasource SQL Server configurado para el stack actual. Supabase ya se usa para autenticación y sincronización de partidas cuando está configurado. La API y la base de datos deben desplegarse y configurarse por separado antes de considerar listo el entorno de producción.

## Identidad de usuario

El usuario puede crear una cuenta o iniciar sesión desde el diálogo de identidad. El UUID devuelto por la API se conserva en el almacenamiento local para asociar la evaluación; la contraseña nunca se guarda en el navegador.

La evaluación calcula las cuatro métricas desde las respuestas Likert y envía `vectorRespuestas`, `topCarrerasJson` y `reporteIa` como cadenas JSON/texto, de acuerdo con `TestEvaluationRequest`.
