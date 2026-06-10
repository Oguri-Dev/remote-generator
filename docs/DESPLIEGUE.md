# Despliegue en producción (Windows + Docker)

Guía para instalar el sistema en el PC de producción del cliente. El servidor
tiene dos redes: una a internet y otra en la red de monitoreo (donde está la
placa y la cámara). **La que interesa es la red de monitoreo.**

## Diseño cero-config

El sistema está pensado para instalarse **sin conocer el segmento de red de
antemano**. La API, el WebSocket, el MQTT y la señalización de la cámara usan
rutas **relativas** proxeadas por nginx, así que funcionan con cualquier IP sin
reconstruir nada.

**Lo único que depende del segmento de terreno es `WEBRTC_HOST`** (la IP del
servidor por la que el navegador del operador recibe el vídeo de la cámara).

## Requisitos del PC de producción

- Windows con **Docker Desktop** instalado y corriendo (ver instalación abajo).
- **Git para Windows** instalado — se usa para clonar el proyecto y traer
  actualizaciones. Descargar de `git-scm.com` e instalar con las opciones por
  defecto (incluye el cliente SSH que usa la deploy key). Verificar:

  ```powershell
  git --version
  ```

- El PC conectado a la red de monitoreo (donde están placa `10.x` y cámara).
- Una **IP fija** del servidor en esa red (configurarla en Windows, no DHCP).

### Instalación de Docker Desktop

1. **Actualizar WSL antes de instalar Docker.** Abrir una ventana de **PowerShell
   como administrador** (clic derecho → "Ejecutar como administrador") y ejecutar:

   ```powershell
   wsl --update
   ```

   Esto instala/actualiza el motor WSL 2 sobre el que corre Docker. Si pide
   reiniciar el PC, reiniciar antes de continuar.

2. **Instalar Docker Desktop** (descarga desde docker.com). En las opciones del
   instalador:
   - ✅ **"Use WSL 2 instead of Hyper-V"**: marcarla. Es el backend que usa el
     sistema (y la única opción en Windows Home, donde no existe Hyper-V).
   - ❌ **"Allow Windows containers"**: dejarla desmarcada. Todo el stack son
     contenedores Linux; esa opción no se usa.

3. **Configuración tras instalar** (Docker Desktop → Settings):
   - ⚠️ **MUY IMPORTANTE — General → marcar la casilla "Start Docker Desktop when
     you sign in to your computer"** (viene DESMARCADA de fábrica). Sin esto,
     Docker no arranca al encender el PC: el sistema queda caído tras cualquier
     reinicio o corte de luz, y todos los comandos `docker` fallan con el error
     `failed to connect to the docker API at npipe:...` — que significa
     exactamente eso: Docker Desktop no está corriendo. Solución siempre: abrir
     Docker Desktop y esperar a que el ícono de la ballena diga "Engine running".
   - **Resources → Memory**: solo relevante si se va a **construir desde el
     código fuente** (la instalación normal descarga imágenes ya construidas y no
     necesita esto). El build del frontend requiere ~6 GB de RAM dentro de la VM
     de Docker; el default de WSL 2 es el 50 % de la RAM del equipo — con 16 GB o
     más no hay que tocar nada, con 8 GB subir el límite aquí (o en
     `C:\Users\<usuario>\.wslconfig`).

4. Verificar que quedó operativo:

   ```powershell
   docker version
   docker compose version   # debe existir (Compose v2)
   ```

## Qué corre solo y qué se configura en terreno

| Componente              | ¿Configurar red en terreno? | Dónde / cómo                                              |
| ----------------------- | --------------------------- | -------------------------------------------------------- |
| **MongoDB**             | No                          | Interno al stack (`mongodb:27017`). Arranca solo.        |
| **Broker MQTT (Mosquitto)** | No                      | Interno al stack. Arranca solo, escucha en `1883`.       |
| **API / WebSocket / Cámara (señalización)** | No          | Rutas relativas vía nginx. Funcionan en cualquier IP.    |
| **Campo "Broker MQTT local"** (web) | Sí                  | En **Configuración** de la app, poner `mqtt-broker`.     |
| **La placa Dingtian**   | **Sí**                      | Desde la web propia de la placa, apuntarla al servidor.  |
| **`WEBRTC_HOST`** (cámara) | Sí                       | En `.env`, la IP del servidor (ver "Ajuste remoto").     |

> **El broker MQTT vive en este servidor.** La placa Dingtian es quien se conecta
> a él, no al revés. Por eso, en terreno hay que entrar a la web de la placa y
> apuntarla a `<IP-del-servidor>:1883`. El broker acepta conexiones anónimas
> (sin usuario/contraseña), así que en la placa basta con la IP y el puerto.

## Obtener el proyecto sin cuenta personal (deploy key)

El repositorio es privado, pero **no hay que iniciar sesión con una cuenta personal
en el PC del cliente**. Lo correcto es una *deploy key*: una clave SSH de solo
lectura que pertenece al repositorio (no a una persona) y permite clonar y hacer
`git pull` indefinidamente.

### En el PC de instalación (una sola vez)

```powershell
# 1. Generar el par de claves (Enter a todo; sin passphrase)
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\generador_deploy

# 2. Mostrar la clave PUBLICA (esta es la que se registra en GitHub)
Get-Content $env:USERPROFILE\.ssh\generador_deploy.pub
```

Crear (o editar) el archivo `C:\Users\<usuario>\.ssh\config` con:

```
Host github.com
  IdentityFile ~/.ssh/generador_deploy
  IdentitiesOnly yes
```

### En GitHub (lo hace quien administra el repo)

Repo → **Settings** → **Deploy keys** → **Add deploy key**: pegar la clave pública,
ponerle un título identificable (ej. `instalacion-cliente-X`) y **NO marcar**
"Allow write access" (solo lectura).

### Clonar y actualizar (clon parcial: sin código fuente)

Como las imágenes vienen preconstruidas, el PC de producción **no necesita el
código fuente**. El clon parcial descarga solo lo necesario (compose,
configuraciones y guías; `BackEnd/` y `FrontEnd/` ni se descargan):

```powershell
git clone --filter=blob:none --sparse git@github.com:Oguri-Dev/remote-generator.git C:\remote-generator
git -C C:\remote-generator sparse-checkout set docs
# actualizaciones futuras, sin login:
git -C C:\remote-generator pull
```

> Para desarrollo (o si se quiere construir localmente) se usa el clon completo:
> `git clone git@github.com:Oguri-Dev/remote-generator.git`.

> Alternativa sin SSH: un *fine-grained personal access token* de **solo lectura**
> limitado a este repo (GitHub → Settings → Developer settings → Fine-grained
> tokens; Repository access: solo este repo; Permissions → Contents: Read-only).
> Se usa como contraseña en el primer `git clone` por HTTPS y queda guardado en el
> Administrador de credenciales de Windows. Expira (máximo 1 año) y hay que
> renovarlo; la deploy key no.

> Al dar de baja un equipo o cambiar de manos un PC: borrar su deploy key en
> Settings → Deploy keys y queda revocado el acceso de ese equipo.

## Token para descargar las imágenes preconstruidas (GHCR)

Las imágenes Docker del sistema **ya vienen construidas**: GitHub Actions las
publica en GitHub Container Registry (`ghcr.io`) en cada actualización del
repositorio. El PC de producción **no compila nada** — solo las descarga. Para eso
necesita un token de solo lectura de paquetes:

1. Quien administra el repo crea el token (una vez, sirve para todas las
   instalaciones): GitHub → Settings → Developer settings → **Personal access
   tokens (classic)** → *Generate new token (classic)* → marcar **únicamente** el
   scope **`read:packages`** → expiración a gusto → generar y guardar el token en
   el gestor de contraseñas del equipo de instalaciones.
2. En el PC de producción, iniciar sesión en el registro (una sola vez; queda
   guardado):

   ```powershell
   docker login ghcr.io
   # Username: Oguri-Dev
   # Password: <el token read:packages>
   ```

   > **Truco al pegar el token**: en el campo `Password` de la consola, `Ctrl+V`
   > NO funciona (inserta caracteres basura tipo `^V`). Hay que copiar el token
   > y pegarlo con **un clic derecho** sobre la ventana de PowerShell. No se ve
   > nada en pantalla al pegar — es normal (la contraseña va oculta): dar Enter.
   > Tampoco pasar el token escrito en el comando (p. ej. con `-p`): quedaría
   > guardado en el historial de la consola.

> Este token solo permite **descargar imágenes**. No da acceso al código, ni
> permite modificar nada. Si se filtra, se revoca y se genera otro.

## Pasos de instalación

### 1. Copiar el proyecto al PC y crear el `.env`

```powershell
copy .env.docker.example .env
```

Editar `.env` y completar:

- `SESSION_SECRET` y `CONFIG_ENC_KEY`: generar dos cadenas aleatorias distintas.
  En Windows con Docker: `docker run --rm alpine sh -c "head -c32 /dev/urandom | base64"`
  (ejecutar dos veces, una para cada variable).
- `WEBRTC_HOST`: **la IP fija del servidor en la red de monitoreo**
  (ej. `WEBRTC_HOST=10.1.1.50`). Si aún no la sabes, déjala en `localhost` y la
  ajustas cuando el técnico confirme el segmento (ver "Ajuste remoto" abajo).
- `FRONTEND_ORIGIN`: el origen exacto con el que los operadores abren la web
  (ej. `FRONTEND_ORIGIN=http://10.1.1.50`). Sin esto, el WebSocket rechaza a todo
  navegador que no sea `localhost` y el panel queda sin datos en tiempo real.

Además, crear el archivo `docker-compose.override.yml` junto al compose (parche
necesario mientras el sistema sirva HTTP sin certificado: en modo `production` la
cookie de sesión se marca `Secure` y los navegadores la descartan sobre
`http://<IP>`, rompiendo el login desde otras máquinas):

```powershell
@'
services:
  backend:
    environment:
      ENVIRONMENT: development
'@ | Out-File C:\remote-generator\docker-compose.override.yml -Encoding ascii
```

### 2. Levantar todo

Con el `docker login ghcr.io` ya hecho (ver sección del token):

```powershell
docker compose pull
docker compose up -d
```

`pull` descarga las imágenes ya construidas (un par de minutos según la conexión;
no compila nada). Verificar que todo quede arriba y sano:

```powershell
docker compose ps
```

> Alternativa sin registro (p. ej. desarrollo, o sitio sin acceso a ghcr.io):
> `docker compose up -d --build` construye las imágenes desde el código fuente en
> el propio PC. Tarda varios minutos y requiere ~6 GB de RAM en la VM de Docker.

### 3. Crear el usuario inicial

Abrir en el navegador `http://<IP-del-servidor>/` (o `http://localhost/` desde
el propio PC). La primera vez pedirá **crear el usuario administrador**.

### 4. Configurar placa y cámara desde la web

En **Configuración**:

- **ID de la placa**: el serial de la placa Dingtian (ej. `8721`).
- **Tópico MQTT**: `/dingtian/relay<serial>/out/#` (ej. `/dingtian/relay8721/out/#`).
- **Broker MQTT local**: poner `mqtt-broker` (el broker del stack; backend y broker
  comparten la red interna de Docker, por eso va el nombre del servicio, no una IP).
- **Cámara** (opcional): habilitar y poner el RTSP, usuario y contraseña.

### 5. Apuntar la placa Dingtian al broker

La placa es quien se conecta al broker, así que hay que configurarla desde **su
propia interfaz web** (la IP `10.x` de la placa en la red de monitoreo):

- **Servidor / broker MQTT**: la IP del servidor en la red de monitoreo.
- **Puerto**: `1883`.
- **Usuario / contraseña**: dejar vacíos (el broker acepta conexiones anónimas).
- **Relay Password**: debe quedar en `0` (el backend envía los comandos con
  `pass: 0`; con otro valor la placa los ignora).

Una vez apuntada, la placa empezará a publicar en su tópico y la app reflejará el
estado de los relés.

> Guía detallada de **todos los menús de la placa** (red, MQTT, entradas físicas,
> Input Link Relay, funciones a deshabilitar y verificación):
> [CONFIGURACION-PLACA.md](CONFIGURACION-PLACA.md).

## Ajuste remoto del segmento (cuando el técnico esté en terreno)

Cuando sepas la IP definitiva del servidor en la red de monitoreo:

1. Editar `.env`: `WEBRTC_HOST=<IP del servidor>`
2. Reiniciar solo el gateway de cámara (NO requiere reconstruir nada):
   ```powershell
   docker compose up -d mediamtx
   ```

Eso es todo. El resto del sistema ya funciona con cualquier IP por las rutas
relativas.

## Actualizar una instalación existente

```powershell
cd C:\remote-generator
git pull               # trae compose, configs y guías actualizados (deploy key)
docker compose pull    # descarga las imágenes nuevas (token ghcr)
docker compose up -d   # recrea solo los servicios que cambiaron
docker image prune -f  # opcional: libera el espacio de las imágenes viejas
```

Downtime: segundos. Antes de actualizar conviene un respaldo de la base de datos:

```powershell
docker exec generador-mongodb mongodump --db generator --archive=/tmp/backup.archive
docker cp generador-mongodb:/tmp/backup.archive C:\respaldos\generator-$(Get-Date -Format yyyyMMdd).archive
```

> Para migrar instalaciones muy antiguas (anteriores a junio 2026), seguir
> [ACTUALIZACION-PRODUCCION.md](ACTUALIZACION-PRODUCCION.md).

## Puertos que usa el sistema

| Puerto      | Uso                                          | ¿Exponer en la red? |
| ----------- | -------------------------------------------- | ------------------- |
| 80/TCP      | Interfaz web (nginx)                         | Sí (operadores)     |
| 8189/UDP    | Vídeo WebRTC de la cámara                    | Sí (operadores)     |
| 1883/TCP    | Broker MQTT (placa)                          | Solo red monitoreo  |
| 8099/TCP    | API backend (también accesible vía nginx)    | Opcional            |
| 27017, 9997 | Mongo y API MediaMTX (internos)              | NO exponer          |

> En el firewall de Windows, asegurar que **80/TCP** y **8189/UDP** estén
> permitidos para que los operadores accedan a la web y a la cámara.

## Arranque automático

Docker Desktop puede configurarse para iniciar con Windows (Settings → General →
"Start Docker Desktop when you log in"). Los contenedores tienen
`restart: unless-stopped`, así que vuelven a levantar solos tras un reinicio.

## Verificación rápida

```powershell
# Todo arriba y sano
docker compose ps
# La web responde
curl http://localhost/
# La cámara está lista en el gateway (si la configuraste)
curl http://localhost:9997/v3/paths/list
```
