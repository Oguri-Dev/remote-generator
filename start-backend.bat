@echo off
echo ========================================
echo   Iniciando Backend - Generador
echo ========================================
echo.

cd /d "%~dp0BackEnd"

echo Cargando variables de entorno...
set PORT=8099
set MONGODB_URI=mongodb://localhost:27017
set MONGODB_DB=generator
set MONGODB_COLL=config
set FRONTEND_ORIGIN=http://localhost:3069
set ENVIRONMENT=development

echo.
echo Puerto: %PORT%
echo MongoDB: %MONGODB_URI%
echo.
echo Iniciando servidor...
echo.

go run main.go

pause
