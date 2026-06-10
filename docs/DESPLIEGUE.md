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

- Windows con **Docker Desktop** instalado y corriendo.
- El PC conectado a la red de monitoreo (donde están placa `10.x` y cámara).
- Una **IP fija** del servidor en esa red (configurarla en Windows, no DHCP).

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

### 2. Levantar todo

```powershell
docker compose up -d --build
```

La primera vez construye las imágenes (varios minutos). Verificar que todo quede
arriba y sano:

```powershell
docker compose ps
```

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
