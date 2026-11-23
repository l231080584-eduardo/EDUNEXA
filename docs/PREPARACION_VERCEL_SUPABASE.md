# Preparación de EDUNEXA para Vercel + Supabase

> Preparación solamente: no crear proyectos remotos ni hacer despliegues hasta que se autorice.

## Estado actual

- El frontend Vite ya tiene `frontend/vercel.json`, `.env.production.example` y los scripts `build`/`preview`.
- El frontend ya permite usar Supabase Auth y sincronizar récords de juego en `game_records` con RLS. El SQL está en `supabase/schema.sql`.
- La API de negocio es Spring Boot, detrás de un gateway Node. En local, la API se conecta a SQL Server y el gateway espera poder acceder a Spring por `SPRING_API_URL`.
- Vercel puede alojar el frontend estático; no basta por sí solo para ejecutar este backend Spring persistente. Hace falta alojar la API y resolver la migración de la base de negocio SQL Server a PostgreSQL antes del despliegue completo.

## Cuando se autorice el despliegue

1. Crear/configurar el proyecto Supabase y revisar el esquema y las políticas de `supabase/schema.sql`.
2. Migrar el esquema y los datos de negocio desde SQL Server a PostgreSQL; ajustar entidades, consultas, driver y configuración Spring. No poner contraseñas ni claves privadas en Git.
3. Alojar Spring y el gateway en un servicio que soporte Java y procesos persistentes, configurar sus secretos y permitir el dominio de Vercel en CORS.
4. En Vercel, importar el repositorio con **Root Directory** `frontend`, build `npm run build` y output `dist`.
5. Configurar las variables del frontend a nivel de proyecto: `VITE_API_BASE_URL` con la URL pública de la API terminada en `/api/v1`; `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con valores públicos del proyecto. Nunca usar `service_role` en el frontend.
6. Configurar las URL de redirección de autenticación en Supabase para producción y pruebas, revisar el acceso a Data API y probar registro, inicio de sesión, evaluación, recomendaciones y sincronización de récords.

## Pruebas antes de producción

- Mantener Vite, Spring, gateway y SQL Server locales hasta completar la migración y las pruebas funcionales.
- Usar un proyecto Supabase separado para pruebas si se quiere validar autenticación/sincronización, sin guardar datos reales.
- Confirmar el health check de la API, CORS para el dominio previsto, RLS de cada tabla expuesta y que las claves privadas no aparezcan en el bundle del frontend.
