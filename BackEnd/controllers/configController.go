package controllers

import (
	"context"
	"encoding/json"
	"net/http"
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

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"mode":    updated.BrokerMode,
		"message": "Modo cambiado exitosamente",
	})
}
