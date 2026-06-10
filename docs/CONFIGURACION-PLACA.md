# Configuración de la placa Dingtian (IOT Relay)

La placa Dingtian es quien ejecuta físicamente los relés (generador, rack, módulos) y
reporta sus estados. Se integra con el sistema **vía MQTT**: la placa se conecta al
broker Mosquitto que corre en el servidor y desde ahí el backend la lee y la comanda.

Esta guía explica los menús de la interfaz web de la placa y qué valor debe llevar
cada uno para este sistema. Referencia completa del fabricante: *IOT Relay User
Manual* (Dingtian Tech; SDK y herramientas en `http://www.dingtian-tech.com/sdk/relay_sdk.zip`).

> La web de la placa **no funciona en Internet Explorer** — usar Chrome o Firefox.

---

## 1. Acceso a la interfaz web de la placa

- **De fábrica**: IP `192.168.1.100`, usuario `admin`, contraseña `admin`.
- **En producción**: la IP fija de la placa en la red de monitoreo (anotada en la
  documentación del sitio; visible también en la app, sección "Estado controladores").
- Si se desconoce la IP: usar la herramienta **IP Finder** del SDK del fabricante
  (requiere estar en el mismo segmento y apagar el firewall durante la búsqueda), o
  como último recurso el **reset físico**: puentear los 2 pines "Default" con un
  jumper, apagar y encender la placa, retirar el jumper → vuelve a `192.168.1.100`
  con `admin`/`admin`.

## 2. Menú "Setting" — red e identidad

Configurar aquí la red de la placa:

- **DHCP: No** y una **IP estática** en la red de monitoreo, con su Netmask y Gateway.
  La placa debe tener IP fija: el sistema la monitorea y los vínculos del sitio
  dependen de ella.
- **Serial Number** (solo lectura): **anotarlo**. Es el dato que define los tópicos
  MQTT de la placa (`/dingtian/relay<SN>/...`) y debe coincidir con el campo
  **"ID de la placa"** en la Configuración de la app.
- **NTP Server**: opcional. Si la red de monitoreo no tiene salida a internet, la
  hora de la placa no se sincroniza; no afecta a la operación del sistema.

Al pulsar **Save**, la placa se reinicia (corte breve de conexión, los relés no
cambian de estado).

## 3. Menú "Relay Connect" — la integración MQTT (lo esencial)

La tabla de canales (RS485, CAN, UDP, TCP, MQTT) define por dónde se puede comandar
la placa. **Este sistema usa únicamente la fila `ETH-MQTT`**; el resto puede quedar
con sus valores por defecto.

| Campo | Valor | Por qué |
| --- | --- | --- |
| **ETH-MQTT → Broker Address** | `<IP-del-servidor>` (la IP fija del PC de producción en la red de monitoreo) | El broker Mosquitto corre en el servidor; la placa es quien se conecta a él. |
| **ETH-MQTT → Broker Port** | `1883` | Puerto estándar del broker del stack. |
| **ETH-MQTT → Broker Username / Password** | Dejar vacíos (o cualquier valor) | El broker acepta conexiones anónimas (`allow_anonymous true`). |

En la sección **Other** de la misma página:

| Campo | Valor | Por qué |
| --- | --- | --- |
| **Relay Password** | **`0` (obligatorio)** | El backend envía todos los comandos con `"pass":"0"`. Con cualquier otro valor, **la placa ignora los comandos del sistema** aunque el estado sí se vea en el panel. |
| Keep Alive Second | `30` (default) | Publicación periódica de estado (aplica a protocolos Dingtian; inofensivo para MQTT). |
| Jogging Time | `5` (default, 500 ms) | No lo usa el sistema. |
| **Power Failure Recovery Relay** | Decisión del sitio | `Yes` = tras un corte de energía la placa restaura el último estado de los relés. Evaluar con el responsable de terreno: puede implicar un rearranque automático del equipamiento. |
| Input Control Relay | Según cableado | `Yes` = las entradas físicas actúan los relés localmente (ver §5). |
| Button Type | Según cableado | Tipo de botón físico por canal (SelfLock / Jogging / Momentary). |

Al pulsar **Save**, la placa se reinicia y se conecta al broker.

## 4. Tópicos MQTT — cómo conversa la placa con el sistema

Con firmware V2.17.xx o superior (el instalado), la placa:

- **Publica** su estado en `/dingtian/relay<SN>/out/...` — estados de relés
  (`relay1`…`relay8`, `r1`…`r8`), entradas (`input1`…`input8`, `i1`…`i8`), `ip`,
  `sn`, `mac`, etc.
- **Escucha comandos** en `/dingtian/relay<SN>/in/control`, con payload JSON. Es
  exactamente lo que envía el backend
  ([sequence_controller.go](../BackEnd/controllers/sequence_controller.go)):

```json
{"type":"ON/OFF","idx":"1","status":"ON","time":"0","pass":"0"}
```

En la **app → Configuración** deben coincidir:

- **ID de la placa** = Serial Number (ej. `8718`)
- **Tópico MQTT** = `/dingtian/relay<SN>/out/#` (ej. `/dingtian/relay8718/out/#`)
- **IP del broker MQTT local** = `mqtt-broker`

Verificación rápida desde el servidor (debe imprimir un mensaje en ≤30 s):

```powershell
docker exec generador-mqtt mosquitto_sub -t "/dingtian/#" -C 1 -W 30
```

## 5. Menús "Input" e "Input Link Relay" — entradas físicas

- **Input**: muestra en vivo el nivel (High/Low) de las entradas I1–I8. Útil para
  verificar el cableado en comisionamiento.
- **Input Link Relay**: vincula entradas físicas a relés **dentro de la propia
  placa**, sin pasar por el software. Esta lógica sigue funcionando aunque el
  servidor esté apagado — es la capa de respaldo/seguridad local.

Cómo leer la tabla (por cada entrada):

- **Type**: tipo de señal (`SelfLock` = interruptor con enclavamiento,
  `Jogging` = pulso, `Momentary` = pulsador).
- **Action Level**: nivel eléctrico que se considera "activo" (`LOW` = activa a 0 V,
  coherente con el esquema del fabricante: 0 V = relé ON).
- Las 4 columnas de acciones: **ON (Action ON)** = al activarse la entrada,
  *enciende* los relés listados; **ON (Action OFF)** = al activarse, *apaga* los
  listados; **OFF (Action ON)** = al desactivarse, *enciende*; **OFF (Action OFF)** =
  al desactivarse, *apaga*. Los relés se agregan con el desplegable (+ Add) y se
  quitan haciendo clic en el botón verde del relé. Guardar con **Save**.

### Configuración vigente en producción (registrada el 2026-06-10)

Todas las entradas: `SelfLock`, nivel activo `LOW`.

| Entrada | Al activarse → enciende | Al desactivarse → apaga |
| --- | --- | --- |
| I1 | R1 | R1 |
| I2 | R2 | R2 |
| I3 | R3 | R3 |
| I4 | R4 | R4 |
| I5 | R5 | R5 |
| I6 | R1, R2, R3, R4, R6 | R1, R2, R3, R4, R6 |
| I7 | R7 | R1, R2, R3, R4, R7 |
| I8 | R8 | R8 |

Correspondencia con la configuración de la app en este sitio: la entrada **7** es la
entrada de **emergencia** (en la app: `emergency_input_id = 7`) y el relé **6** está
asociado al **modo manual** (`relay_manual = 6`, detección por entrada). El
significado final de cada vínculo depende del **cableado de terreno**: si se
modifica el cableado, hay que actualizar de forma coherente esta tabla en la placa
**y** la configuración de relés/entradas en la app.

## 6. Menús que deben quedar deshabilitados

- **Relay Task** (tareas programadas por calendario): todas las filas en `No`. Las
  secuencias las maneja el sistema, no la placa.
- **IP WatchDog**: `Disabled` en todas las filas. Esta función enciende/apaga relés
  automáticamente según pings a una IP — **peligroso en un generador**, porque
  actuaría los relés fuera del control y registro del sistema.
- **Relay CGI Test**: no es configuración sino una página de prueba manual
  (botones Do On / Do Off por relé). Útil en comisionamiento, pero **actúa los
  relés reales**: usar solo con el equipamiento en condición segura.

## 7. Verificación de la integración (checklist)

1. La placa aparece **Conectada** en la app (sección "Estado controladores", con su
   IP, serial y MAC).
2. `mosquitto_sub` (comando del §4) imprime mensajes de la placa.
3. Los estados de relés del panel coinciden con los LED CH1–CH8 de la placa.
4. Un comando desde la web (p. ej. reiniciar un módulo) cambia el relé físico y el
   panel refleja el cambio de vuelta.

## 8. Seguridad y mantenimiento

- **Reset User**: cambiar la contraseña por defecto `admin`/`admin` y registrar la
  nueva en la documentación del sitio.
- **To Factory** (web) o el jumper "Default" (físico, §1) restauran la placa de
  fábrica: habría que reconfigurar red y MQTT completos. Solo como recuperación.
- **Reboot**: reinicio remoto de la placa; los relés mantienen su estado según
  "Power Failure Recovery Relay".
- Mantener anotados: IP de la placa, Serial Number, credenciales de la web y esta
  tabla de Input Link Relay.
