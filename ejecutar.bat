@echo off
setlocal
cd /d "%~dp0"

docker compose down --remove-orphans
if errorlevel 1 goto :error
docker compose up --build -d
if errorlevel 1 goto :error

echo ==================================================
echo Plataforma EDUNEXA lista en: http://localhost
echo ==================================================
start "" "http://localhost"
exit /b 0

:error
echo No se pudo iniciar EDUNEXA. Verifica Docker Desktop y revisa los mensajes anteriores.
pause
exit /b 1
