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

type client struct {
	conn    *websocket.Conn
	writeMu sync.Mutex
	sendCh  chan []byte
}

type Hub struct {
	upgrader websocket.Upgrader
	clients  map[*client]struct{}
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
		clients: make(map[*client]struct{}),
	}
}

func (h *Hub) HandleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("upgrade ws: %v", err)
		return
	}

	c := &client{
		conn:   conn,
		sendCh: make(chan []byte, 256),
	}

	h.mu.Lock()
	h.clients[c] = struct{}{}
	h.mu.Unlock()

	// Configurar timeouts y pong handler
	conn.SetReadDeadline(time.Now().Add(pongWait))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	// Goroutine para lectura
	go h.readPump(c)

	// Goroutine para escritura (maneja el canal sendCh)
	go h.writePump(c)
}

func (h *Hub) readPump(c *client) {
	defer func() {
		h.mu.Lock()
		delete(h.clients, c)
		h.mu.Unlock()
		c.conn.Close()
	}()

	for {
		_, msg, err := c.conn.ReadMessage()
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

func (h *Hub) writePump(c *client) {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case msg, ok := <-c.sendCh:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Canal cerrado
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (h *Hub) BroadcastText(msg []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for c := range h.clients {
		select {
		case c.sendCh <- msg:
		default:
			// Canal lleno, skip este cliente
			log.Printf("ws client buffer full, skipping message")
		}
	}
}
