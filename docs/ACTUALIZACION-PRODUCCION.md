# Actualización del PC de producción (instalación antigua con Docker)

> **Alcance**: actualizar una instalación antigua basada en Docker al estado actual del repositorio
> (commit `2b5ff4e` + cambios pendientes de commitear). Complementa a [DESPLIEGUE.md](DESPLIEGUE.md),
> que cubre la instalación desde cero. El PC de producción es Windows con Docker Desktop;
> todos los comandos de producción son para PowerShell.

---

## Advertencias críticas antes de empezar

1. **NUNCA ejecutar `docker compose down -v`** en ningún paso. La opción `-v` borra los volúmenes
   `mongodb_data`, `mongodb_config`, `mqtt_data` y `mqtt_logs` (usuarios, configuración de placa/cámara,
   historial de actividad). Pérdida total e irreversible.
2. **Si existe la carpeta `docker-export\` en el PC de producción, borrar o renombrar
   `desinstalar.ps1` AHORA**: ese script antiguo ejecuta literalmente `docker-compose down -v`
   (borra la base de datos). Que nadie pueda ejecutarlo por error.
3. **Riesgo de login roto por cookie `Secure`**: el compose nuevo fija `ENVIRONMENT=production`,
   lo que marca la cookie de sesión como `Secure` (`BackEnd/auth/session.go:113`). El stack sirve HTTP
   plano en el puerto 80, sin TLS. Los navegadores descartan cookies `Secure` sobre `http://<IP>`
   (solo `http://localhost` queda exento). **Probar el login desde otra máquina (paso 8.4) antes de
   dar por terminada la actualización.**
4. **WebSocket con validación estricta de Origin**: en producción el WS solo acepta exactamente
   `FRONTEND_ORIGIN` (`BackEnd/ws/hub.go:44-63`), con default `http://localhost`. No existe lógica de
   "mismo host" en el backend: **definir `FRONTEND_ORIGIN=http://<IP-del-servidor>` en el `.env`**
   (paso 4) o ningún operador remoto tendrá datos en tiempo real.
5. **No cambiar el nombre de la carpeta del proyecto en producción.** Los volúmenes con nombre se
   prefijan con el nombre del proyecto Compose (normalmente la carpeta). Si la versión nueva se
   despliega desde una carpeta con otro nombre, Compose crea volúmenes nuevos vacíos y la BD
   "desaparece" (paso 1.5).
6. **Servicios nuevos en esta versión**: `generador-mediamtx` (cámara WebRTC) entró al compose el
   2026-06-05 — **no existe en ninguna instalación antigua**. `generador-mqtt` (Mosquitto) entró el
   2026-01-22 — solo existe si la instalación es posterior a esa fecha.

---

## Paso 0 — En el PC de DESARROLLO: commitear y pushear los cambios pendientes

Producción NO recibirá nada vía `git pull` hasta que esto se commitee. Archivos pendientes:

- `M .env.docker.example` (reescrito: SESSION_SECRET, CONFIG_ENC_KEY, WEBRTC_HOST, FRONTEND_ORIGIN)
- `M FrontEnd/Dockerfile.production` (elimina ARG/ENV `VITE_API_BASE_URL` y `VITE_MEDIAMTX_WHEP`)
- `M FrontEnd/nginx.conf` (nuevo `location /whep/` → proxy a `http://mediamtx:8889/`)
- `M FrontEnd/src/stores/CameraStore.ts` (whepUrl relativo `/whep/generador/whep`)
- `M docker-compose.yml` (quita la publicación del puerto 8889, añade `MTX_WEBRTCADDITIONALHOSTS=${WEBRTC_HOST:-localhost}`, quita build args VITE_*, añade `depends_on: mediamtx` al frontend)
- `M mediamtx.yml` (solo comentarios sobre `webrtcAdditionalHosts`/`WEBRTC_HOST`)
- `?? docs/DESPLIEGUE.md` y `?? docs/ACTUALIZACION-PRODUCCION.md` (este documento)

Estos cambios son **interdependientes** (frontend con ruta relativa `/whep/` + compose sin puerto
8889): deben llegar juntos. Además, la imagen nueva del frontend **no puede correr con
`docker-compose-cliente.yml`** (no tiene servicio `mediamtx` y nginx falla al resolver ese upstream):
producción debe migrar a `docker-compose.yml`.

```powershell
cd C:\Users\omnifish\Documents\Partida-remota\remote-generator
git add .env.docker.example FrontEnd/Dockerfile.production FrontEnd/nginx.conf FrontEnd/src/stores/CameraStore.ts docker-compose.yml mediamtx.yml docs/
git commit -m "feat: camara WebRTC via proxy /whep, frontend portable sin VITE_*, guias de despliegue"
git push origin main
```

Anotar el hash del commit resultante (se usa en el paso 3 y en el rollback).

---

## Paso 1 — En el PC de PRODUCCIÓN: verificaciones previas

### 1.1 Versión de Docker y de Compose

```powershell
docker version
docker compose version
```

- Se requiere **Compose v2** (comando `docker compose`, con espacio): el `docker-compose.yml` nuevo
  no tiene clave `version:` y usa `depends_on` con `condition: service_healthy`, `start_period` en
  healthchecks y la sintaxis `${VAR:?}`. Un `docker-compose` v1 antiguo (guionado) falla al parsearlo.
- Si solo existe `docker-compose` v1 → **hay que actualizar Docker Desktop**. Atención: actualizar
  Docker Desktop **detiene el stack viejo** (downtime no planificado) y puede pedir reiniciar Windows.
  Si es el caso, hacer primero el respaldo del paso 2.1 con el stack sano y luego actualizar Docker.
- Confirmar que Docker Desktop está en modo **contenedores Linux** (lo estará si ya corre mongo).

### 1.2 Espacio en disco, RAM y límite de WSL2

```powershell
Get-PSDrive C | Select-Object Used,Free
docker system df
```

- El build del frontend usa `NODE_OPTIONS=--max-old-space-size=6144`
  (`FrontEnd/Dockerfile.production:35`): se necesitan **~6 GB de RAM dentro de la VM de Docker**.
  Con el default de WSL2 (50 % de la RAM del host) o un `.wslconfig` restrictivo, el build muere por
  OOM aunque el host tenga RAM libre. Revisar **Docker Desktop → Settings → Resources** o
  `C:\Users\<usuario>\.wslconfig` antes del paso 6.1.
- Se necesita espacio para las imágenes base (`golang:1.24-alpine`, `node:22-slim`, `nginx:alpine`,
  `mongo:7.0`, `eclipse-mosquitto:2.0`, `bluenviron/mediamtx`) y **acceso a internet**. El disco debe
  tolerar temporalmente ~2× el tamaño de las imágenes (viejas + nuevas); la limpieza se hace al final
  (paso 8.9).
- Si el PC no tiene recursos, alternativa: construir en otra máquina y transferir con
  `docker save` / `docker load`.

### 1.3 Identificar qué versión y modalidad corre actualmente

```powershell
docker compose ls
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
docker volume ls
docker inspect generador-mongodb --format "{{.Config.Image}}"
docker inspect generador-mongodb --format "{{.Config.Env}}"        # ¿aparece MONGO_INITDB_ROOT_*?
Get-Item C:\ruta\al\proyecto\docker-compose.override.yml -ErrorAction SilentlyContinue
```

Determinar y anotar:

- **[VERIFICAR] Modalidad de despliegue.** Hay TRES posibles:
  1. Clon git con `docker-compose.yml` (build local).
  2. `docker-compose-cliente.yml` (imágenes preconstruidas, Mongo CON auth `admin`/`changeme`,
     SIN `mqtt-broker` ni `mediamtx`).
  3. **Instalador `docker-export`** (`instalar.ps1` + `docker load` de .tar): la carpeta no es clon
     git, no tiene código fuente, el compose local se llama `docker-compose.yml` pero su contenido es
     el del cliente (con auth), usa `docker-compose` v1 y el archivo de variables se llama
     **`.env.docker`** (no `.env`). El nombre de proyecto/prefijo de volúmenes es el de la carpeta
     que eligió quien instaló.
  Comprobar: `git -C C:\ruta\al\proyecto log --oneline -3` (falla si no es clon git).
- **[VERIFICAR] ¿Mongo corre con autenticación?** Decidirlo por el **contenedor real**, no por el
  archivo compose (el `docker-compose.yml` principal también usó auth entre 2025-11-27 y 2026-02-02):
  si `docker inspect ... {{.Config.Env}}` muestra `MONGO_INITDB_ROOT_USERNAME`, hay auth. Prueba
  alternativa: `docker exec generador-mongodb mongosh --quiet --eval "db.adminCommand({listDatabases:1})"`
  (falla si hay auth).
- **[VERIFICAR] ¿Qué imagen de Mongo corre?** El compose nuevo usa `mongo:7.0`. Todo el historial del
  repo usó `mongo:7.0`, así que el riesgo es bajo, pero si corriera una major anterior NO continuar:
  primero subir Mongo escalonadamente (ajustando `featureCompatibilityVersion`) o restaurar el
  mongodump en un Mongo 7.0 limpio.
- **Nombres reales de las imágenes** de backend/frontend según `docker ps` (columna Image). Si el
  despliegue es anterior a 2025-12-01, no existía la clave `image:` en el compose y las imágenes se
  llaman `<proyecto>-backend`/`<proyecto>_backend` en vez de `generador-backend:latest`. Se usan en
  el paso 2.3.
- **[VERIFICAR] ¿Existe `generador-mqtt`?** (solo en instalaciones posteriores a 2026-01-22).
  `generador-mediamtx` con certeza NO existe: es nuevo en esta versión.
- **[VERIFICAR] ¿Las contraseñas de usuario están en bcrypt?** Si la versión es anterior al commit
  `083149b` (2025-11-26), los usuarios con contraseña en texto plano NO podrán iniciar sesión tras
  actualizar (el login actual solo acepta bcrypt, `BackEnd/controllers/auth.go:109`). Migración en el
  paso 8.3.
- **[VERIFICAR] ¿La config usa el dual-broker?** Si corre los commits `3463e0d`/`db5950a`
  (2026-02-26), el broker activo puede estar en `cloud_broker`/`local_broker`; el backend nuevo solo
  lee `ipbroker` → tras actualizar hay que re-guardar el broker desde la web (paso 8.6).
- Si existe `docker-compose.override.yml`, revisar su contenido: Compose lo fusiona en silencio y
  puede reintroducir puertos o variables viejos.

### 1.4 Respaldar el archivo de variables actual (si existe)

```powershell
# Puede llamarse .env o .env.docker (modalidad docker-export); puede NO existir
# (docker-compose-cliente.yml tiene defaults para todo y no usa env_file).
Get-Item C:\ruta\al\proyecto\.env, C:\ruta\al\proyecto\.env.docker -ErrorAction SilentlyContinue
Copy-Item C:\ruta\al\proyecto\.env C:\ruta\al\proyecto\.env.OLD-backup -ErrorAction SilentlyContinue
```

Anotar las credenciales de Mongo si las define (se usan en el paso 2.1). Nota: `CONFIG_ENC_KEY` nació
en esta versión (2026-06-05), así que ninguna instalación antigua puede tenerla — en esta primera
actualización siempre se genera nueva. En futuras actualizaciones, **conservarla siempre** (si cambia,
las contraseñas cifradas en Mongo dejan de descifrarse y el backend entra en crash-loop).

### 1.5 Anotar el nombre del proyecto Compose

```powershell
docker volume ls --format "{{.Name}}" | Select-String "mongodb_data"
```

El prefijo antes de `_mongodb_data` es el nombre del proyecto (normalmente la carpeta). **La
actualización debe hacerse en la misma carpeta** o con `docker compose -p <nombre-proyecto-viejo>`
para reutilizar los volúmenes. **[VERIFICAR]** la ruta exacta de la carpeta del proyecto en producción
(en adelante: `C:\ruta\al\proyecto`).

### 1.6 Verificar el estado de los puertos del sistema

```powershell
$puertosTcp = 80, 1883, 8099, 9001, 9997, 27017
foreach ($p in $puertosTcp) {
    $conn = Get-NetTCPConnection -State Listen -LocalPort $p -ErrorAction SilentlyContinue
    if ($conn) {
        $procs = ($conn | ForEach-Object { (Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName } | Sort-Object -Unique) -join ', '
        Write-Host ("TCP {0,-6} OCUPADO por: {1}" -f $p, $procs) -ForegroundColor Yellow
    } else {
        Write-Host ("TCP {0,-6} libre" -f $p) -ForegroundColor Green
    }
}
$udp = Get-NetUDPEndpoint -LocalPort 8189 -ErrorAction SilentlyContinue
if ($udp) {
    $procs = ($udp | ForEach-Object { (Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName } | Sort-Object -Unique) -join ', '
    Write-Host ("UDP 8189   OCUPADO por: {0}" -f $procs) -ForegroundColor Yellow
} else {
    Write-Host "UDP 8189   libre" -ForegroundColor Green
}
```

Interpretación — la clave es *quién* ocupa el puerto:

- Ocupado por procesos de Docker (`com.docker.backend`, `wslrelay`, `vpnkit`, `docker-proxy`):
  es el stack viejo; se libera en el paso 6.2. Lo esperado.
- Ocupado por **cualquier otro proceso** (`mosquitto`, `mongod`, `System`/IIS, etc.): conflicto real
  a resolver antes de desplegar — ver 1.7.
- 9997/TCP y 8189/UDP deberían estar libres (MediaMTX es nuevo).
- Que un puerto esté libre localmente no garantiza que sea alcanzable desde la red (eso lo decide el
  firewall, paso 7); y el UDP 8189 no se puede probar con `Test-NetConnection` — su prueba real es la
  cámara (paso 8.7).

### 1.7 Servicios nativos de MongoDB/Mosquitto (restos de la instalación local sin Docker)

El commit `88fb65e` (2026-01-30) introdujo una instalación local sin Docker (servicios de Windows vía
NSSM; los scripts ya no están en el repo). Si ese método se intentó en el PC, pueden quedar MongoDB y
Mosquitto **nativos** corriendo como servicios automáticos junto al stack Docker:

```powershell
Get-Service | Where-Object {$_.DisplayName -match "mongo|mosquitto|generador"} | Select-Object Name, DisplayName, Status, StartType
Get-NetTCPConnection -LocalPort 1883,27017 -State Listen | Select-Object LocalAddress, LocalPort, OwningProcess | Sort-Object LocalPort
```

Por qué importa: el Mosquitto nativo suele quedarse con el binding IPv4 `0.0.0.0:1883` (el de Docker
queda solo en `::`), de modo que **la placa Dingtian le habla al broker nativo** aunque el sistema
"funcione". Si tras actualizar el backend se configura contra `mqtt-broker` (Docker) con el nativo
aún vivo, el panel se queda sin datos.

Neutralización (verificada en sitio: los clientes MQTT se reconectan solos y el socket dual-stack de
Docker absorbe las conexiones IPv4 al liberarse el puerto):

1. Confirmar primero que los datos reales están en el Mongo de Docker:
   `docker exec generador-mongodb mongosh --quiet --eval "db.getSiblingDB('generator').users.countDocuments()"`
   (si responde sin pedir credenciales, además se confirma que Mongo corre sin auth — paso 2.1).
2. Detener y **deshabilitar** los servicios nativos (deshabilitar es clave: con `Automatic` vuelven
   al reiniciar y le roban el binding a Docker; no desinstalar — sus datos quedan en disco):

```powershell
Stop-Service mosquitto, MongoDB
Set-Service mosquitto -StartupType Disabled
Set-Service MongoDB -StartupType Disabled
```

3. Verificar que la placa sigue entregando mensajes, ahora al broker de Docker:

```powershell
docker exec generador-mqtt mosquitto_sub -t "/dingtian/#" -C 1 -W 30
```

4. Tras levantar el stack nuevo (6.3), repetir la consulta de bindings y confirmar que `0.0.0.0:1883`
   pertenece a un proceso de Docker.

---

## Paso 2 — Respaldo de datos (obligatorio)

### 2.0 Crear la carpeta de respaldos

```powershell
New-Item -ItemType Directory -Force C:\respaldos
```

### 2.1 Dump lógico de MongoDB (con el stack viejo aún corriendo)

Es **el respaldo fiable** (consistente en caliente). Según lo detectado en 1.3:

Si Mongo corre **con autenticación** (usuario/contraseña del `.env` viejo; defaults `admin`/`changeme`):

```powershell
docker exec generador-mongodb mongodump -u admin -p changeme --authenticationDatabase admin --db generator --archive=/tmp/generator-backup.archive
```

Si corre **sin autenticación**:

```powershell
docker exec generador-mongodb mongodump --db generator --archive=/tmp/generator-backup.archive
```

Extraer y validar el contenido (debe listar `generator.users`, `generator.config`,
`generator.activity_logs`):

```powershell
docker cp generador-mongodb:/tmp/generator-backup.archive C:\respaldos\generator-backup-$(Get-Date -Format yyyyMMdd-HHmm).archive
docker exec generador-mongodb mongorestore --dryRun --archive=/tmp/generator-backup.archive
```

(con auth, añadir `-u admin -p changeme --authenticationDatabase admin` también al `--dryRun`).

### 2.2 Respaldar la carpeta del proyecto viejo (crítico en la modalidad sin git)

```powershell
robocopy C:\ruta\al\proyecto C:\respaldos\proyecto-viejo /E /XD node_modules dist
```

Esto preserva el compose viejo, configs y el `.env`/`.env.docker` — es lo único que permite el
rollback si la carpeta no es un clon git (el paso 3 la sobreescribe).

### 2.3 Etiquetar las imágenes viejas para rollback

Usar los **nombres reales** anotados en 1.3 (columna Image de `docker ps`). Si son los estándar:

```powershell
docker tag generador-backend:latest generador-backend:pre-upgrade
docker tag generador-frontend:latest generador-frontend:pre-upgrade
```

Si se llaman distinto (p. ej. `<proyecto>-backend`), etiquetar esos:
`docker tag <nombre-real-backend> generador-backend:pre-upgrade`, etc.

### 2.4 Verificar el respaldo

```powershell
Get-ChildItem C:\respaldos -Recurse | Select-Object FullName, Length
```

Confirmar que el `.archive` no mide 0 bytes y que `proyecto-viejo\` tiene contenido. **Copiar
`C:\respaldos\` a un medio externo o a otra máquina.**

> La copia física de los volúmenes (tar de `mongodb_data` etc.) NO es fiable con mongod corriendo
> (archivos WiredTiger en vuelo). Si se quiere ese segundo respaldo, hacerlo justo después del
> `docker compose down` del paso 6.2 (los volúmenes sobreviven al down):
>
> ```powershell
> docker run --rm -v <proyecto>_mongodb_data:/data -v C:\respaldos:/backup alpine tar czf /backup/mongodb_data.tar.gz -C /data .
> docker run --rm -v <proyecto>_mongodb_config:/data -v C:\respaldos:/backup alpine tar czf /backup/mongodb_config.tar.gz -C /data .
> # y si existen (post-2026-01-22): <proyecto>_mqtt_data y <proyecto>_mqtt_logs
> ```

---

## Paso 3 — Obtener el código nuevo

### Caso A: producción es un clon git (verificado en 1.3)

```powershell
cd C:\ruta\al\proyecto
git fetch origin
git log --oneline -1            # anotar el commit actual (para rollback de código)
git status                      # confirmar que no hay cambios locales que se pisen
git pull origin main
git log --oneline -1            # debe mostrar el commit del paso 0
```

### Caso B: producción NO es un clon git (incluye la modalidad docker-export)

Con el respaldo del paso 2.2 ya hecho, copiar el árbol completo desde el PC de desarrollo (tras el
paso 0) **a la misma carpeta** (sin renombrarla, ver 1.5):

```powershell
robocopy <origen>\remote-generator C:\ruta\al\proyecto /MIR /XD .git node_modules dist /XF .env .env.OLD-backup .env.docker
```

(Precaución con `/MIR`: replica borrados en el destino; por eso el respaldo 2.2 es obligatorio antes.
Si hay duda, usar `/E` en vez de `/MIR`.)

El árbol completo es necesario: el build del frontend requiere, entre otros, `FrontEnd/patches/`,
`FrontEnd/scripts/`, `FrontEnd/public/`, `FrontEnd/pnpm-lock.yaml` y `FrontEnd/.npmrc` — copiar solo
"los archivos de config" rompe el build.

### Verificación tras la copia/pull

`mosquitto.conf` y `mediamtx.yml` son bind mounts (`docker-compose.yml:32` y `:50`). Si no existen
como ARCHIVOS al levantar, Docker crea DIRECTORIOS con esos nombres y los contenedores fallan:

```powershell
Get-Item C:\ruta\al\proyecto\mosquitto.conf, C:\ruta\al\proyecto\mediamtx.yml
```

---

## Paso 4 — Crear/actualizar el archivo `.env`

El backend tiene `env_file: .env` (`docker-compose.yml:77-78`): **el archivo debe existir** o compose
falla. Además, la interpolación `${VAR:?}` aborta **cualquier** subcomando de compose — incluido
`docker compose build` — si faltan las obligatorias. Crear `C:\ruta\al\proyecto\.env` partiendo de
`.env.docker.example`:

### Variables NUEVAS OBLIGATORIAS

```ini
# >=16 caracteres cada una. Generar con:
#   docker run --rm alpine sh -c "head -c32 /dev/urandom | base64"
SESSION_SECRET=<cadena-aleatoria-1>
CONFIG_ENC_KEY=<cadena-aleatoria-2>
```

- `CONFIG_ENC_KEY`: en esta primera actualización se genera nueva (no existía antes). **Guardarla en
  un lugar seguro: en futuras actualizaciones debe conservarse** o las contraseñas cifradas en Mongo
  quedan ilegibles y el backend entra en crash-loop.
- `SESSION_SECRET` nuevo invalida todas las sesiones: los operadores deberán volver a iniciar sesión.

### Variables NUEVAS necesarias para acceso remoto

```ini
# IP fija del servidor en la red de monitoreo (la que usan los operadores)
WEBRTC_HOST=<IP-del-servidor>                  # ej. 10.1.1.50  (video de la cámara)
FRONTEND_ORIGIN=http://<IP-del-servidor>       # ej. http://10.1.1.50  (WebSocket de datos en vivo)
```

- Sin `WEBRTC_HOST`, el video solo funciona desde el propio servidor. Cambiarla después solo requiere
  `docker compose up -d mediamtx` (sin rebuild).
- Sin `FRONTEND_ORIGIN`, el WebSocket rechaza a todo operador que acceda por `http://<IP>` (el
  default es `http://localhost`). Debe coincidir EXACTAMENTE con el origen que escriben los
  operadores en el navegador.

### Variables OBSOLETAS a no arrastrar del `.env` viejo

- `MONGO_ROOT_USER`, `MONGO_ROOT_PASSWORD` (Mongo ya no usa autenticación, ver paso 5)
- `VITE_API_BASE_URL`, `VITE_MEDIAMTX_WHEP` (el frontend usa rutas relativas; ya no se leen)

---

## Paso 5 — Cambio de autenticación de MongoDB

- El compose nuevo no define `MONGO_INITDB_ROOT_*` y usa `MONGODB_URI: mongodb://mongodb:27017` sin
  credenciales (`docker-compose.yml:80`).
- **Comportamiento de la imagen oficial de mongo**: el flag `--auth` solo se añade cuando las
  variables `MONGO_INITDB_ROOT_*` están en el entorno; NO se persiste en el volumen. Al quitarlas,
  `mongod` arranca **sin exigir autenticación** sobre el mismo volumen. **Los datos se conservan
  intactos**: no hay que borrar el volumen ni migrar nada. El usuario root queda huérfano en la BD
  `admin` (inofensivo).
- **Consecuencia de seguridad**: la BD queda sin autenticación Y publicada en el puerto 27017 del
  host. Es imprescindible bloquear 27017 en el firewall (paso 7).

---

## Paso 6 — Build y arranque

### 6.1 Construir las imágenes nuevas ANTES de detener el stack viejo (minimiza el downtime)

Requiere el `.env` del paso 4 ya creado (sin él, `build` aborta por `${VAR:?}`).

```powershell
cd C:\ruta\al\proyecto
docker compose build
```

- Varios minutos (descarga de imágenes base + build de Go + build del frontend con ~6 GB de heap).
  El stack viejo sigue sirviendo mientras tanto.
- Si el build falla, **no se ha tocado producción todavía**: corregir y reintentar.

### 6.2 Detener el stack viejo (SIN `-v`)

Usar el compose/proyecto REAL detectado en 1.3 (`docker compose ls`):

```powershell
# clon git con compose principal:
docker compose down --remove-orphans
# o, si corre con el compose cliente:
docker compose -f docker-compose-cliente.yml down --remove-orphans
# o, por nombre de proyecto (modalidad docker-export u otra carpeta):
docker compose -p <nombre-proyecto-viejo> down --remove-orphans
```

Verificar que no quedó nada con nombre colisionante (los `container_name` fijos
`generador-mongodb`/`generador-backend`/`generador-frontend` se repiten en todos los composes):

```powershell
docker ps -a --format "table {{.Names}}\t{{.Status}}" | Select-String generador
```

Si queda alguno: `docker rm <nombre>`. **Aquí empieza el downtime** (2-5 minutos si el build de 6.1
ya terminó). Si se quiere la copia física de volúmenes como segundo respaldo, este es el momento
(ver nota del paso 2.4).

### 6.3 Levantar el stack nuevo

```powershell
docker compose up -d
docker compose ps
```

Esperar a que todos pasen a `healthy`/`running`. Orden automático: mongodb y mqtt-broker
(healthcheck) → backend (healthcheck `/api/auth/check-setup`) → frontend. El frontend también espera
a mediamtx (`service_started`): si mediamtx no arranca, el frontend tampoco.

### 6.4 Si algo no levanta

```powershell
docker compose logs backend --tail 50
docker compose logs mongodb --tail 50
docker compose logs mediamtx --tail 50
```

Causas típicas: `SESSION_SECRET`/`CONFIG_ENC_KEY` ausentes o <16 caracteres (`log.Fatal` del
backend), `mosquitto.conf`/`mediamtx.yml` convertidos en directorios (paso 3), contenedor viejo con
nombre colisionante (paso 6.2), volumen de Mongo de una major incompatible (paso 1.3).

---

## Paso 7 — Firewall de Windows (puertos)

Reglas a crear (la instalación antigua probablemente solo tenía 80/TCP):

```powershell
New-NetFirewallRule -DisplayName "Generador Web 80/TCP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "Generador WebRTC 8189/UDP" -Direction Inbound -Protocol UDP -LocalPort 8189 -Action Allow
# MQTT: restringir a la IP de la placa Dingtian — el broker acepta conexiones ANONIMAS
New-NetFirewallRule -DisplayName "Generador MQTT 1883/TCP (solo placa)" -Direction Inbound -Protocol TCP -LocalPort 1883 -RemoteAddress <IP-de-la-placa> -Action Allow
```

Puertos que el compose publica al host pero que **NO deben ser accesibles desde la red** (bloquear
explícitamente; Docker Desktop puede saltarse reglas genéricas — verificar desde otra máquina):

```powershell
New-NetFirewallRule -DisplayName "Bloquear Mongo 27017" -Direction Inbound -Protocol TCP -LocalPort 27017 -Action Block
New-NetFirewallRule -DisplayName "Bloquear MediaMTX API 9997" -Direction Inbound -Protocol TCP -LocalPort 9997 -Action Block
New-NetFirewallRule -DisplayName "Bloquear Mosquitto WS 9001" -Direction Inbound -Protocol TCP -LocalPort 9001 -Action Block
New-NetFirewallRule -DisplayName "Bloquear backend directo 8099" -Direction Inbound -Protocol TCP -LocalPort 8099 -Action Block
```

Resumen — **abiertos**: 80/TCP (web), 8189/UDP (video WebRTC, NUEVO), 1883/TCP (solo la IP de la
placa: Mosquitto tiene `allow_anonymous true`, cualquiera con acceso al puerto podría publicar
comandos de relés). **Bloqueados**: 27017 (Mongo sin auth), 9997 (API MediaMTX anónima), 9001, 8099.
El puerto **8889 ya no se publica** (la señalización WHEP va por nginx en `/whep/`): eliminar reglas
o accesos antiguos a `<host>:8889` si existían.

---

## Paso 8 — Verificación post-despliegue

### 8.1 Salud de servicios

```powershell
docker compose ps                                      # 5 servicios Up; 4 "healthy" (mediamtx no tiene healthcheck)
Invoke-WebRequest http://localhost/ -UseBasicParsing   # HTML del frontend
Invoke-WebRequest http://localhost:9997/v3/paths/list -UseBasicParsing   # API MediaMTX responde JSON
```

(mediamtx no tiene healthcheck: su verificación real es la cámara, paso 8.7.)

### 8.2 Datos preservados

```powershell
docker compose logs backend --tail 30      # sin errores de Mongo/cifrado
```

Abrir `http://localhost/` en el navegador del propio servidor: **NO debe pedir crear el administrador
inicial**. Si lo pide, está usando volúmenes nuevos vacíos → revisar el nombre de proyecto (paso 1.5);
los datos viejos siguen en el volumen con el prefijo antiguo.

### 8.3 Login local (y migración bcrypt si hace falta)

Iniciar sesión en `http://localhost/` con un usuario existente. Si falla con credenciales correctas,
las contraseñas pueden estar en texto plano (instalación pre-2025-11-26). Ejecutar la migración desde
un contenedor Go en la red del compose (el script conecta por defecto a `localhost`, que dentro de un
contenedor no es el host — usar la URI del servicio):

```powershell
# nombre de red: <proyecto>_generador-network — confirmar con: docker network ls
docker run --rm -v C:\ruta\al\proyecto\BackEnd:/app -w /app --network <proyecto>_generador-network -e MONGO_URI="mongodb://mongodb:27017" golang:1.24-alpine go run -tags migratepasswords ./scripts/migrate_passwords.go
```

(Si el script no lee `MONGO_URI` del entorno, editar la URI hardcodeada en
`BackEnd/scripts/migrate_passwords.go:24` a `mongodb://mongodb:27017` antes de ejecutarlo.)

### 8.4 Login REMOTO (prueba crítica de la cookie Secure)

Desde **otra máquina** de la red: abrir `http://<IP-del-servidor>/` e iniciar sesión.

- Si la sesión **no persiste** (vuelve al login tras autenticar, o las llamadas a `/api` devuelven
  401): es la cookie `Secure` sobre HTTP (advertencia crítica 3). Mitigaciones, por decidir según
  política: (a) poner TLS/HTTPS delante (no incluido en el stack actual), o (b) cambiar
  `ENVIRONMENT=production` a `development` en `docker-compose.yml:85` y `docker compose up -d backend`
  — esto quita el flag Secure pero también relaja la validación de origen del WS; es un parche, no la
  solución correcta.

### 8.5 WebSocket / datos en vivo

Con sesión iniciada desde la otra máquina, comprobar que el panel muestra estado en tiempo real.
Si no: revisar `FRONTEND_ORIGIN` en `.env` (debe ser exactamente el origen del navegador, p. ej.
`http://10.1.1.50`) y `docker compose up -d backend`.

### 8.6 MQTT y placa

1. En la web → Configuración: fijar **"IP del broker MQTT local"** = `mqtt-broker` (el backend añade
   `:1883` y `tcp://` automáticamente), verificar el ID de placa y el tópico
   (`/dingtian/relay<serial>/out/#`) y **guardar**. Este primer guardado además purga las llaves
   legacy del dual-broker (`$unset` en `BackEnd/config/service.go:371-402`) y cifra las contraseñas
   en reposo (`encryptSecrets`, `service.go:332-335`).
2. Apuntar la placa Dingtian a `<IP-del-servidor>:1883` sin credenciales (desde la web de la placa) —
   solo si antes usaba otro broker. **Anotar el broker anterior de la placa** (se necesita si hay
   rollback).
3. Verificar tráfico (debe imprimir un mensaje de la placa en ≤30 s):

```powershell
docker exec generador-mqtt mosquitto_sub -t "/dingtian/#" -C 1 -W 30
```

### 8.7 Cámara

En la web, configurar/verificar la URL RTSP de la cámara. Desde la otra máquina, abrir la vista de
cámara: el video debe cargar (señalización por `/whep/generador/whep` en el puerto 80; video por
UDP 8189). Si queda en "Conectando": revisar `WEBRTC_HOST` en `.env`
(+ `docker compose up -d mediamtx`) y la regla 8189/UDP del firewall.

### 8.8 Prueba funcional end-to-end (la función principal del sistema)

Desde la web, ejecutar un ciclo real de comando: activar/desactivar un relé (o una secuencia de
arranque/parada si es seguro hacerlo) y confirmar que el estado del relé cambia en la placa y que el
cambio se refleja de vuelta en el panel.

### 8.9 Caché de clientes y limpieza final

- El frontend registró en algún momento un service worker que precachea HTML: los navegadores de los
  operadores pueden seguir mostrando la versión ANTIGUA. Pedirles **Ctrl+F5** (y si persiste, borrar
  datos del sitio / desregistrar el service worker en DevTools → Application).
- Una vez validado todo (incluido un par de días de operación si se prefiere), liberar disco:

```powershell
docker image prune -f                               # imágenes dangling del rebuild
# cuando ya no se quiera el rollback:
docker rmi generador-backend:pre-upgrade generador-frontend:pre-upgrade
```

### 8.10 Arranque automático tras reinicio

Los contenedores tienen `restart: unless-stopped`, pero **Docker Desktop en Windows no arranca solo**
sin la opción *Start Docker Desktop when you sign in* (Settings → General) y sin inicio de sesión del
usuario. Un corte de luz dejaría el sistema caído. Activar esa opción y, como prueba final,
**reiniciar el PC y verificar que todo vuelve solo** (8.1).

---

## Paso 9 — Plan de rollback

Condición previa: pasos 2.0-2.4 completados (mongodump validado, carpeta vieja respaldada, imágenes
etiquetadas `pre-upgrade`, `.env` viejo respaldado).

### 9.1 Bajar el stack nuevo (sin `-v`)

```powershell
cd C:\ruta\al\proyecto
docker compose down
```

### 9.2 Restaurar imágenes viejas

```powershell
docker tag generador-backend:pre-upgrade generador-backend:latest
docker tag generador-frontend:pre-upgrade generador-frontend:latest
```

(Si el compose viejo usaba otros nombres de imagen — ver 1.3/2.3 — re-etiquetar a ESOS nombres.)

### 9.3 Restaurar código y variables

- Caso git: `git reset --hard <commit-anotado-en-el-paso-3>`.
- Caso sin git: restaurar la carpeta desde el respaldo:
  `robocopy C:\respaldos\proyecto-viejo C:\ruta\al\proyecto /MIR`.
- Restaurar variables: `Copy-Item .env.OLD-backup .env -Force` (o el `.env.docker` respaldado).

### 9.4 Restaurar la BD solo si se guardó configuración desde la web nueva

Si en el paso 8.6 se guardó la configuración, el documento `generator.config` ya sufrió el `$unset`
de llaves legacy y el cifrado de contraseñas: **la versión antigua puede no entender ese documento**.
Restaurar el dump (si nadie guardó, la BD no fue alterada — la limpieza ocurre en `Save`, no al
arrancar — y este sub-paso se omite):

```powershell
# levantar SOLO mongo con el compose viejo y esperar a que esté healthy:
docker compose -f <compose-viejo> up -d mongodb
docker compose -f <compose-viejo> ps
# restaurar:
docker cp C:\respaldos\generator-backup-<fecha>.archive generador-mongodb:/tmp/restore.archive
docker exec generador-mongodb mongorestore --drop --archive=/tmp/restore.archive
# (añadir -u admin -p <pass> --authenticationDatabase admin si el stack viejo corre con auth)
```

### 9.5 Levantar el stack viejo

**Usar exactamente el mismo compose/commit con el que corría producción** (anotado en 1.3). No vale
"cualquier compose viejo": p. ej., si el volumen se inicializó SIN auth y se levanta
`docker-compose-cliente.yml` (que añade `--auth` y una URI con credenciales), el backend viejo no
autentica y el rollback falla.

```powershell
docker compose -f <compose-viejo> up -d
docker compose -f <compose-viejo> ps
```

### 9.6 Notas del rollback

- Si la placa Dingtian se reapuntó al broker nuevo en 8.6 y el stack viejo no tenía Mosquitto,
  **reapuntar la placa a su broker anterior** (anotado en 8.6) o no habrá datos.
- Las sesiones quedan invalidadas de nuevo (re-login).
- Si se restauró el dump, los cambios de configuración posteriores al respaldo se pierden.
- Restauración física alternativa de volúmenes (solo con el stack abajo y solo si se hizo el tar
  post-down): `docker run --rm -v <proyecto>_mongodb_data:/data -v C:\respaldos:/backup alpine sh -c "rm -rf /data/* && tar xzf /backup/mongodb_data.tar.gz -C /data"`.

---

## Recomendación pendiente (no bloquea la actualización)

- `docker-compose.yml:46` usa `bluenviron/mediamtx:latest` y `mediamtx.yml` está escrito para la
  semántica de autenticación de MediaMTX v1.19+. Un `latest` futuro puede romper la configuración sin
  que cambie nada del repo. Conviene fijar un tag (p. ej. `bluenviron/mediamtx:1.19.1`) en un commit
  posterior.

## Resumen de incertidumbres a resolver en sitio ([VERIFICAR])

| # | Dato | Dónde comprobarlo | Afecta a |
|---|------|-------------------|----------|
| 1 | Modalidad y compose/commit con el que corre producción (git / cliente / docker-export) | `docker compose ls`, `git log`, contenido de la carpeta | 1.3, 2.2, 6.2, 9.3, 9.5 |
| 2 | ¿Mongo con o sin auth? (por el contenedor, no por el archivo) | `docker inspect generador-mongodb --format "{{.Config.Env}}"` | 2.1, 9.4 |
| 3 | Imagen/major de Mongo actual | `docker inspect generador-mongodb --format "{{.Config.Image}}"` | 1.3 |
| 4 | Nombres reales de las imágenes backend/frontend | `docker ps` (columna Image) | 2.3, 9.2 |
| 5 | Nombre del proyecto Compose (prefijo de volúmenes) | `docker volume ls` | 1.5, 3, 8.3 |
| 6 | ¿Contraseñas de usuario en bcrypt o texto plano? | Intento de login (8.3) o colección `generator.users` | 8.3 |
| 7 | ¿Config con dual-broker (`broker_mode`/`local_broker`)? | Documento `generator.config` | 8.6 |
| 8 | Cookie Secure sobre `http://<IP>` | Prueba 8.4 desde otra máquina | Decisión TLS vs ENVIRONMENT |
| 9 | Versión de Docker Desktop / Compose v2 | `docker compose version` | 1.1 |
| 10 | Límite de RAM de WSL2 (build de 6 GB) | Docker Desktop → Resources / `.wslconfig` | 6.1 |
| 11 | ¿Servicios nativos de MongoDB/Mosquitto corriendo? | `Get-Service` (paso 1.7) | 1.7, 8.6 |
