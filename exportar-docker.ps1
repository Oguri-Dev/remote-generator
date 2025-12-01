# ============================================
# Script para Exportar Imágenes Docker
# ============================================
# Este script compila y exporta las imágenes
# para entregar al cliente SIN código fuente
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Exportando Imágenes Docker" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que Docker esté corriendo
if (-not (docker info 2>$null)) {
    Write-Host "ERROR: Docker no está corriendo" -ForegroundColor Red
    Write-Host "Por favor inicia Docker Desktop" -ForegroundColor Yellow
    pause
    exit 1
}

# Navegar al directorio del proyecto
Set-Location $PSScriptRoot

Write-Host "Paso 1: Compilando imágenes Docker..." -ForegroundColor Yellow
Write-Host ""

# Compilar imágenes
docker-compose build --no-cache

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Falló la compilación" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "Paso 2: Exportando imágenes a archivos .tar..." -ForegroundColor Yellow
Write-Host ""

# Crear directorio para exportación
$exportDir = ".\docker-export"
if (Test-Path $exportDir) {
    Remove-Item $exportDir -Recurse -Force
}
New-Item -ItemType Directory -Path $exportDir | Out-Null

# Exportar Backend
Write-Host "  Exportando Backend..." -ForegroundColor Cyan
docker save -o "$exportDir\generador-backend.tar" generador-backend:latest

# Exportar Frontend
Write-Host "  Exportando Frontend..." -ForegroundColor Cyan
docker save -o "$exportDir\generador-frontend.tar" generador-frontend:latest

# Exportar MongoDB (imagen oficial)
Write-Host "  Exportando MongoDB..." -ForegroundColor Cyan
docker save -o "$exportDir\mongo.tar" mongo:7.0

Write-Host ""
Write-Host "Paso 3: Copiando archivos de configuración..." -ForegroundColor Yellow

# Copiar docker-compose para cliente
Copy-Item ".\docker-compose-cliente.yml" "$exportDir\docker-compose.yml"

# Copiar ejemplo de .env
Copy-Item ".\.env.docker.example" "$exportDir\.env.docker.example"

# Crear archivo de instrucciones
@"
============================================
  INSTRUCCIONES DE INSTALACIÓN
============================================

REQUISITOS:
- Windows 10/11
- Docker Desktop instalado
- 8GB RAM mínimo
- 20GB espacio en disco

INSTALACIÓN:

1. Instalar Docker Desktop
   - Descargar: https://www.docker.com/products/docker-desktop
   - Instalar y reiniciar PC

2. Copiar esta carpeta completa a:
   C:\GeneradorApp\

3. Abrir PowerShell en la carpeta y ejecutar:
   .\instalar.ps1

4. Acceder a:
   http://localhost

SOPORTE:
- Email: tu-email@ejemplo.com
- Tel: +123 456 7890

============================================
"@ | Out-File -FilePath "$exportDir\INSTRUCCIONES.txt" -Encoding UTF8

# Crear script de instalación para cliente
@"
# ============================================
# Script de Instalación - Cliente
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Instalando Sistema Generador" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Docker
if (-not (docker info 2>`$null)) {
    Write-Host "ERROR: Docker no está corriendo" -ForegroundColor Red
    Write-Host "Por favor inicia Docker Desktop" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "Paso 1: Cargando imágenes Docker..." -ForegroundColor Yellow
Write-Host "  (Esto puede tomar 5-10 minutos)" -ForegroundColor Gray
Write-Host ""

# Cargar Backend
Write-Host "  Cargando Backend..." -ForegroundColor Cyan
docker load -i generador-backend.tar

# Cargar Frontend
Write-Host "  Cargando Frontend..." -ForegroundColor Cyan
docker load -i generador-frontend.tar

# Cargar MongoDB
Write-Host "  Cargando MongoDB..." -ForegroundColor Cyan
docker load -i mongo.tar

Write-Host ""
Write-Host "Paso 2: Configuración..." -ForegroundColor Yellow
Write-Host ""

# Verificar si existe .env.docker
if (-not (Test-Path ".env.docker")) {
    Write-Host "  Creando archivo de configuración..." -ForegroundColor Cyan
    Copy-Item ".env.docker.example" ".env.docker"
    
    Write-Host ""
    Write-Host "IMPORTANTE: Debes configurar la contraseña de MongoDB" -ForegroundColor Red
    Write-Host "Editando el archivo .env.docker" -ForegroundColor Yellow
    Write-Host ""
    
    `$respuesta = Read-Host "¿Quieres editarlo ahora? (S/N)"
    if (`$respuesta -eq "S" -or `$respuesta -eq "s") {
        notepad .env.docker
    }
}

Write-Host ""
Write-Host "Paso 3: Iniciando servicios..." -ForegroundColor Yellow
Write-Host ""

# Iniciar con docker-compose
docker-compose up -d

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  ✅ Instalación Completada" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Acceder a la aplicación en:" -ForegroundColor Cyan
Write-Host "  http://localhost" -ForegroundColor White
Write-Host ""
Write-Host "Para ver el estado:" -ForegroundColor Cyan
Write-Host "  docker-compose ps" -ForegroundColor White
Write-Host ""
Write-Host "Para ver logs:" -ForegroundColor Cyan
Write-Host "  docker-compose logs -f" -ForegroundColor White
Write-Host ""

pause
"@ | Out-File -FilePath "$exportDir\instalar.ps1" -Encoding UTF8

# Crear script de desinstalación
@"
# ============================================
# Script de Desinstalación - Cliente
# ============================================

Write-Host "============================================" -ForegroundColor Red
Write-Host "  Desinstalando Sistema Generador" -ForegroundColor Red
Write-Host "============================================" -ForegroundColor Red
Write-Host ""

`$confirmacion = Read-Host "¿Estás seguro? Esto eliminará TODOS los datos (S/N)"

if (`$confirmacion -ne "S" -and `$confirmacion -ne "s") {
    Write-Host "Desinstalación cancelada" -ForegroundColor Yellow
    pause
    exit
}

Write-Host ""
Write-Host "Deteniendo y eliminando containers..." -ForegroundColor Yellow
docker-compose down -v

Write-Host ""
Write-Host "Eliminando imágenes..." -ForegroundColor Yellow
docker rmi generador-backend:latest 2>`$null
docker rmi generador-frontend:latest 2>`$null
docker rmi mongo:7.0 2>`$null

Write-Host ""
Write-Host "✅ Desinstalación completada" -ForegroundColor Green
Write-Host ""
Write-Host "Puedes eliminar esta carpeta manualmente si lo deseas" -ForegroundColor Yellow
Write-Host ""

pause
"@ | Out-File -FilePath "$exportDir\desinstalar.ps1" -Encoding UTF8

Write-Host ""
Write-Host "Paso 4: Comprimiendo archivos..." -ForegroundColor Yellow
Write-Host ""

# Comprimir todo
$zipFile = ".\GeneradorControl-Instalador.zip"
if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}

Compress-Archive -Path "$exportDir\*" -DestinationPath $zipFile -CompressionLevel Optimal

# Información de los archivos
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  ✅ Exportación Completada" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

$backendSize = (Get-Item "$exportDir\generador-backend.tar").Length / 1MB
$frontendSize = (Get-Item "$exportDir\generador-frontend.tar").Length / 1MB
$mongoSize = (Get-Item "$exportDir\mongo.tar").Length / 1MB
$zipSize = (Get-Item $zipFile).Length / 1MB

Write-Host "Tamaño de archivos:" -ForegroundColor Cyan
Write-Host "  Backend:  $([math]::Round($backendSize, 2)) MB" -ForegroundColor White
Write-Host "  Frontend: $([math]::Round($frontendSize, 2)) MB" -ForegroundColor White
Write-Host "  MongoDB:  $([math]::Round($mongoSize, 2)) MB" -ForegroundColor White
Write-Host "  Total:    $([math]::Round($zipSize, 2)) MB (comprimido)" -ForegroundColor White
Write-Host ""

Write-Host "Archivos generados:" -ForegroundColor Cyan
Write-Host "  📁 Carpeta: docker-export\" -ForegroundColor White
Write-Host "  📦 ZIP:     GeneradorControl-Instalador.zip" -ForegroundColor White
Write-Host ""

Write-Host "ENTREGAR AL CLIENTE:" -ForegroundColor Yellow
Write-Host "  El archivo: GeneradorControl-Instalador.zip" -ForegroundColor White
Write-Host ""
Write-Host "El cliente debe:" -ForegroundColor Cyan
Write-Host "  1. Descomprimir el ZIP" -ForegroundColor White
Write-Host "  2. Ejecutar: instalar.ps1" -ForegroundColor White
Write-Host "  3. Configurar contraseña en .env.docker" -ForegroundColor White
Write-Host "  4. Acceder a http://localhost" -ForegroundColor White
Write-Host ""

pause
