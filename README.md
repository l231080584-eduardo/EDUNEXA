# EDUNEXA

EDUNEXA es una plataforma de orientación vocacional con React/Vite, un gateway Node.js/Express y una API de dominio Spring Boot. SQL Server es el motor de datos para desarrollo local y Docker Compose. La evaluación del frontend conserva un resultado local inmediato si la API no responde.

## Requisitos

- Java 21
- SQL Server disponible localmente, o Docker Engine con Docker Compose v2
- Node.js 22 o superior para desarrollo frontend

## Inicio con Docker Compose

Desde la raíz del repositorio:

```sh
cp .env.example .env
```

Define una contraseña propia para `DB_PASSWORD` y arranca los servicios:

```sh
docker compose up --build
```

Compose inicia SQL Server, crea `EDUNEXA_DB`, construye Spring Boot y el gateway Express, y publica Nginx en los puertos 80 y 5173. Express escucha en el puerto 3000 y reenvía las rutas `/api` a Spring Boot; así se conserva la API de dominio y su acceso SQL Server. SQL Server conserva la información en el volumen `mssql_data`. La API carga un catálogo base y actualiza universidades desde el [Directorio nacional de universidades del Sistema de Información Cultural](https://sic.gob.mx/opendata/d/0_universidad_directorio.json), que incluye domicilio y ubicación geográfica. Si el origen no está disponible, conserva el catálogo local. La ficha del conjunto de datos se publica en [datos.gob.mx](https://www.datos.gob.mx/dataset/sistema_informacion_cultural_espacios_culturales/resource/e40c8d2c-ff33-4a8e-b58a-71accd8cddde) con licencia CC BY 4.0.

En Windows puedes arrancar el conjunto con `ejecutar.bat`; el script reconstruye los contenedores en segundo plano y abre el navegador.

| Servicio | URL |
|---|---|
| Frontend | http://localhost |
| Frontend (puerto alternativo) | http://localhost:5173 |
| Gateway Express | http://localhost:3000/health |
| API de negocio | http://localhost/api/v1 |
| Health check Spring | disponible dentro de Docker en `spring-api:8080/api/v1/health` |

## Desarrollo local

Configura SQL Server, crea la base `EDUNEXA_DB` una vez (`CREATE DATABASE EDUNEXA_DB;`) y define `DB_URL`, `DB_USER` y `DB_PASSWORD` (puedes partir de `.env.example`). Compose crea esa base automáticamente.

API:

```sh
./gradlew bootRun
```

En Windows:

```powershell
.\gradlew.bat bootRun
```

Frontend, en otra terminal:

```sh
cd frontend
npm ci
npm run dev
```

Inicia también el gateway Express (`cd backend && npm ci && npm run dev`) y la API Java con `./gradlew bootRun`. Vite sirve la interfaz en `http://localhost:5173` y reenvía `/api` al gateway del puerto 3000.

## Configuración

| Variable | Uso |
|---|---|
| `DB_URL` | JDBC de SQL Server; por defecto apunta a `localhost:1433/EDUNEXA_DB` |
| `DB_USER` / `DB_PASSWORD` | Credenciales SQL Server |
| `DB_NAME` | Base de datos fija que inicializa Compose: `EDUNEXA_DB` |
| `PORT` | Puerto interno de Spring Boot; por defecto `8080` |
| `BACKEND_PORT` | Puerto publicado para el gateway Express; por defecto `3000` |
| `FRONTEND_HTTP_PORT` | Puerto HTTP de Nginx; por defecto `80` |
| `FRONTEND_DEV_PORT` | Puerto alternativo de Nginx; por defecto `5173` |
| `CORS_ORIGIN` | Orígenes permitidos separados por coma; acepta patrones como `*` si se configura expresamente |
| `EXTERNAL_API_URL` | Origen del catálogo de instituciones |
| `INGESTION_SOLO_TECNM` | Limita la ingesta a instituciones TecNM cuando es `true` |
| `INGESTION_ENABLED` | Activa la actualización del catálogo al arrancar; por defecto `true` |

### Récord de partida y Supabase (opcional)

El perfil, el resultado, la clase elegida y las tres instituciones recomendadas se conservan en el navegador aunque no haya conexión. Para habilitar sincronización de cuentas y récords entre dispositivos:

1. Crea un proyecto Supabase y copia `frontend/.env.example` a `frontend/.env.local`.
2. Completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con la URL del proyecto y su clave pública anon/publishable. No uses una clave `service_role` en el frontend.
3. Ejecuta [`supabase/schema.sql`](supabase/schema.sql) una vez en el SQL Editor de Supabase. Activa la confirmación de correo y configura como URL permitida la dirección local de Vite.
4. Reinicia `npm run dev`. El registro e inicio de sesión aparecen en la tarjeta `MEMORY CARD`; el progreso se sincroniza al completar una partida y al guardar el mapa.

Sin estas variables, EDUNEXA permanece en modo local y no intenta autenticar ni enviar récords a un servicio remoto.

## Rutas principales

Las rutas de negocio usan el prefijo `/api/v1`:

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/usuarios/registro` | Registra una cuenta |
| `POST` | `/usuarios/login` | Valida credenciales |
| `POST` | `/test/evaluate` | Calcula y guarda la evaluación |
| `POST` | `/test/arcade/evaluate?nickname=Ada` | Devuelve recomendación y narrativa de NONI |
| `GET` | `/evaluaciones/compatibilidad` | Lista instituciones disponibles con coordenadas y dirección |
| `GET` | `/universidades` | Devuelve el catálogo de instituciones |
| `GET` | `/health` | Comprueba la conexión a la base de datos |

Los errores usan JSON estructurado con `message`, `timestamp` y `status`; no incluyen trazas internas.

## Compilación

```sh
./gradlew build
```

En Windows, usa `.\gradlew.bat build` desde PowerShell. Para el frontend, ejecuta `npm run build` dentro de `frontend/`.

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta [LICENSE](LICENSE).
