package controllers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"generador/broker"
	"generador/config"
)

// ===== Broadcaster hacia WS (inyectado desde main) =====

var broadcast func([]byte)
var configAPI *ConfigAPI

func SetBroadcaster(fn func([]byte)) { broadcast = fn }
func SetConfigAPI(api *ConfigAPI)    { configAPI = api }

// ===== Estado de secuencia en memoria con worker pattern =====

type sequenceTask struct {
	RelayID  string
	Action   string // "ON", "OFF", "RESTART"
	Delay    int
	Username string // Usuario que ejecutó la acción
}

var (
	sequenceState = make(map[string]string) // Dinámico, se inicializa desde config
	stateMutex    sync.RWMutex
	taskQueue     = make(chan sequenceTask, 20)
)

// Inicializar el estado de secuencia para todos los relays habilitados
func initSequenceState() {
	stateMutex.Lock()
	defer stateMutex.Unlock()

	// Limpiar y reinicializar con todos los relays de la config
	sequenceState = make(map[string]string)
	for i := 1; i <= 8; i++ {
		sequenceState[fmt.Sprintf("%d", i)] = ""
	}
}

// Worker que procesa tareas de forma thread-safe
func init() {
	initSequenceState()
	go sequenceWorker()
}

func sequenceWorker() {
	for task := range taskQueue {
		// Obtener nombre del relay desde config
		relayConfig := config.GetRelayByID(task.RelayID)
		relayName := "Relay " + task.RelayID
		if relayConfig != nil {
			relayName = relayConfig.Name
		}

		// Actualizar estado
		stateMutex.Lock()
		switch task.Action {
		case "ON":
			sequenceState[task.RelayID] = "starting"
		case "OFF":
			sequenceState[task.RelayID] = "stopping"
		case "RESTART":
			sequenceState[task.RelayID] = "restarting"
		}
		stateMutex.Unlock()
		notifySequenceStateChange()

		// Registrar actividad
		if configAPI != nil {
			description := fmt.Sprintf("%s - %s", relayName, task.Action)
			username := task.Username
			if username == "" {
				username = "system"
			}
			configAPI.LogActivity(task.RelayID, relayName, task.Action, description, username)
		}

		// Enviar comando MQTT
		status := task.Action
		if task.Action == "RESTART" {
			status = "OFF"
		}
		if err := sendMQTTCommand(task.RelayID, status, task.Delay); err != nil {
			log.Printf("❌ Error en comando MQTT para relay %s: %v", task.RelayID, err)
		}

		// Esperar el delay
		if task.Delay > 0 {
			time.Sleep(time.Duration(task.Delay) * time.Second)
		} else {
			time.Sleep(5 * time.Second) // delay default para secuencias
		}

		// Limpiar estado
		stateMutex.Lock()
		sequenceState[task.RelayID] = ""
		stateMutex.Unlock()
		notifySequenceStateChange()
	}
}

// ===== Formato de comando MQTT (mantiene orden de campos) =====

type MQTTCommand struct {
	Type   string `json:"type"`
	Idx    string `json:"idx"`
	Status string `json:"status"`
	Time   string `json:"time"`
	Pass   string `json:"pass"`
}

// ===== Helpers =====

func mqttInControlTopic(placaID int) string {
	// /dingtian/relay{placaID}/in/control
	return fmt.Sprintf("/dingtian/relay%d/in/control", placaID)
}

func notifySequenceStateChange() {
	stateMutex.RLock()
	state := make(map[string]string, len(sequenceState))
	for k, v := range sequenceState {
		state[k] = v
	}
	stateMutex.RUnlock()

	payload := map[string]any{
		"topic":   "/mqtt/sequence_state",
		"message": state,
	}
	b, err := json.Marshal(payload)
	if err != nil {
		log.Println("❌ notifySequenceStateChange marshal:", err)
		return
	}
	if broadcast != nil {
		broadcast(b)
	}
}

func sendMQTTCommand(relayID string, status string, delaySec int) error {
	// Obtener configuración del relay para verificar si está invertido
	cfg := config.Get()
	relayConfig := config.GetRelayByID(relayID)
	
	// Si el relay está marcado como invertido, invertir el estado
	if relayConfig != nil && relayConfig.InvertState {
		if status == "ON" {
			status = "OFF"
		} else if status == "OFF" {
			status = "ON"
		}
		log.Printf("🔄 Relay %s tiene InvertState=true. Status invertido: %s", relayID, status)
	}

	// Construir comando en el orden exacto
	cmd := MQTTCommand{
		Type:   "ON/OFF",
		Idx:    relayID,
		Status: status,
		Time:   "0",
		Pass:   "0",
	}
	if delaySec > 0 {
		cmd.Type = "DELAY"
		cmd.Time = fmt.Sprintf("%d", delaySec)
	}

	// Serializar
	msg, err := json.Marshal(cmd)
	if err != nil {
		log.Println("❌ sendMQTTCommand marshal:", err)
		return fmt.Errorf("marshal error: %w", err)
	}

	// Tomar placaID desde la config en memoria (cargada desde Mongo)
	topic := mqttInControlTopic(cfg.Idplaca)

	// Publicar
	log.Printf("📤 MQTT publish → %s : %s", topic, string(msg))
	if err := broker.Publish(topic, msg); err != nil {
		return fmt.Errorf("publish error: %w", err)
	}

	return nil
}

// ===== Secuencias usando taskQueue =====

func startSequence() {
	// Obtener relays habilitados por tipo
	generatorRelays := config.GetRelaysByType("generador")
	rackRelays := config.GetRelaysByType("rack")
	moduleRelays := config.GetRelaysByType("modulo")

	// Encender en orden: Generadores -> Racks -> Módulos
	for _, r := range generatorRelays {
		taskQueue <- sequenceTask{RelayID: r.ID, Action: "ON", Delay: 0}
	}
	for _, r := range rackRelays {
		taskQueue <- sequenceTask{RelayID: r.ID, Action: "ON", Delay: 0}
	}
	for _, r := range moduleRelays {
		taskQueue <- sequenceTask{RelayID: r.ID, Action: "ON", Delay: 0}
	}
}

func stopSequence() {
	// Obtener relays habilitados por tipo
	generatorRelays := config.GetRelaysByType("generador")
	rackRelays := config.GetRelaysByType("rack")
	moduleRelays := config.GetRelaysByType("modulo")

	// Apagar en orden inverso: Módulos -> Racks -> Generadores
	for i := len(moduleRelays) - 1; i >= 0; i-- {
		taskQueue <- sequenceTask{RelayID: moduleRelays[i].ID, Action: "OFF", Delay: 0}
	}
	for i := len(rackRelays) - 1; i >= 0; i-- {
		taskQueue <- sequenceTask{RelayID: rackRelays[i].ID, Action: "OFF", Delay: 0}
	}
	for i := len(generatorRelays) - 1; i >= 0; i-- {
		taskQueue <- sequenceTask{RelayID: generatorRelays[i].ID, Action: "OFF", Delay: 0}
	}
}

// ===== HTTP Handlers =====

// POST /mqtt/action
// Body: { "relay_id":"1"|"2"|...|"8"|"all", "status":"ON"|"OFF"|"restart", "username":"..." }
func HandleMqttAction(w http.ResponseWriter, r *http.Request) {
	var cmd struct {
		RelayID  string `json:"relay_id"`
		Status   string `json:"status"`
		Username string `json:"username"`
	}
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
		http.Error(w, "❌ Error al leer la petición", http.StatusBadRequest)
		return
	}

	// Usar "system" si no viene username
	username := cmd.Username
	if username == "" {
		username = "system"
	}

	// Verificar si hay secuencia en curso (lectura thread-safe)
	stateMutex.RLock()
	inFlight := sequenceState[cmd.RelayID] == "starting" ||
		sequenceState[cmd.RelayID] == "stopping" ||
		sequenceState[cmd.RelayID] == "restarting"
	stateMutex.RUnlock()

	if inFlight {
		http.Error(w, "⚠️ Otra secuencia está en curso", http.StatusConflict)
		return
	}

	// Reiniciar TODO el equipamiento (racks + módulos) con secuencia de 2 segundos
	if cmd.RelayID == "all" && cmd.Status == "restart" {
		go restartAllEquipment()
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("✅ Secuencia de reinicio de equipamiento iniciada"))
		return
	}

	// Obtener configuración del relay
	relayConfig := config.GetRelayByID(cmd.RelayID)
	if relayConfig == nil {
		http.Error(w, "❌ RelayID no encontrado en configuración", http.StatusBadRequest)
		return
	}

	// Validar acción según tipo de relay
	switch relayConfig.Type {
	case "generador":
		// Generadores: solo ON/OFF
		if cmd.Status != "ON" && cmd.Status != "OFF" {
			http.Error(w, "❌ Generadores solo aceptan ON/OFF", http.StatusBadRequest)
			return
		}
		// Encender/Apagar generador individual
		action := cmd.Status
		taskQueue <- sequenceTask{RelayID: cmd.RelayID, Action: action, Delay: 0, Username: username}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(fmt.Sprintf("✅ Generador %s: %s", relayConfig.Name, action)))

	case "rack", "modulo":
		// Equipamiento: permite ON/OFF/restart
		if cmd.Status != "ON" && cmd.Status != "OFF" && cmd.Status != "restart" {
			http.Error(w, "❌ Racks y módulos solo aceptan ON/OFF/restart", http.StatusBadRequest)
			return
		}
		
		// Para restart, usar secuencia de reinicio con delay de 5s
		if cmd.Status == "restart" {
			taskQueue <- sequenceTask{RelayID: cmd.RelayID, Action: "RESTART", Delay: 5, Username: username}
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(fmt.Sprintf("✅ Reiniciando %s", relayConfig.Name)))
		} else {
			// Para ON/OFF, ejecutar directamente sin delay
			taskQueue <- sequenceTask{RelayID: cmd.RelayID, Action: cmd.Status, Delay: 0, Username: username}
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(fmt.Sprintf("✅ %s %s: %s", relayConfig.Type, relayConfig.Name, cmd.Status)))
		}

	case "manual":
		// Manual: ON/OFF directo
		if cmd.Status != "ON" && cmd.Status != "OFF" {
			http.Error(w, "❌ Control manual solo acepta ON/OFF", http.StatusBadRequest)
			return
		}
		taskQueue <- sequenceTask{RelayID: cmd.RelayID, Action: cmd.Status, Delay: 0, Username: username}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(fmt.Sprintf("✅ Manual %s: %s", relayConfig.Name, cmd.Status)))

	default:
		http.Error(w, "❌ Tipo de relay no soportado o deshabilitado", http.StatusBadRequest)
	}
}

// restartAllEquipment reinicia todos los racks y módulos con 2 segundos de diferencia
func restartAllEquipment() {
	rackRelays := config.GetRelaysByType("rack")
	moduleRelays := config.GetRelaysByType("modulo")

	// Combinar todos los equipos de monitoreo
	allEquipment := append(rackRelays, moduleRelays...)

	// Reiniciar cada uno con 2 segundos de diferencia entre comandos MQTT
	// El delay es el tiempo que tarda el relay en volver a encenderse
	for i, relay := range allEquipment {
		delay := 5 // Delay para que el relay vuelva a encenderse
		// Agregar tarea al queue - el worker las procesa secuencialmente
		// y espera 5 segundos después de cada una
		taskQueue <- sequenceTask{
			RelayID: relay.ID,
			Action:  "RESTART",
			Delay:   delay,
		}
		// Pequeña pausa entre encolar tareas para mantener el orden
		if i < len(allEquipment)-1 {
			time.Sleep(2 * time.Second)
		}
	}
}

// GET /mqtt/sequence_state  →  { "sequenceState": { "1":"", "2":"", ... } }
func GetCurrentSequenceState(w http.ResponseWriter, r *http.Request) {
	stateMutex.RLock()
	defer stateMutex.RUnlock()
	resp := map[string]map[string]string{"sequenceState": sequenceState}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
