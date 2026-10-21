#!/bin/sh
set -eu

export DB_PASSWORD="${DB_PASSWORD:-Upiicsa1}"
export DB_HOST="${DB_HOST:-db}"
export DB_PORT="${DB_PORT:-1433}"
export DB_USER="${DB_USER:-sa}"
export DB_NAME="${DB_NAME:-ENUDEXA_DB}"
export DB_URL="${DB_URL:-jdbc:sqlserver://${DB_HOST}:${DB_PORT};databaseName=${DB_NAME};encrypt=false;trustServerCertificate=true}"

echo "Esperando SQL Server en ${DB_HOST}:${DB_PORT}..."
java -cp "/app/bootstrap:/app/jdbc/*" DatabaseBootstrap

echo "Iniciando API Spring y gateway Node..."
PORT=8080 java -XX:MaxRAMPercentage=65.0 -jar /app/app.jar &
SPRING_PID=$!
terminate() {
  kill "$SPRING_PID" 2>/dev/null || true
  wait "$SPRING_PID" 2>/dev/null || true
}
trap terminate INT TERM EXIT

attempt=0
until curl --fail --silent http://127.0.0.1:8080/api/v1/health >/dev/null; do
  if ! kill -0 "$SPRING_PID" 2>/dev/null; then
    echo "La API Spring terminó antes de quedar lista." >&2
    exit 1
  fi
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 90 ]; then
    echo "La API Spring no respondió dentro del tiempo esperado." >&2
    exit 1
  fi
  sleep 2
done

exec node /app/gateway/src/index.js
