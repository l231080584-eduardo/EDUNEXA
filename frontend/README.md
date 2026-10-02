# EDUNEXA frontend

Frontend React + Vite, ubicado en `frontend/` para mantenerlo separado del backend Spring Boot.

```bash
cd frontend
npm install
npm run dev
```

La URL de la API se puede cambiar con `VITE_API_BASE_URL` (por defecto `http://localhost:8080/api/v1`). El backend ofrece registro/login en `/usuarios/registro` y `/usuarios/login`, evaluación en `/test/evaluate` y universidades compatibles en `/evaluaciones/compatibilidad`.

## Identidad de usuario

El usuario puede crear una cuenta o iniciar sesión desde el diálogo de identidad. El UUID devuelto por la API se conserva en el almacenamiento local para asociar la evaluación; la contraseña nunca se guarda en el navegador.

La evaluación calcula las cuatro métricas desde las respuestas Likert y envía `vectorRespuestas`, `topCarrerasJson` y `reporteIa` como cadenas JSON/texto, de acuerdo con `TestEvaluationRequest`.
