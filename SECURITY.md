# Seguridad y endurecimiento

Este documento resume las medidas de seguridad del sistema y las **acciones
manuales obligatorias** que el código por sí solo no puede realizar.

## Modelo de autenticación

- **Sesiones firmadas (HMAC-SHA256).** Tras el login, el servidor emite una
  cookie `session` firmada con el secreto `SESSION_SECRET`. El cliente no puede
  falsificarla ni cambiar el usuario sin invalidar la firma. Reemplaza al
  esquema anterior, en el que la cookie `username` viajaba en texto plano y
  cualquiera podía suplantar a otro usuario con `Cookie: username=admin`.
  Ver [`BackEnd/auth/session.go`](BackEnd/auth/session.go).
- **Rutas de control protegidas.** Todas las operaciones que encienden/apagan
  equipamiento o modifican la configuración exigen sesión válida vía middleware
  (`/mqtt/action`, `/api/config`, `/api/config/broker-mode`, `/api/publish`,
  `/api/activity/*`, y el WebSocket `/ws`). Sin sesión devuelven `401`.
  Ver [`BackEnd/routes/router.go`](BackEnd/routes/router.go).
- **Usuario verificado, no declarado.** El registro de actividad toma el usuario
  de la sesión verificada (contexto), no del cuerpo de la petición, que era
  falsificable.
- **CORS y WebSocket fail-closed.** En producción (`ENVIRONMENT=production`)
  solo se acepta el origen configurado en `FRONTEND_ORIGIN`. Ya no se reflejan
  orígenes arbitrarios ni se permite todo en ausencia de configuración.
- **Contraseñas de usuario con bcrypt.** Ya estaba presente; se mantiene.

## Secretos del broker MQTT (cifrado en reposo)

Las contraseñas del broker MQTT (`passmqtt`, `cloud_pass`, `local_pass`) son
secretos **recuperables**: el backend las necesita en claro para conectarse, por
lo que no se pueden hashear. En su lugar:

- **Se cifran con AES-256-GCM** antes de guardarse en Mongo, usando la clave
  `CONFIG_ENC_KEY`. Un volcado de la base de datos muestra solo `enc:v1:...`.
  Ver [`BackEnd/crypto/secrets.go`](BackEnd/crypto/secrets.go).
- **GCM es cifrado autenticado:** si el valor cifrado se manipula, el descifrado
  falla en vez de devolver datos corruptos.
- **La API nunca expone el secreto en claro.** `GET /config` devuelve un
  centinela (`__SECRET_SET__`) cuando hay una contraseña guardada. En `PUT`, si
  el campo llega vacío o con el centinela, se conserva la contraseña existente;
  solo se actualiza si el usuario escribe una nueva.
- **Compatibilidad:** los valores en claro previos (sin prefijo `enc:v1:`) se
  leen sin error y se cifran en el siguiente guardado.

> El cifrado **no sustituye** la rotación: la contraseña `colocolo` ya estuvo
> expuesta en el repositorio y debe cambiarse en el broker igualmente.

## Cámara IP (RTSP → HLS vía MediaMTX)

La cámara es opcional y se configura desde la web (se guarda en Mongo como el
resto). Arquitectura:

1. La URL RTSP, usuario y contraseña de la cámara se guardan en la config.
   **`camara_pass` se cifra en reposo** (AES-GCM) igual que la del broker, y la
   API nunca la devuelve en claro (centinela `__SECRET_SET__`).
2. Al guardar, el backend llama a la **API de runtime de MediaMTX**
   (`MEDIAMTX_API`) para crear/actualizar/eliminar el path de la cámara con esa
   URL RTSP (forzando transporte TCP). No se tocan archivos ni se reinicia el
   gateway.
3. MediaMTX hace *pull* del RTSP y lo republica vía **WebRTC (WHEP)**, que el
   navegador reproduce con `RTCPeerConnection` nativo (latencia sub-segundo, sin
   polling de manifiesto, a diferencia de HLS).

> El navegador **no puede** reproducir RTSP directamente; por eso MediaMTX es
> obligatorio para ver la cámara. Si `MEDIAMTX_API` está vacío, el backend
> ignora la cámara sin fallar (el resto del sistema funciona igual).

> **Producción:** WebRTC necesita que el navegador alcance a MediaMTX por su IP.
> Hay que (a) poner la IP real del servidor en `webrtcAdditionalHosts`
> (mediamtx.yml), (b) apuntar `VITE_MEDIAMTX_WHEP` a esa IP:8889, y (c) abrir el
> puerto UDP 8189 además del 8889/TCP.

> La contraseña RTSP viaja embebida en la URL hacia MediaMTX dentro de la red
> interna. El puerto de la **API de MediaMTX (9997) no debe exponerse** fuera de
> la red de contenedores en producción; solo el HLS (8888) llega al cliente.

## Variables de entorno obligatorias

| Variable          | Descripción                                                              |
| ----------------- | ------------------------------------------------------------------------ |
| `SESSION_SECRET`  | Secreto para firmar sesiones. **Obligatorio**, ≥16 caracteres.           |
| `CONFIG_ENC_KEY`  | Clave para cifrar las contraseñas MQTT en Mongo. **Obligatoria**, ≥16.   |
| `ENVIRONMENT`     | `production` activa cookies `Secure` y CORS/WS estrictos.                |
| `FRONTEND_ORIGIN` | Origen permitido para CORS y WebSocket.                                  |

> Si `CONFIG_ENC_KEY` cambia, las contraseñas ya guardadas no se podrán
> descifrar y habrá que reintroducirlas desde la configuración.

Generar un secreto fuerte:

```bash
openssl rand -base64 32
```

> En producción, `ENVIRONMENT=production` marca la cookie como `Secure`, por lo
> que la aplicación **debe** servirse por HTTPS o la cookie no se enviará.

## ⚠️ Acciones manuales obligatorias (no automatizables)

Estas tareas no se pueden resolver solo con código y deben hacerse a mano:

1. **Rotar las credenciales MQTT expuestas.** El repositorio contenía
   credenciales en claro (usuario `andres`, contraseña `colocolo`) y una IP
   pública en `FrontEnd/src/const.ts` (archivo ya eliminado). Aunque el archivo
   se borró del árbol de trabajo, **sigue presente en el historial de Git**.
   Es imprescindible:
   - Cambiar la contraseña de ese usuario en el broker MQTT real.
   - Considerar reescribir el historial (`git filter-repo`) si el repo es
     público o se compartió, ya que el secreto es recuperable de commits previos.

2. **Definir `SESSION_SECRET` en cada despliegue.** Sin él, el backend no
   arranca (falla de forma explícita). No usar el valor de ejemplo.

3. **Revisar la licencia del frontend (Vuero / ThemeForest).** El frontend está
   construido sobre la plantilla comercial **Vuero** bajo licencia Envato. Si
   este sistema se comercializa o se ofrece como servicio, puede requerir una
   **Extended License**. Es una cuestión legal, no técnica.

## Trabajo pendiente recomendado

- **Refactor de componentes monolíticos.** `PrincipalViewComponent.vue` (~800
  líneas) y `ConfigComponentView.vue` (~600) mezclan UI, estado y lógica de
  WebSocket. Conviene extraer composables (`useRelaySequence`, `useBoardStatus`)
  y subcomponentes. No se abordó aquí por no disponer de un entorno de ejecución
  del frontend para verificar la reactividad tras el cambio.
- **Tests E2E del frontend.** Cypress está configurado pero sin pruebas de la
  lógica del generador (encender/apagar, parada de emergencia).
- **Tests de integración del backend** sobre MongoDB y MQTT (requieren infra:
  contenedores de Mongo y Mosquitto).
