# 🐳 Exportación de Imágenes Docker - Guía Rápida

## 📋 Resumen

Este proyecto está configurado para exportar las imágenes Docker compiladas **sin el código fuente**, listas para entregar al cliente.

---

## 🚀 Proceso Completo

### 1️⃣ Probar Localmente (Opcional pero Recomendado)

```powershell
.\probar-docker.ps1
```

Esto compila y ejecuta todo para verificar que funcione antes de exportar.

### 2️⃣ Exportar Imágenes

```powershell
.\exportar-docker.ps1
```

**Resultado:** `GeneradorControl-Instalador.zip` (~200-300MB)

### 3️⃣ Entregar al Cliente

Enviar el archivo: **GeneradorControl-Instalador.zip**

---

## 📦 ¿Qué Contiene el ZIP?

```
GeneradorControl-Instalador.zip
├── generador-backend.tar       # Backend compilado
├── generador-frontend.tar      # Frontend compilado
├── mongo.tar                   # MongoDB
├── docker-compose.yml          # Configuración
├── .env.docker.example         # Ejemplo de variables
├── instalar.ps1                # Instalador automático
├── desinstalar.ps1             # Desinstalador
└── INSTRUCCIONES.txt           # Guía para cliente
```

---

## 👤 Instrucciones para el Cliente

### Requisitos:

- Windows 10/11
- Docker Desktop instalado
- 8GB RAM
- 20GB disco

### Instalación:

1. Descomprimir ZIP
2. Ejecutar: `.\instalar.ps1`
3. Configurar contraseña en `.env.docker`
4. Acceder a: `http://localhost`

---

## 🔒 Seguridad

### ✅ El cliente recibe:

- Imágenes Docker compiladas (binarios)
- Scripts de instalación
- Archivos de configuración

### ❌ El cliente NO recibe:

- Código fuente Backend (Go)
- Código fuente Frontend (Vue)
- Historial Git
- Archivos de desarrollo

**El código está protegido dentro de las imágenes Docker compiladas.**

---

## 🔄 Actualizaciones

### Generar nueva versión:

```powershell
# En tu PC
.\exportar-docker.ps1
```

### Instalar en cliente:

```powershell
# En PC cliente
docker-compose down
docker load -i generador-backend.tar
docker load -i generador-frontend.tar
docker-compose up -d
```

---

## 📁 Archivos Importantes

| Archivo                      | Propósito                        |
| ---------------------------- | -------------------------------- |
| `exportar-docker.ps1`        | Genera el instalador             |
| `probar-docker.ps1`          | Prueba local antes de exportar   |
| `docker-compose.yml`         | Para desarrollo (con build)      |
| `docker-compose-cliente.yml` | Para cliente (sin código fuente) |
| `EXPORTAR-IMAGENES.md`       | Documentación detallada          |

---

## ✅ Checklist Antes de Entregar

```
□ Código actualizado y testeado
□ Ejecutado: .\probar-docker.ps1
□ Verificado que funciona localmente
□ Ejecutado: .\exportar-docker.ps1
□ ZIP generado correctamente
□ Probado instalación en PC limpio (opcional)
□ Listo para entregar
```

---

## 🆘 Soporte

Si el cliente tiene problemas:

1. **No carga las imágenes**: Verificar que Docker Desktop esté corriendo
2. **Error de contraseña**: Verificar `.env.docker`
3. **No inicia**: Ver logs con `docker-compose logs -f`
4. **Puerto ocupado**: Cambiar puerto 80 a 8080 en `docker-compose.yml`

---

## 🎯 Comandos Rápidos

```powershell
# Probar antes de exportar
.\probar-docker.ps1

# Generar instalador
.\exportar-docker.ps1

# Resultado
GeneradorControl-Instalador.zip  # ← Entregar esto
```

---

## 📝 Notas

- Primera exportación: 10-15 minutos
- Tamaño final: ~200-300MB comprimido
- Cliente necesita Docker Desktop (gratuito)
- Los datos del cliente están seguros en volúmenes Docker
- Actualizaciones son fáciles: solo cargar nuevas imágenes

---

**¿Listo para exportar? Ejecuta:** `.\exportar-docker.ps1`
