package ws

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

type Hub struct {
	upgrader websocket.Upgrader
	clients  map[*websocket.Conn]struct{}
	mu       sync.RWMutex

	OnClientMessage func([]byte) // <- NUEVO
}

func NewHub(allowedOrigin string) *Hub {
	return &Hub{
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				if allowedOrigin == "" {
					return true
				}
				// Permite el mismo host o el que le digas (útil en dev)
				origin := r.Header.Get("Origin")
				return origin == allowedOrigin
			},
		},
		clients: make(map[*websocket.Conn]struct{}),
	}
}

func (h *Hub) HandleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("upgrade ws: %v", err)
		return
	}
	h.mu.Lock()
	h.clients[conn] = struct{}{}
	h.mu.Unlock()

	go func() {
		defer func() {
			h.mu.Lock()
			delete(h.clients, conn)
			h.mu.Unlock()
			conn.Close()
		}()
		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				return
			}
			// COMPAT: reenviar hacia backend (como hacía tu wsHandler viejo)
			if h.OnClientMessage != nil {
				h.OnClientMessage(msg)
			}
		}
	}()
}

func (h *Hub) BroadcastText(msg []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for c := range h.clients {
		if err := c.WriteMessage(websocket.TextMessage, msg); err != nil {
			log.Printf("ws write: %v", err)
		}
	}
}
