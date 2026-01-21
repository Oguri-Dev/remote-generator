package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"

	"generador/broker"
	"generador/config"
	"generador/controllers"
	"generador/routes"
	"generador/ws"
)

// envConfig almacena las variables del .env con prioridad sobre el sistema
var envConfig map[string]string

func main() {
	// Cargar variables de entorno desde .env con PRIORIDAD sobre variables del sistema
	var err error
	envConfig, err = godotenv.Read()
	if err != nil {
		log.Println("⚠️  No se encontró archivo .env, usando variables de entorno del sistema")
		envConfig = make(map[string]string)
	}

	log.Println("🚀 Iniciando servidor...")
	// --- ENV ---
	mongoURI := envOr("MONGODB_URI", "mongodb://localhost:27017")
	dbName := envOr("MONGODB_DB", "generator")
	collName := envOr("MONGODB_COLL", "config")
	frontend := envOr("FRONTEND_ORIGIN", "http://localhost:3069")
	port := envOr("PORT", "8099")

	log.Printf("📍 Puerto configurado: %s", port)

	// --- Mongo & Config ---
	ctx := context.Background()
	store, err := config.NewStore(ctx, mongoURI, dbName, collName)
	if err != nil {
		log.Fatalf("❌ Error conectando a MongoDB: %v", err)
	}
	if err := config.InitAndPoll(ctx, store, 0); err != nil {
		log.Fatalf("❌ Error inicializando configuración: %v", err)
	}
	log.Println("✅ MongoDB y configuración inicializados")

	// --- WS Hub ---
	hub := ws.NewHub(frontend)
	log.Println("✅ WebSocket Hub creado")

	// ⬅️⬅️ 1) Broadcaster para /mqtt/sequence_state (progresos)
	controllers.SetBroadcaster(hub.BroadcastText)

	// ⬅️⬅️ 2) Mensajes entrantes por WS -> publicar a MQTT con topic dinámico
	hub.OnClientMessage = func(msg []byte) {
		cfg := config.Get()
		topic := cfg.Topic
		if topic == "" {
			topic = "generador/comando" // fallback
		}
		if err := broker.Publish(topic, msg); err != nil {
			log.Printf("❌ Error publicando desde WS: %v", err)
		}
	}

	// --- MQTT -> WS (reenvío con {topic, message})
	broker.SetOnMessage(func(topic string, payload []byte) {
		var msg any
		if err := json.Unmarshal(payload, &msg); err != nil {
			msg = string(payload)
		}
		out := map[string]any{
			"topic":   topic,
			"message": msg,
		}
		b, _ := json.Marshal(out)
		hub.BroadcastText(b)
	})
	log.Println("passed set on message")

	// ⬅️⬅️ 3) (opcional) Estado de conexión MQTT -> WS
	broker.SetOnStatus(func(event string, info map[string]any) {
		out := map[string]any{
			"type":  "mqtt_status",
			"event": event,
			"info":  info,
			"ts":    time.Now().UTC().Format(time.RFC3339),
		}
		b, _ := json.Marshal(out)
		hub.BroadcastText(b)
	})

	// --- MQTT init y hot-reload por cambios de config ---
	broker.InitWithConfig(config.Get())
	config.SubscribeChanges(func(c config.Config, d config.Diff) {
		broker.RestartIfNeeded(c, d)
	})
	log.Println("✅ Cliente MQTT inicializado")

	// --- HTTP ---
	cfgApi := &controllers.ConfigAPI{Store: store}

	// Inyectar ConfigAPI para logging de actividades
	controllers.SetConfigAPI(cfgApi)

	handler := routes.SetupRouter(hub, cfgApi)

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      withCors(handler, frontend),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	// --- Graceful Shutdown ---
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-sigChan
		log.Println("\n🛑 Señal de cierre recibida, apagando servidor...")

		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		// Cerrar servidor HTTP
		if err := srv.Shutdown(shutdownCtx); err != nil {
			log.Printf("Error en HTTP shutdown: %v", err)
		}

		// Desconectar MQTT
		broker.Disconnect()

		// Cerrar MongoDB
		if err := store.Close(shutdownCtx); err != nil {
			log.Printf("Error cerrando MongoDB: %v", err)
		}

		log.Println("✅ Servidor cerrado correctamente")
		os.Exit(0)
	}()

	log.Printf("✅ Servidor HTTP escuchando en puerto %s", port)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("❌ Error en servidor HTTP: %v", err)
	}
}

// envOr busca primero en .env, luego en variables del sistema, luego usa el default
func envOr(k, def string) string {
	// Prioridad 1: archivo .env
	if v, ok := envConfig[k]; ok && v != "" {
		return v
	}
	// Prioridad 2: variables del sistema
	if v := os.Getenv(k); v != "" {
		return v
	}
	// Prioridad 3: valor por defecto
	return def
}

func withCors(next http.Handler, origin string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		allowOrigin := origin
		if allowOrigin == "" {
			allowOrigin = r.Header.Get("Origin") // en dev
		}
		if allowOrigin != "" {
			w.Header().Set("Access-Control-Allow-Origin", allowOrigin)
		}
		w.Header().Set("Access-Control-Allow-Credentials", "true") // <- imprescindible
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
