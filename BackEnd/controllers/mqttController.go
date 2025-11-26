package controllers

import (
	"encoding/json"
	"net/http"

	"generador/broker"
)

type Command struct {
	Topic   string          `json:"topic"`
	Payload json.RawMessage `json:"payload"`
}

func PublishHandler(w http.ResponseWriter, r *http.Request) {
	var cmd Command
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if cmd.Topic == "" {
		http.Error(w, "topic requerido", http.StatusBadRequest)
		return
	}
	broker.Publish(cmd.Topic, cmd.Payload)
	w.WriteHeader(http.StatusNoContent)
}
