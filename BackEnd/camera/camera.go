// Package camera sincroniza la configuración de la cámara IP (RTSP) con un
// servidor MediaMTX, que reempaqueta el RTSP como HLS para el navegador.
//
// El flujo es: la URL RTSP (con credenciales) vive en Mongo y se edita desde la
// web. Cuando cambia, este paquete usa la API HTTP de runtime de MediaMTX para
// crear/actualizar/borrar un "path" que apunta a ese RTSP. MediaMTX hace pull
// del RTSP bajo demanda y lo publica en /<path>/index.m3u8 (HLS), que el front
// reproduce con hls.js. Así la cámara es 100% configurable por web, sin tocar
// archivos ni reiniciar el gateway.
package camera

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"generador/config"
)

// PathName es el nombre del path en MediaMTX donde se publica la cámara.
// El front reproduce el HLS en http://<host-mediamtx>/<PathName>/index.m3u8
const PathName = "generador"

// Manager habla con la API de runtime de MediaMTX.
type Manager struct {
	apiBase string // p.ej. http://mediamtx:9997
	client  *http.Client
}

// NewManager crea el gestor apuntando a la API de control de MediaMTX.
// Si apiBase está vacío, el manager queda "deshabilitado" (no-op): útil cuando
// no se despliega MediaMTX, para que el resto del sistema funcione igual.
func NewManager(apiBase string) *Manager {
	return &Manager{
		apiBase: strings.TrimRight(apiBase, "/"),
		client:  &http.Client{Timeout: 5 * time.Second},
	}
}

func (m *Manager) enabled() bool { return m.apiBase != "" }

// buildSourceURL inserta las credenciales en la URL RTSP. La cámara Hikvision
// admite credenciales en la URL (rtsp://user:pass@ip:554/...). Si la URL ya
// trae credenciales o no hay usuario, se devuelve tal cual.
func buildSourceURL(rtsp, user, pass string) (string, error) {
	rtsp = strings.TrimSpace(rtsp)
	if rtsp == "" {
		return "", fmt.Errorf("RTSP vacío")
	}
	u, err := url.Parse(rtsp)
	if err != nil {
		return "", fmt.Errorf("RTSP inválido: %w", err)
	}
	if user != "" && u.User == nil {
		u.User = url.UserPassword(user, pass)
	}
	return u.String(), nil
}

// Sync aplica la configuración de cámara a MediaMTX de forma idempotente:
//   - si la cámara está habilitada y tiene RTSP -> crea/reemplaza el path.
//   - si está deshabilitada o sin RTSP -> elimina el path (si existía).
//
// Nunca devuelve error fatal hacia el guardado de config: registra y sigue, para
// que un fallo del gateway de vídeo no impida configurar el generador.
func (m *Manager) Sync(c config.Config) {
	if !m.enabled() {
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 6*time.Second)
	defer cancel()

	if !c.CamaraEnabled || strings.TrimSpace(c.CamaraRTSP) == "" {
		if err := m.deletePath(ctx, PathName); err != nil {
			log.Printf("📷 MediaMTX: no se pudo eliminar el path (puede no existir): %v", err)
		} else {
			log.Printf("📷 Cámara deshabilitada; path '%s' eliminado de MediaMTX", PathName)
		}
		return
	}

	source, err := buildSourceURL(c.CamaraRTSP, c.CamaraUser, c.CamaraPass)
	if err != nil {
		log.Printf("📷 MediaMTX: RTSP inválido, no se sincroniza: %v", err)
		return
	}

	if err := m.upsertPath(ctx, PathName, source); err != nil {
		log.Printf("📷 MediaMTX: error sincronizando cámara: %v", err)
		return
	}
	log.Printf("📷 Cámara sincronizada con MediaMTX en path '%s'", PathName)
}

// upsertPath crea o reemplaza un path en MediaMTX de forma idempotente.
// Estrategia delete+add: borra el path si existía (ignorando el resultado) y
// luego lo crea limpio. Así el estado final es determinista sin importar si el
// path existía de un arranque anterior (evita el frágil add→patch con 404/409).
func (m *Manager) upsertPath(ctx context.Context, name, source string) error {
	body, _ := json.Marshal(map[string]any{
		"source":         source,
		"sourceOnDemand": false, // mantener la conexión al RTSP siempre lista (coherente con hlsAlwaysRemux)
		"rtspTransport":  "tcp", // forzar TCP: evita pérdida de paquetes UDP y los tirones de vídeo
	})

	// Borrar lo que hubiera (si no existe, MediaMTX devuelve error que ignoramos).
	_ = m.deletePath(ctx, name)

	addURL := fmt.Sprintf("%s/v3/config/paths/add/%s", m.apiBase, name)
	status, err := m.request(ctx, http.MethodPost, addURL, body)
	if err != nil {
		return err
	}
	if status != http.StatusOK {
		return fmt.Errorf("MediaMTX add devolvió status %d", status)
	}
	return nil
}

func (m *Manager) deletePath(ctx context.Context, name string) error {
	// El endpoint de borrado de MediaMTX solo responde al método DELETE; con
	// POST el router devuelve "404 page not found" y el path queda vivo.
	delURL := fmt.Sprintf("%s/v3/config/paths/delete/%s", m.apiBase, name)
	status, err := m.request(ctx, http.MethodDelete, delURL, nil)
	if err != nil {
		return err
	}
	if status != http.StatusOK {
		return fmt.Errorf("status %d", status)
	}
	return nil
}

func (m *Manager) request(ctx context.Context, method, urlStr string, body []byte) (int, error) {
	req, err := http.NewRequestWithContext(ctx, method, urlStr, bytes.NewReader(body))
	if err != nil {
		return 0, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := m.client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	return resp.StatusCode, nil
}
