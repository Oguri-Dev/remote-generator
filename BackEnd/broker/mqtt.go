package broker

import (
	"fmt"
	"log"
	"net/url"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"generador/config"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

var (
	mu     sync.Mutex
	client mqtt.Client
	curCfg config.Config

	onMsg    func(topic string, payload []byte)
	onStatus func(event string, info map[string]any) // eventos opcionales hacia el front

	retryCount uint64
	retryEvery = 2 * time.Second

	// control del watchdog
	watchStop chan struct{}
	watchMu   sync.Mutex
)

func SetOnMessage(cb func(string, []byte))                   { onMsg = cb }
func SetOnStatus(cb func(event string, info map[string]any)) { onStatus = cb }

// Acepta "10.0.0.5", "10.0.0.5:1883" o "tcp://10.0.0.5:1883"
// Retorna error si la URL es inválida
func brokerURL(h string) (string, error) {
	h = strings.TrimSpace(h)
	if h == "" {
		return "", fmt.Errorf("broker vacío")
	}

	// Si ya tiene scheme, validar
	if strings.Contains(h, "://") {
		u, err := url.Parse(h)
		if err != nil {
			return "", fmt.Errorf("URL inválida: %w", err)
		}
		return u.String(), nil
	}

	// Agregar puerto por defecto si falta
	if !strings.Contains(h, ":") {
		h += ":1883"
	}
	return "tcp://" + h, nil
}

func curBrokerURL() string {
	mu.Lock()
	defer mu.Unlock()
	brokerStr, _ := brokerURL(curCfg.Ipbroker)
	return brokerStr
}

// Watchdog: registra reintentos periódicos aunque Paho no dispare OnReconnecting
func startWatchdog(local mqtt.Client) {
	watchMu.Lock()
	if watchStop != nil {
		close(watchStop)
	}
	stop := make(chan struct{})
	watchStop = stop
	watchMu.Unlock()

	go func(cl mqtt.Client, stopCh <-chan struct{}) {
		t := time.NewTicker(retryEvery)
		defer t.Stop()
		var n uint64
		for {
			select {
			case <-stopCh:
				return
			case <-t.C:
				if cl == nil {
					continue
				}
				if !cl.IsConnected() {
					n++
					log.Printf("↻ MQTT reintento (watchdog) #%d hacia %s", n, curBrokerURL())
					if onStatus != nil {
						onStatus("reconnecting", map[string]any{
							"attempt":        n,
							"retry_interval": retryEvery.Milliseconds(),
							"broker":         curBrokerURL(),
						})
					}
				} else if n > 0 {
					log.Printf("✅ MQTT reconectado después de %d reintentos", n)
					if onStatus != nil {
						onStatus("reconnected", map[string]any{"attempts": n})
					}
					n = 0
				}
			}
		}
	}(local, stop)
}

func stopWatchdog() {
	watchMu.Lock()
	if watchStop != nil {
		close(watchStop)
		watchStop = nil
	}
	watchMu.Unlock()
}

func connect(c config.Config) {
	// fija la config activa
	mu.Lock()
	curCfg = c
	mu.Unlock()

	url, err := brokerURL(c.Ipbroker)
	if err != nil {
		log.Printf("⚠️ MQTT: Error en broker URL: %v", err)
		if onStatus != nil {
			onStatus("invalid_broker", map[string]any{"error": err.Error()})
		}
		return
	}

	atomic.StoreUint64(&retryCount, 0)

	opts := mqtt.NewClientOptions().
		AddBroker(url).
		SetClientID("generador-back-" + time.Now().Format("150405.000")).
		SetUsername(c.Usermqtt).
		SetPassword(c.Passmqtt).
		SetAutoReconnect(true).
		SetConnectRetry(true).
		SetConnectRetryInterval(retryEvery).
		SetConnectTimeout(3 * time.Second).
		SetKeepAlive(30 * time.Second).
		SetPingTimeout(5 * time.Second)

	// Log de reintentos (cuando Paho lo emite)
	opts.OnReconnecting = func(cl mqtt.Client, _ *mqtt.ClientOptions) {
		n := atomic.AddUint64(&retryCount, 1)
		log.Printf("↻ MQTT reintento #%d (cada %s) hacia %s", n, retryEvery, url)
		if onStatus != nil {
			onStatus("reconnecting", map[string]any{
				"attempt":        n,
				"retry_interval": retryEvery.Milliseconds(),
				"broker":         url,
			})
		}
	}

	opts.OnConnect = func(cl mqtt.Client) {
		log.Println("✅ MQTT conectado a", url)
		if onStatus != nil {
			onStatus("connected", map[string]any{"broker": url})
		}
		// suscripción usando la config actual
		mu.Lock()
		cfg := curCfg
		mu.Unlock()
		if cfg.Topic != "" {
			if t := cl.Subscribe(cfg.Topic, 0, handleMessage); t.Wait() && t.Error() != nil {
				log.Printf("❌ Error al suscribir a %s: %v", cfg.Topic, t.Error())
				if onStatus != nil {
					onStatus("subscribe_error", map[string]any{"topic": cfg.Topic, "error": t.Error().Error()})
				}
			} else {
				log.Println("📡 Suscrito a", cfg.Topic)
				if onStatus != nil {
					onStatus("subscribed", map[string]any{"topic": cfg.Topic})
				}
			}
		}
	}

	opts.OnConnectionLost = func(_ mqtt.Client, err error) {
		log.Printf("⚠️ MQTT desconectado: %v", err)
		if onStatus != nil {
			onStatus("connection_lost", map[string]any{"error": err.Error()})
		}
	}

	cl := mqtt.NewClient(opts)
	tok := cl.Connect()

	// No bloquear el arranque del HTTP server
	if !tok.WaitTimeout(4 * time.Second) {
		log.Println("⏳ MQTT: timeout de conexión inicial; reintento en background")
		if onStatus != nil {
			onStatus("connect_timeout", map[string]any{"broker": url})
		}
	} else if err := tok.Error(); err != nil {
		log.Printf("❌ MQTT: error de conexión inicial: %v (se reintentará)", err)
		if onStatus != nil {
			onStatus("connect_error", map[string]any{"broker": url, "error": err.Error()})
		}
	}

	mu.Lock()
	client = cl
	mu.Unlock()

	// inicia/renueva watchdog para este cliente
	startWatchdog(cl)
}

func handleMessage(_ mqtt.Client, msg mqtt.Message) {
	if onMsg != nil {
		onMsg(msg.Topic(), msg.Payload())
	}
}

func Publish(topic string, payload []byte) error {
	mu.Lock()
	cl := client
	mu.Unlock()

	if cl == nil || !cl.IsConnected() {
		err := fmt.Errorf("MQTT no conectado")
		log.Printf("⚠️ Publish: %v", err)
		return err
	}
	
	t := cl.Publish(topic, 0, false, payload)
	t.Wait()
	if err := t.Error(); err != nil {
		log.Printf("❌ Error publish %s: %v", topic, err)
		return fmt.Errorf("publish failed: %w", err)
	}
	
	return nil
}

func stop() {
	mu.Lock()
	cl := client
	mu.Unlock()

	if cl != nil && cl.IsConnected() {
		cl.Disconnect(250)
	}
	// detiene el watchdog del cliente actual
	stopWatchdog()
}

// Disconnect cierra la conexión MQTT (para graceful shutdown)
func Disconnect() {
	log.Println("🛑 Cerrando conexión MQTT...")
	stop()
}

func RestartIfNeeded(newCfg config.Config, diff config.Diff) {
	// decide sin bloquear reconexión
	mu.Lock()
	cur := client
	need := cur == nil || diff.BrokerChanged || diff.TopicChanged
	mu.Unlock()

	if need {
		log.Println("♻️ Reiniciando MQTT por cambio de configuración")
		stop()
		connect(newCfg)
	}
}

func InitWithConfig(c config.Config) {
	connect(c) // no bloquea; el main sigue
}
