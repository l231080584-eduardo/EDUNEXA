# Auditoría de Configuración y Buenas Prácticas - Proyecto EDUNEXA

**Fecha:** Octubre 2026  
**Sistema:** EDUNEXA (Plataforma de Orientación Vocacional Tecnológica)  
**Stack:** Java 21, Spring Boot 3.5.6, React + Vite, SQL Server

## Matriz de Auditoría Inicial vs. Estado Final

| # | Criterio de Revisión | Cómo comprobarlo | Estado Final | Observaciones / Implementación |
|---|---|---|:---:|---|
| 1 | Existe `.gitignore` que excluye `.env` y dependencias | Abrir `.gitignore` en la raíz | ✅ Cumple | Excluye `.env`/`.env.*` salvo las plantillas, `frontend/node_modules/`, `frontend/dist/`, `target/`, `.idea/` y `.gradle/`. |
| 2 | Existe `.env` y no hay contraseñas en código | Buscar credenciales y revisar archivos locales | ⚠️ Parcial | Se incluye `.env.example`, no un `.env` con secretos. Spring Boot no carga `.env` automáticamente: las variables deben definirse en el entorno de ejecución. `application.properties` conserva el valor predeterminado indicado por el proyecto para desarrollo local; debe sustituirse en despliegues. |
| 3 | Existe `.env.example` sin valores reales | Revisar la raíz y `frontend/` | ✅ Cumple | Hay plantillas de backend y frontend; la contraseña de la plantilla es un marcador, no una credencial funcional. |
| 4 | Endpoints con nombres claros, en plural y consistentes | Listar rutas de controladores | ⚠️ Parcial | Se usan recursos plurales como `/usuarios`, `/evaluaciones` y `/universidades`; existe además la acción `/test/evaluate`. Las rutas efectivas incluyen el contexto `/api/v1`. |
| 5 | Respuestas JSON con estructura consistente | Probar rutas distintas | ✅ Cumple | Los éxitos usan `ApiResponse<T>` y los errores controlados `ErrorResponse`. |
| 6 | Los endpoints que reciben datos validan la entrada | Enviar datos vacíos o con formato erróneo | ✅ Cumple | `@Valid` está aplicado en los cuerpos de solicitud y los DTOs de registro, inicio de sesión y evaluación usan Jakarta Validation. |
| 7 | Respuestas usan códigos HTTP correctos | Inspeccionar estado HTTP | ⚠️ Parcial | Se utilizan `200`, `201`, `204`, `400`, `401`, `404`, `502` y `500` según el caso. No existe endpoint DELETE de usuarios; el DELETE disponible es `/evaluaciones/{id}`. |
| 8 | Manejo de errores centralizado | Provocar una excepción en la API | ✅ Cumple | `GlobalExceptionHandler` (`@RestControllerAdvice`) produce respuestas estandarizadas. |
| 9 | Servidor responde de forma controlada a ruta inexistente (404) | Visitar `/api/v1/ruta-inexistente` | ✅ Configurado | Se activa `NoHandlerFoundException` y el handler devuelve `ErrorResponse` 404; conviene comprobarlo mediante prueba de integración en el entorno de ejecución. |
| 10 | CORS permite solo orígenes necesarios | Inspeccionar `Access-Control-Allow-Origin` | ✅ Cumple | `WebConfig` permite un origen configurable con `cors.allowed-origins`; el valor predeterminado es `http://localhost:5173`. |
| 11 | Cabeceras de seguridad básicas | Revisar respuesta HTTP | ✅ Cumple | `SecurityHeadersFilter` establece `X-Content-Type-Options: nosniff` y `X-Frame-Options: DENY`, y elimina cabeceras identificadoras. |
| 12 | HTML con `<head>` completo | Abrir `frontend/index.html` | ✅ Cumple | Incluye charset, viewport, tema, descripción y título. |
| 13 | Fuentes alojadas localmente, sin Google Fonts CDN | Buscar `googleapis` y revisar fuentes | ⚠️ Pendiente de verificación | El HTML contiene metadatos; la auditoría no encontró evidencia comprobada de fuentes locales bajo `frontend/public/fonts/`. |
| 14 | Página 404 personalizada | Abrir una ruta no existente del frontend | ⚠️ Pendiente | No se verificó un componente de ruta no encontrada ni un `404.html` en el frontend. |
| 15 | Existe archivo `LICENSE` | Revisar la raíz | ✅ Cumple | Se incluye licencia MIT. |
| 16 | Existe `README.md` con instrucciones completas | Revisar la raíz | ✅ Cumple | Documenta requisitos, configuración, inicio, endpoints, variables y pruebas. |
| 17 | Logs de peticiones sin exponer datos sensibles | Realizar peticiones y revisar logs | ⚠️ Parcial | El handler registra excepciones inesperadas con SLF4J sin incluir explícitamente datos de solicitud; no se configuró un logger específico de cada petición. |
| 18 | Versiones de dependencias congeladas | Revisar `package-lock.json` y `build.gradle` | ⚠️ Parcial | Spring Boot está fijado en `3.5.6` y el frontend tiene `package-lock.json`; Gradle administra varias dependencias transitivas mediante BOM, no con versiones explícitas por dependencia. |

## Observaciones de configuración

- `.env.example` sirve como referencia. Para `bootRun`, exporta las variables en el entorno de Gradle; copiar el archivo a `.env` por sí solo no las carga.
- `EXTERNAL_API_URL` configura el recurso JSON de universidades CDMX. El servicio carga ese recurso por `RestClient`; `IngestionService` evita consultas por registro y persiste universidades y vínculos con JDBC batch en una transacción.
- El catálogo de 15 carreras y sus perfiles se carga cuando `carreras` está vacía; la ingesta de universidades se ejecuta después y enlaza carreras por reglas heurísticas de nombre.
- Los identificadores de `Carrera` y `Universidad` cambiaron a UUID para el nuevo modelo. La actualización automática de Hibernate no migra de forma segura una base ya poblada con IDs `BIGINT`; requiere respaldo y migración explícita.
- La suite contiene una prueba de contexto ubicada en `com.orinetador.demo` que no encuentra la configuración `com.enudexa.EnudexaApplication`; esa prueba debe corregir su paquete o declarar explícitamente la clase de aplicación.
- La auditoría refleja el estado inspeccionado y distingue los elementos configurados de los que requieren verificación o implementación adicional.
