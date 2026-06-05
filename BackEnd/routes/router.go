package routes

import (
	"net/http"

	"generador/auth"
	"generador/controllers"
	"generador/ws"

	"github.com/gorilla/mux"
)

func SetupRouter(hub *ws.Hub, cfgApi *controllers.ConfigAPI, sessions *auth.Manager) http.Handler {
	r := mux.NewRouter()

	// req protege un handler exigiendo sesión válida.
	req := sessions.RequireFunc

	// ---------- REST (vía /api) ----------
	api := r.PathPrefix("/api").Subrouter()

	// Rutas de configuración y control: TODAS requieren sesión. Estas operaciones
	// encienden/apagan equipamiento eléctrico y modifican la config del broker.
	api.HandleFunc("/config", req(cfgApi.Get)).Methods("GET")
	api.HandleFunc("/config", req(cfgApi.Put)).Methods("PUT")
	api.HandleFunc("/publish", req(controllers.PublishHandler)).Methods("POST")

	// ---------- Auth (públicas: login/register/check-setup; me/logout no necesitan guard) ----------
	api.HandleFunc("/auth/check-setup", cfgApi.CheckSetup).Methods("GET")
	api.HandleFunc("/auth/login", cfgApi.Login).Methods("POST")
	api.HandleFunc("/auth/register", cfgApi.Register).Methods("POST")
	api.HandleFunc("/auth/logout", cfgApi.Logout).Methods("POST")
	api.HandleFunc("/auth/me", cfgApi.Me).Methods("GET")

	// Estado de secuencia (lectura) y acción sobre relés (control).
	api.HandleFunc("/mqtt/sequence_state", req(controllers.GetCurrentSequenceState)).Methods("GET")
	api.HandleFunc("/mqtt/action", req(controllers.HandleMqttAction)).Methods("POST")

	// Activity logs (historial de activaciones).
	api.HandleFunc("/activity/logs", req(cfgApi.GetActivityLogs)).Methods("GET")
	api.HandleFunc("/activity/logs", req(cfgApi.ClearActivityLogs)).Methods("DELETE")
	api.HandleFunc("/activity/stats", req(cfgApi.GetActivityStats)).Methods("GET")

	// ---------- Rutas "legacy" sin /api (compat con front actual) ----------
	r.HandleFunc("/mqtt/sequence_state", req(controllers.GetCurrentSequenceState)).Methods("GET")
	r.HandleFunc("/mqtt/action", req(controllers.HandleMqttAction)).Methods("POST")

	// ---------- WebSocket ----------
	r.HandleFunc("/ws", hub.HandleWS).Methods("GET")

	// ---------- Salud ----------
	r.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ok"))
	})

	return r
}
