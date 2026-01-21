# 🌐 Instalación Remota desde Navegador

## 🎯 ¿Cómo funciona?

El usuario en el PC de producción **no necesita copiar nada físicamente**. Solo necesita:

1. **Un navegador web** (cualquiera)
2. **PowerShell con permisos de Admin**
3. **Docker Desktop instalado**

## 📋 Opción 1: Desde Página HTML (más amigable)

### Pasos:

1. **Copia el archivo** `install-page.html` a un servidor web o Google Drive
2. **Comparte el enlace** con el usuario en producción
3. El usuario abre el enlace en su navegador
4. Lee las instrucciones y **copia el comando de PowerShell**
5. **Pega en PowerShell (como Admin)** y ejecuta
6. ¡Listo! Todo se instala automáticamente

### Ejemplo:

```
Usuario: Abre este enlace
https://tudominio.com/install-page.html
       ↓
Copia el comando de PowerShell
       ↓
Pega en PowerShell Admin
       ↓
¡Instalación automática!
```

---

## 📋 Opción 2: Comando directo (más rápido)

El usuario en producción simplemente abre **PowerShell como Admin** y pega:

```powershell
iex (New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/tu-usuario/generador/main/bootstrap-install.ps1')
```

Ese comando:

1. ✅ Descarga el script desde GitHub
2. ✅ Lo ejecuta directamente en la memoria (sin guardar archivos)
3. ✅ Clona el repositorio automáticamente
4. ✅ Crea MongoDB y MQTT
5. ✅ Inicia todos los contenedores

---

## 🗄️ ¿Se crea MongoDB solo?

**SÍ, completamente automático:**

✅ Docker crea el volumen `mongodb_data` automáticamente
✅ Inicializa MongoDB con las credenciales del `.env.docker`
✅ Los datos persisten incluso si reinicies los contenedores
✅ No necesita configuración manual

**Lo mismo aplica para MQTT:**
✅ Se crea automáticamente en el puerto 1883
✅ WebSocket en puerto 9001
✅ Los datos se guardan en `mqtt_data`

---

## 🔧 ¿Qué hace exactamente el script `bootstrap-install.ps1`?

```
1. Verifica que Docker esté instalado y corriendo
2. Descarga Git si no lo tiene (opcional)
3. Clona el repositorio desde GitHub
4. Solicita credenciales de MongoDB
5. Crea archivo .env.docker
6. Crea mosquitto.conf
7. Ejecuta: docker-compose up -d
8. Espera a que los servicios estén listos
9. Muestra un resumen con URLs de acceso
```

---

## 📦 Archivos que necesitas en GitHub/Web

Para que esto funcione, tu repositorio debe contener:

```
generador/
├── bootstrap-install.ps1      ← Script descargable
├── docker-compose.yml         ← Composición de servicios
├── .gitignore                 ← Para ignorar .env.docker
├── BackEnd/
│   ├── Dockerfile
│   ├── main.go
│   └── ...
├── FrontEnd/
│   ├── Dockerfile.production
│   ├── package.json
│   └── ...
├── mosquitto.conf             ← Configuración MQTT
└── ... otros archivos ...
```

---

## ✅ Ventajas de este método

| Aspecto                   | Antes                | Ahora                     |
| ------------------------- | -------------------- | ------------------------- |
| **Copiar carpeta**        | ✗ Manual, tedioso    | ✓ Automático desde GitHub |
| **Instalar dependencias** | ✗ Múltiples pasos    | ✓ Docker lo hace todo     |
| **Configurar MongoDB**    | ✗ Manual             | ✓ Automático              |
| **Configurar MQTT**       | ✗ Manual             | ✓ Automático              |
| **Iniciar servicios**     | ✗ Múltiples comandos | ✓ Un comando              |
| **Datos persistentes**    | ? Dudoso             | ✓ Garantizado             |
| **Tiempo total**          | 30 minutos           | **3-5 minutos**           |

---

## 🚨 Cambios que DEBES hacer antes de usar

En el repositorio de GitHub, edita estos archivos y reemplaza:

### 1. `bootstrap-install.ps1` (línea ~15):

```powershell
# DE:
$GITHUB_REPO = "https://github.com/tu-usuario/generador.git"

# A:
$GITHUB_REPO = "https://github.com/tu-repo-real/generador.git"
```

### 2. `install-page.html` (línea ~218):

```html
<!-- DE: -->
<span id="command"
  >iex (New-Object
  System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/tu-usuario/generador/main/bootstrap-install.ps1')</span
>

<!-- A: -->
<span id="command"
  >iex (New-Object
  System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/tu-repo-real/generador/main/bootstrap-install.ps1')</span
>
```

---

## 🎬 Ejemplo Real

### En producción, el usuario ejecuta:

```powershell
iex (New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/tucorp/generador/main/bootstrap-install.ps1')
```

### El script hace:

```
✓ Verifica Docker
✓ Clona: https://github.com/tucorp/generador.git
✓ Descarga imágenes (MongoDB, MQTT, Backend, Frontend)
✓ Crea contenedores
✓ Inicia todo
✓ Muestra URLs de acceso

LISTO EN 3-5 MINUTOS
```

---

## 🔐 Seguridad

**⚠️ Considerar en producción:**

1. **Usa HTTPS** para el repositorio (GitHub siempre lo usa)
2. **Cambia credenciales** de MongoDB después de la instalación
3. **Habilita autenticación MQTT** (en `mosquitto.conf`)
4. **Usa variables de entorno seguras**
5. **Revisa permisos de archivos**

---

## 📞 Soporte

Si el usuario tiene problemas:

```powershell
# Ver estado de servicios
docker-compose ps

# Ver logs detallados
docker-compose logs -f

# Reiniciar Docker
docker-compose restart
```

---

¿Quieres que haga algo más, como un script para actualizar la aplicación sin perder datos?
