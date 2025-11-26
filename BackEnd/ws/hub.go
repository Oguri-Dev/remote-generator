package ws

import (
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// Tiempo máximo de espera para lectura
	pongWait = 60 * time.Second
	// Intervalo de envío de ping (debe ser menor que pongWait)
	pingPeriod = (pongWait * 9) / 10
	// Timeout de escritura
	writeWait = 10 * time.Second
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

	// Configurar timeouts y pong handler
	conn.SetReadDeadline(time.Now().Add(pongWait))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	// Goroutine para lectura
	go h.readPump(conn)

	// Goroutine para ping periódico
	go h.writePump(conn)
}

func (h *Hub) readPump(conn *websocket.Conn) {
	defer func() {
		h.mu.Lock()
		delete(h.clients, conn)
		h.mu.Unlock()
		conn.Close()
	}()

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("websocket error: %v", err)
			}
			return
		}

		// COMPAT: reenviar hacia backend (como hacía tu wsHandler viejo)
		if h.OnClientMessage != nil {
			h.OnClientMessage(msg)
		}
	}
}

func (h *Hub) writePump(conn *websocket.Conn) {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		conn.Close()
	}()

	for {
		select {
		case <-ticker.C:
			conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (h *Hub) BroadcastText(msg []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for c := range h.clients {
		c.SetWriteDeadline(time.Now().Add(writeWait))
		if err := c.WriteMessage(websocket.TextMessage, msg); err != nil {
			log.Printf("ws write: %v", err)
		}
	}
}
