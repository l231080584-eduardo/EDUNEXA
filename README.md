# EDUNEXA — Plataforma Integrada de Orientación Vocacional Tecnológica

Plataforma full-stack de orientación vocacional para estudiantes de nivel medio superior. Incluye evaluaciones vocacionales, un asistente de voz y consulta de oferta educativa universitaria, con énfasis en el TecNM Plantel Iztapalapa I.

## Equipo

- Desarrollador Backend y Arquitectura de Base de Datos
- Desarrollador Frontend y Diseño UX/UI

## Tecnologías

- **Backend:** Java 21, Spring Boot 3.5.6, Spring Data JPA, Jakarta Validation
- **Base de datos:** SQL Server
- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons y Web Speech API
- **Seguridad y calidad:** BCrypt, CORS restrictivo y cabeceras de seguridad

## Requisitos previos

- JDK 21 o superior
- Node.js 20 o superior y npm
- SQL Server accesible desde el backend (predeterminadamente en el puerto 1433)
- Gradle Wrapper incluido en el repositorio

## Instalación y configuración

1. Clona el repositorio y entra a su directorio:

   ```powershell
   git clone <URL_DEL_REPOSITORIO>
   cd EDUNEXA
   ```

2. Configura el backend. Usa `.env.example` como referencia y define sus variables en el entorno del proceso que ejecutará Gradle. Spring Boot no carga un archivo `.env` automáticamente. En PowerShell, por ejemplo:

   ```powershell
   $env:DB_URL = "jdbc:sqlserver://localhost:1433;databaseName=ENUDEXA_DB;encrypt=false;trustServerCertificate=true"
   $env:DB_USER = "sa"
   $env:DB_PASSWORD = "<contraseña-local>"
   $env:CORS_ORIGIN = "http://localhost:5173"
   ```

   Los valores predeterminados de `application.properties` están destinados al desarrollo local; define credenciales seguras mediante variables para otros entornos.

3. Inicia el backend desde la raíz:

   ```powershell
   .\gradlew.bat bootRun
   ```

   La API escucha por defecto en `http://localhost:8080/api/v1`. Al iniciar valida las propiedades requeridas y la conexión a SQL Server.

4. En otra terminal, instala y ejecuta el frontend:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

   El cliente usa `VITE_API_BASE_URL`, cuyo valor predeterminado es `http://localhost:8080/api/v1`.

## Variables de entorno

| Variable | Descripción | Valor predeterminado |
|---|---|---|
| `PORT` | Puerto del backend | `8080` |
| `DB_URL` | URL JDBC de SQL Server | `jdbc:sqlserver://localhost:1433;databaseName=ENUDEXA_DB;encrypt=false;trustServerCertificate=true` |
| `DB_USER` | Usuario de SQL Server | `sa` |
| `DB_PASSWORD` | Contraseña de SQL Server | `Upiicsa1` (solo desarrollo local; reemplazar fuera del entorno local) |
| `CORS_ORIGIN` | Origen permitido para solicitudes cross-origin | `http://localhost:5173` |
| `EXTERNAL_API_URL` | URL del recurso oficial de universidades CDMX | Recurso JSON de datos abiertos CDMX configurado en `.env.example` |
| `VITE_API_BASE_URL` | URL base del backend utilizada por Vite | `http://localhost:8080/api/v1` |

## Endpoints de la API

Todas las rutas están bajo `/api/v1`.

| Método | Ruta | Descripción | Respuestas relevantes |
|---|---|---|---|
| `POST` | `/usuarios/registro` | Registrar usuario | `201`, `400` |
| `POST` | `/usuarios/login` | Iniciar sesión | `200`, `400`, `401` |
| `GET` | `/usuarios/{id}` | Consultar usuario por UUID | `200`, `404` |
| `POST` | `/test/evaluate` | Procesar evaluación vocacional | `200`, `400` |
| `POST` | `/test/arcade/evaluate?nickname=Ada` | Evaluación arcade con recomendación de carrera, perfil egresado, universidad, mapa y narrativa de NONI | `200`, `400`, `500` |
| `GET` | `/test/resultados` | Listar resultados, opcionalmente por `usuarioId` | `200` |
| `GET` | `/evaluaciones/compatibilidad` | Consultar compatibilidad de universidades | `200` |
| `POST` | `/evaluaciones` | Crear resultado de evaluación | `201`, `400` |
| `GET` | `/evaluaciones` | Listar resultados de evaluación | `200` |
| `GET` | `/evaluaciones/{id}` | Consultar resultado por ID | `200`, `404` |
| `PUT` | `/evaluaciones/{id}` | Actualizar resultado | `200`, `404` |
| `DELETE` | `/evaluaciones/{id}` | Eliminar resultado | `204`, `404` |
| `GET` | `/universidades` | Listar universidades | `200` |
| `GET` | `/universidades/tecnm` | Listar instituciones TecNM | `200` |
| `GET` | `/universidades/iztapalapa1` | Consultar TecNM Iztapalapa I | `200` |

Las respuestas exitosas usan `ApiResponse<T>` y los errores controlados usan `ErrorResponse`. No hay actualmente un endpoint DELETE de usuarios.

El catálogo de carreras (15 perfiles) se inicializa al arrancar cuando la tabla `carreras` está vacía. Las universidades de la fuente oficial se ingieren después y se vinculan con áreas académicas por reglas de nombre. Los IDs UUID de `Carrera` y `Universidad` requieren una base de datos compatible; respalda y migra las tablas existentes antes de desplegar esta revisión sobre una base con IDs `BIGINT`.

## Pruebas

Ejecuta las pruebas del backend:

```powershell
.\gradlew.bat test
```

La colección de solicitudes Postman está en `docs/EDUNEXA_Postman_Collection.json`. La prueba `DemoApplicationTests` requiere corregir su paquete o indicar `EnudexaApplication` explícitamente para que encuentre la configuración Spring.

## Licencia

Distribuido bajo la Licencia MIT. Consulta `LICENSE`.
