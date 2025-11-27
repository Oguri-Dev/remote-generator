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

func SetBroadcaster(fn func([]byte)) { broadcast = fn }

// ===== Estado de secuencia en memoria con worker pattern =====

type sequenceTask struct {
	RelayID string
	Action  string // "ON", "OFF", "RESTART"
	Delay   int
}

var (
	sequenceState = map[string]string{
		"1": "", // Generador
		"2": "", // Rack Monitoreo
		"3": "", // Módulo 1
		"4": "", // Módulo 2
	}
	stateMutex sync.RWMutex
	taskQueue  = make(chan sequenceTask, 20)
)

// Worker que procesa tareas de forma thread-safe
func init() {
	go sequenceWorker()
}

func sequenceWorker() {
	for task := range taskQueue {
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
	cfg := config.Get()
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
	cfg := config.Get()
	// Valores por defecto si no están configurados
	relayGen := cfg.RelayGenerador
	if relayGen == "" {
		relayGen = "1"
	}
	relayRack := cfg.RelayRackMonitoreo
	if relayRack == "" {
		relayRack = "2"
	}
	relayMod1 := cfg.RelayModulo1
	if relayMod1 == "" {
		relayMod1 = "3"
	}
	relayMod2 := cfg.RelayModulo2
	if relayMod2 == "" {
		relayMod2 = "4"
	}

	// Encender en orden: Generador -> Rack -> Módulo1 -> Módulo2
	taskQueue <- sequenceTask{RelayID: relayGen, Action: "ON", Delay: 0}
	taskQueue <- sequenceTask{RelayID: relayRack, Action: "ON", Delay: 0}
	taskQueue <- sequenceTask{RelayID: relayMod1, Action: "ON", Delay: 0}
	taskQueue <- sequenceTask{RelayID: relayMod2, Action: "ON", Delay: 0}
}

func stopSequence() {
	cfg := config.Get()
	// Valores por defecto si no están configurados
	relayGen := cfg.RelayGenerador
	if relayGen == "" {
		relayGen = "1"
	}
	relayRack := cfg.RelayRackMonitoreo
	if relayRack == "" {
		relayRack = "2"
	}
	relayMod1 := cfg.RelayModulo1
	if relayMod1 == "" {
		relayMod1 = "3"
	}
	relayMod2 := cfg.RelayModulo2
	if relayMod2 == "" {
		relayMod2 = "4"
	}

	// Apagar en orden inverso: Módulo2 -> Módulo1 -> Rack -> Generador
	taskQueue <- sequenceTask{RelayID: relayMod2, Action: "OFF", Delay: 0}
	taskQueue <- sequenceTask{RelayID: relayMod1, Action: "OFF", Delay: 0}
	taskQueue <- sequenceTask{RelayID: relayRack, Action: "OFF", Delay: 0}
	taskQueue <- sequenceTask{RelayID: relayGen, Action: "OFF", Delay: 0}
}

// ===== HTTP Handlers =====

// POST /mqtt/action
// Body: { "relay_id":"1"|"2"|"3"|"4"|"all", "status":"ON"|"OFF" }
func HandleMqttAction(w http.ResponseWriter, r *http.Request) {
	var cmd struct {
		RelayID string `json:"relay_id"`
		Status  string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
		http.Error(w, "❌ Error al leer la petición", http.StatusBadRequest)
		return
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

	// Secuencias
	if cmd.RelayID == "1" && cmd.Status == "ON" {
		go startSequence()
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("✅ Secuencia de encendido iniciada"))
		return
	}
	if cmd.RelayID == "1" && cmd.Status == "OFF" {
		go stopSequence()
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("✅ Secuencia de apagado iniciada"))
		return
	}

	// Reset all (2,3,4 con delays distintos)
	if cmd.RelayID == "all" {
		taskQueue <- sequenceTask{RelayID: "2", Action: "RESTART", Delay: 5}
		taskQueue <- sequenceTask{RelayID: "3", Action: "RESTART", Delay: 7}
		taskQueue <- sequenceTask{RelayID: "4", Action: "RESTART", Delay: 9}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("✅ Reset All enviado y en proceso"))
		return
	}

	// Relays individuales 2/3/4 con DELAY=5s
	if cmd.RelayID == "2" || cmd.RelayID == "3" || cmd.RelayID == "4" {
		taskQueue <- sequenceTask{RelayID: cmd.RelayID, Action: "RESTART", Delay: 5}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("✅ Comando ejecutado con DELAY"))
		return
	}

	http.Error(w, "❌ RelayID no válido", http.StatusBadRequest)
}

// GET /mqtt/sequence_state  →  { "sequenceState": { "1":"", "2":"", ... } }
func GetCurrentSequenceState(w http.ResponseWriter, r *http.Request) {
	stateMutex.RLock()
	defer stateMutex.RUnlock()
	resp := map[string]map[string]string{"sequenceState": sequenceState}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
