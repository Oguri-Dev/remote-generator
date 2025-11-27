@echo off
echo ========================================
echo   Iniciando Frontend - Generador
echo ========================================
echo.

cd /d "%~dp0FrontEnd"

echo Verificando archivo .env...
if exist .env (
    echo [OK] Archivo .env encontrado
) else (
    echo [AVISO] Creando .env desde .env.example
    copy .env.example .env
)

echo.
echo Iniciando servidor de desarrollo Vite...
echo Puerto: 3069
echo.

pnpm dev

pause
