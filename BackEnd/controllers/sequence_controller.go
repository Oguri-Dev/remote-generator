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

// ===== Estado de secuencia en memoria =====

var (
	sequenceState = map[string]string{
		"1": "", // Generador
		"2": "", // Rack Monitoreo
		"3": "", // Módulo 1
		"4": "", // Módulo 2
	}
	stateMutex sync.Mutex
)

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
	stateMutex.Lock()
	state := make(map[string]string, len(sequenceState))
	for k, v := range sequenceState {
		state[k] = v
	}
	stateMutex.Unlock()

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

func sendMQTTCommand(relayID string, status string, delaySec int) {
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
		return
	}

	// Tomar placaID desde la config en memoria (cargada desde Mongo)
	cfg := config.Get()
	topic := mqttInControlTopic(cfg.Idplaca)

	// Publicar
	log.Printf("📤 MQTT publish → %s : %s", topic, string(msg))
	broker.Publish(topic, msg)
}

// ===== Secuencias =====

func startSequence() {
	stateMutex.Lock()
	sequenceState["1"], sequenceState["2"], sequenceState["3"], sequenceState["4"] = "starting", "starting", "starting", "starting"
	stateMutex.Unlock()
	notifySequenceStateChange()

	// 1) Generador
	sendMQTTCommand("1", "ON", 0)
	time.Sleep(5 * time.Second)
	stateMutex.Lock()
	sequenceState["1"] = ""
	stateMutex.Unlock()
	notifySequenceStateChange()

	// 2) Rack Monitoreo
	sendMQTTCommand("2", "ON", 0)
	time.Sleep(5 * time.Second)
	stateMutex.Lock()
	sequenceState["2"] = ""
	stateMutex.Unlock()
	notifySequenceStateChange()

	// 3) Módulo 1
	sendMQTTCommand("3", "ON", 0)
	time.Sleep(5 * time.Second)
	stateMutex.Lock()
	sequenceState["3"] = ""
	stateMutex.Unlock()
	notifySequenceStateChange()

	// 4) Módulo 2
	sendMQTTCommand("4", "ON", 0)
	stateMutex.Lock()
	sequenceState["4"] = ""
	stateMutex.Unlock()
	notifySequenceStateChange()
}

func stopSequence() {
	stateMutex.Lock()
	sequenceState["1"], sequenceState["2"], sequenceState["3"], sequenceState["4"] = "stopping", "stopping", "stopping", "stopping"
	stateMutex.Unlock()
	notifySequenceStateChange()

	// 4) Módulo 2
	sendMQTTCommand("4", "OFF", 0)
	time.Sleep(2 * time.Second)
	stateMutex.Lock()
	sequenceState["4"] = ""
	stateMutex.Unlock()
	notifySequenceStateChange()

	// 3) Módulo 1
	sendMQTTCommand("3", "OFF", 0)
	time.Sleep(2 * time.Second)
	stateMutex.Lock()
	sequenceState["3"] = ""
	stateMutex.Unlock()
	notifySequenceStateChange()

	// 2) Rack Monitoreo
	sendMQTTCommand("2", "OFF", 0)
	time.Sleep(2 * time.Second)
	stateMutex.Lock()
	sequenceState["2"] = ""
	stateMutex.Unlock()
	notifySequenceStateChange()

	// 1) Generador
	sendMQTTCommand("1", "OFF", 0)
	stateMutex.Lock()
	sequenceState["1"] = ""
	stateMutex.Unlock()
	notifySequenceStateChange()
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

	// Bloqueos concurrentes de “secuencia en curso”
	stateMutex.Lock()
	inFlight := sequenceState[cmd.RelayID] == "starting" || sequenceState[cmd.RelayID] == "stopping" || sequenceState[cmd.RelayID] == "restarting"
	stateMutex.Unlock()
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
		go func() {
			resetRelays := []string{"2", "3", "4"}
			delayTimes := map[string]int{"2": 5, "3": 7, "4": 9}

			stateMutex.Lock()
			for _, r := range resetRelays {
				sequenceState[r] = "restarting"
				sendMQTTCommand(r, "OFF", delayTimes[r])
			}
			stateMutex.Unlock()
			notifySequenceStateChange()

			for _, r := range resetRelays {
				time.Sleep(time.Duration(delayTimes[r]) * time.Second)
				stateMutex.Lock()
				sequenceState[r] = ""
				stateMutex.Unlock()
				notifySequenceStateChange()
			}
		}()
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("✅ Reset All enviado y en proceso"))
		return
	}

	// Relays 2/3/4 con DELAY=5s
	if cmd.RelayID == "2" || cmd.RelayID == "3" || cmd.RelayID == "4" {
		delay := 5
		stateMutex.Lock()
		sequenceState[cmd.RelayID] = "restarting"
		stateMutex.Unlock()
		notifySequenceStateChange()

		sendMQTTCommand(cmd.RelayID, "OFF", delay)
		time.Sleep(time.Duration(delay) * time.Second)

		stateMutex.Lock()
		sequenceState[cmd.RelayID] = ""
		stateMutex.Unlock()
		notifySequenceStateChange()

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("✅ Comando ejecutado con DELAY"))
		return
	}

	http.Error(w, "❌ RelayID no válido", http.StatusBadRequest)
}

// GET /mqtt/sequence_state  →  { "sequenceState": { "1":"", "2":"", ... } }
func GetCurrentSequenceState(w http.ResponseWriter, r *http.Request) {
	stateMutex.Lock()
	defer stateMutex.Unlock()
	resp := map[string]map[string]string{"sequenceState": sequenceState}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
