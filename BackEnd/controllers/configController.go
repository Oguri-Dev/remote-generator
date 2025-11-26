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
