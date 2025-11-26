package routes

import (
	"net/http"

	"generador/controllers"
	"generador/ws"

	"github.com/gorilla/mux"
)

func SetupRouter(hub *ws.Hub, cfgApi *controllers.ConfigAPI) http.Handler {
	r := mux.NewRouter()

	// ---------- REST (vía /api) ----------
	api := r.PathPrefix("/api").Subrouter()
	api.HandleFunc("/config", cfgApi.Get).Methods("GET")
	api.HandleFunc("/config", cfgApi.Put).Methods("PUT")
	api.HandleFunc("/publish", controllers.PublishHandler).Methods("POST")

	//user
	api.HandleFunc("/auth/login", cfgApi.Login).Methods("POST")
	api.HandleFunc("/auth/register", cfgApi.Register).Methods("POST")
	api.HandleFunc("/auth/logout", cfgApi.Logout).Methods("POST")
	api.HandleFunc("/auth/me", cfgApi.Me).Methods("GET")

	// Compatibilidad con tu controlador "importante"
	api.HandleFunc("/mqtt/sequence_state", controllers.GetCurrentSequenceState).Methods("GET")
	api.HandleFunc("/mqtt/action", controllers.HandleMqttAction).Methods("POST")

	// ---------- Rutas "legacy" sin /api (compat con front actual) ----------
	r.HandleFunc("/mqtt/sequence_state", controllers.GetCurrentSequenceState).Methods("GET")
	r.HandleFunc("/mqtt/action", controllers.HandleMqttAction).Methods("POST")

	// ---------- WebSocket ----------
	r.HandleFunc("/ws", hub.HandleWS).Methods("GET")

	// ---------- Salud ----------
	r.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ok"))
	})

	return r
}
