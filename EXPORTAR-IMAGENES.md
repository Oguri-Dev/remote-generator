# 📦 Guía de Exportación de Imágenes Docker

## 🎯 Objetivo

Generar un instalador que contenga las imágenes Docker compiladas **sin el código fuente**, listo para entregar al cliente.

---

## 🚀 Paso 1: Exportar Imágenes

### Opción A: Script Automático (Recomendado)

```powershell
# Ejecutar el script de exportación
.\exportar-docker.ps1
```

Este script hace TODO automáticamente:

1. ✅ Compila las imágenes Docker
2. ✅ Exporta a archivos .tar
3. ✅ Crea archivos de configuración
4. ✅ Genera scripts de instalación para el cliente
5. ✅ Comprime todo en un ZIP

**Resultado:** `GeneradorControl-Instalador.zip` (listo para entregar)

---

### Opción B: Manual

```powershell
# 1. Compilar imágenes
docker-compose build --no-cache

# 2. Crear directorio de exportación
mkdir docker-export

# 3. Exportar Backend
docker save -o docker-export\generador-backend.tar generador-backend:latest

# 4. Exportar Frontend
docker save -o docker-export\generador-frontend.tar generador-frontend:latest

# 5. Exportar MongoDB
docker save -o docker-export\mongo.tar mongo:7.0

# 6. Copiar archivos de configuración
copy docker-compose-cliente.yml docker-export\docker-compose.yml
copy .env.docker.example docker-export\.env.docker.example

# 7. Comprimir
Compress-Archive -Path docker-export\* -DestinationPath GeneradorControl-Instalador.zip
```

---

## 📦 Contenido del ZIP

```
GeneradorControl-Instalador.zip
├── generador-backend.tar       ← Backend compilado (~50-100MB)
├── generador-frontend.tar      ← Frontend compilado (~100-200MB)
├── mongo.tar                   ← MongoDB (~400MB)
├── docker-compose.yml          ← Configuración Docker
├── .env.docker.example         ← Ejemplo de variables
├── instalar.ps1                ← Script de instalación
├── desinstalar.ps1             ← Script de desinstalación
└── INSTRUCCIONES.txt           ← Guía para el cliente
```

**Tamaño total:** ~500-700MB comprimido

---

## 📨 Entregar al Cliente

### Método 1: USB/Disco Externo

```
Copiar: GeneradorControl-Instalador.zip
```

### Método 2: Google Drive / OneDrive / Dropbox

```
Subir ZIP y compartir link
```

### Método 3: Email (si es pequeño)

```
Adjuntar ZIP (verificar límite de tamaño del email)
```

---

## 👤 Instrucciones para el Cliente

### Requisitos Previos:

- ✅ Windows 10/11
- ✅ Docker Desktop instalado
- ✅ 8GB RAM mínimo
- ✅ 20GB espacio libre

### Instalación:

```powershell
# 1. Descomprimir el ZIP
# (Clic derecho → Extraer todo)

# 2. Abrir PowerShell en la carpeta
# (Shift + Clic derecho → "Abrir PowerShell aquí")

# 3. Ejecutar instalador
.\instalar.ps1

# 4. Configurar contraseña
# (El script pedirá editar .env.docker)

# 5. Esperar a que cargue (5-10 minutos primera vez)

# 6. Acceder
# http://localhost
```

---

## 🔄 Actualizaciones Futuras

Para actualizar la aplicación en el cliente:

### Generar nueva versión:

```powershell
# En tu PC de desarrollo
.\exportar-docker.ps1
```

### Instalar en cliente:

```powershell
# 1. Detener versión actual
docker-compose down

# 2. Cargar nuevas imágenes
docker load -i generador-backend.tar
docker load -i generador-frontend.tar

# 3. Reiniciar
docker-compose up -d

# ✅ Datos preservados (MongoDB en volumen)
```

---

## 🔒 Seguridad

### ✅ Lo que el cliente RECIBE:

- Imágenes Docker compiladas (binarios)
- Archivos de configuración
- Scripts de instalación

### ❌ Lo que el cliente NO recibe:

- Código fuente del Backend (Go)
- Código fuente del Frontend (Vue)
- Archivos .git
- Historial de commits
- Información de desarrollo

### 🔐 Protección Adicional:

El código está protegido porque:

1. ✅ Backend: Compilado a binario Go (no reversible fácilmente)
2. ✅ Frontend: Minificado y ofuscado (difícil de leer)
3. ✅ Dentro de containers Docker (aislado del sistema)
4. ✅ Solo binarios ejecutables, no código fuente

Para ver qué hay dentro de un container (cliente NO puede hacer esto fácilmente):

```powershell
# Entrar al container (requiere conocimiento técnico)
docker exec -it generador-backend sh

# Ver archivos
ls -la

# Resultado: Solo binario 'generador', sin archivos .go
```

---

## 📊 Tamaños Aproximados

| Componente | Sin Comprimir  | Comprimido     |
| ---------- | -------------- | -------------- |
| Backend    | 50-100 MB      | 20-40 MB       |
| Frontend   | 100-200 MB     | 30-60 MB       |
| MongoDB    | 400-500 MB     | 150-200 MB     |
| **TOTAL**  | **550-800 MB** | **200-300 MB** |

---

## 🐛 Troubleshooting

### Error al exportar: "Cannot connect to Docker daemon"

```powershell
# Solución: Iniciar Docker Desktop
# Esperar a que el ícono se ponga verde
```

### Archivos .tar muy grandes

```powershell
# Normal, MongoDB es ~400MB
# El ZIP comprime a ~50% del tamaño
```

### Cliente no puede cargar imágenes

```powershell
# Verificar que Docker esté corriendo
docker info

# Verificar espacio en disco
docker system df
```

---

## 📝 Notas Importantes

1. **Primera exportación:** Puede tomar 10-15 minutos
2. **Actualizaciones:** Solo exportar cambios (backend o frontend)
3. **Versiones:** Guardar cada ZIP con número de versión
4. **Backup:** Cliente debe hacer backup del volumen MongoDB

---

## ✅ Checklist de Exportación

```
□ Docker Desktop corriendo
□ Código actualizado en Git
□ Ejecutado: .\exportar-docker.ps1
□ Verificado: GeneradorControl-Instalador.zip creado
□ Probado en máquina virtual/limpia (opcional pero recomendado)
□ Documentación incluida
□ Instrucciones de soporte agregadas
□ ZIP listo para entregar
```

---

## 🎯 Resumen Rápido

```powershell
# Para generar el instalador para el cliente:
.\exportar-docker.ps1

# Entregar al cliente:
GeneradorControl-Instalador.zip

# Cliente instala con:
.\instalar.ps1

# ¡Listo!
```
