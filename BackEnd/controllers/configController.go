package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"generador/config"
)

type ConfigAPI struct {
	Store *config.Store
}

func (a *ConfigAPI) Get(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	cur := config.Get()
	json.NewEncoder(w).Encode(cur)
}

func (a *ConfigAPI) Put(w http.ResponseWriter, r *http.Request) {
	var in config.Config
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	updated, err := a.Store.Save(ctx, in)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updated)
}

// SwitchBrokerMode cambia entre modo nube y local
func (a *ConfigAPI) SwitchBrokerMode(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Mode string `json:"mode"` // "cloud" o "local"
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Mode != "cloud" && req.Mode != "local" {
		http.Error(w, "mode debe ser 'cloud' o 'local'", http.StatusBadRequest)
		return
	}

	// Obtener configuración actual
	cur := config.Get()
	cur.BrokerMode = req.Mode

	// Guardar configuración actualizada
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	updated, err := a.Store.Save(ctx, cur)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Intentar reconfigurar la placa automáticamente
	go func() {
		time.Sleep(1 * time.Second) // Pequeña espera para que el backend se reconecte
		if err := reconfigurePlacaBroker(updated); err != nil {
			log.Printf("⚠️ No se pudo reconfigurar placa automáticamente: %v", err)
		} else {
			log.Printf("✅ Placa reconfigurada exitosamente al modo: %s", req.Mode)
		}
	}()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"mode":    updated.BrokerMode,
		"message": "Modo cambiado exitosamente",
	})
}

// reconfigurePlacaBroker envía comando HTTP a la placa para reconfigurar su broker MQTT
func reconfigurePlacaBroker(cfg config.Config) error {
	if cfg.Ipplaca == "" {
		return fmt.Errorf("IP de placa no configurada")
	}

	// Obtener broker, usuario y contraseña según el modo
	var brokerURL, user, pass string
	if cfg.BrokerMode == "local" {
		brokerURL = cfg.LocalBroker
		user = cfg.LocalUser
		pass = cfg.LocalPass
	} else {
		brokerURL = cfg.CloudBroker
		user = cfg.CloudUser
		pass = cfg.CloudPass
	}

	// Fallback a configuración legacy si no hay broker configurado
	if brokerURL == "" {
		brokerURL = cfg.Ipbroker
		user = cfg.Usermqtt
		pass = cfg.Passmqtt
	}

	if brokerURL == "" {
		return fmt.Errorf("broker no configurado para modo %s", cfg.BrokerMode)
	}

	// Parsear broker URL para extraer host y puerto
	host, port := parseBrokerURL(brokerURL)
	
	log.Printf("🔧 Reconfigurando placa %s con broker: %s:%s", cfg.Ipplaca, host, port)

	// Intentar configurar usando el endpoint web de la placa Dingtian
	// Formato típico: http://IP/config?mqtt_host=xxx&mqtt_port=xxx&mqtt_user=xxx&mqtt_pass=xxx
	configURL := fmt.Sprintf("http://%s/config?mqtt_host=%s&mqtt_port=%s&mqtt_user=%s&mqtt_pass=%s",
		cfg.Ipplaca,
		url.QueryEscape(host),
		url.QueryEscape(port),
		url.QueryEscape(user),
		url.QueryEscape(pass))

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Get(configURL)
	if err != nil {
		// Si falla HTTP, intentar con endpoint alternativo
		log.Printf("⚠️ Fallo endpoint /config, intentando /api/mqtt")
		return tryAlternativeEndpoint(cfg, host, port, user, pass)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("placa respondió con status %d", resp.StatusCode)
	}

	log.Printf("✅ Comando de configuración enviado exitosamente a placa %s", cfg.Ipplaca)
	return nil
}

// tryAlternativeEndpoint intenta con un endpoint alternativo (POST JSON)
func tryAlternativeEndpoint(cfg config.Config, host, port, user, pass string) error {
	payload := map[string]string{
		"mqtt_host": host,
		"mqtt_port": port,
		"mqtt_user": user,
		"mqtt_pass": pass,
	}

	jsonData, _ := json.Marshal(payload)
	
	endpoints := []string{
		fmt.Sprintf("http://%s/api/mqtt", cfg.Ipplaca),
		fmt.Sprintf("http://%s/api/config", cfg.Ipplaca),
		fmt.Sprintf("http://%s/mqtt", cfg.Ipplaca),
	}

	client := &http.Client{Timeout: 10 * time.Second}

	for _, endpoint := range endpoints {
		resp, err := client.Post(endpoint, "application/json", strings.NewReader(string(jsonData)))
		if err == nil && resp.StatusCode == http.StatusOK {
			resp.Body.Close()
			log.Printf("✅ Configuración enviada via POST a %s", endpoint)
			return nil
		}
		if resp != nil {
			resp.Body.Close()
		}
	}

	return fmt.Errorf("no se pudo conectar a ningún endpoint de configuración de la placa")
}

// parseBrokerURL extrae host y puerto de una URL de broker
func parseBrokerURL(brokerURL string) (host, port string) {
	// Por defecto
	port = "1883"

	// Remover esquema si existe (tcp://, wss://, etc)
	if strings.Contains(brokerURL, "://") {
		parsed, err := url.Parse(brokerURL)
		if err == nil {
			host = parsed.Hostname()
			if parsed.Port() != "" {
				port = parsed.Port()
			}
			// Para WSS, el puerto por defecto es diferente
			if parsed.Scheme == "wss" || parsed.Scheme == "ws" {
				if parsed.Port() == "" {
					port = "8083" // Puerto típico para WSS
				}
			}
			return host, port
		}
	}

	// Formato simple: host:port
	parts := strings.Split(brokerURL, ":")
	host = parts[0]
	if len(parts) > 1 {
		port = parts[1]
	}

	return host, port
}

