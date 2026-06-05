// Package auth implementa sesiones firmadas con HMAC-SHA256.
//
// La sesión es una cookie stateless con el formato:
//
//	base64url(username) "." expUnix "." base64url(HMAC-SHA256(username "." expUnix))
//
// El servidor solo confía en la cookie si la firma valida con su secreto, lo
// que impide que un cliente falsifique el usuario (a diferencia de la cookie
// `username` en texto plano que existía antes). El payload no va cifrado, así
// que NO debe contener secretos: solo el nombre de usuario y la expiración.
package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// CookieName es el nombre de la cookie de sesión.
const CookieName = "session"

// DefaultTTL es la duración de una sesión si no se especifica otra cosa.
const DefaultTTL = 12 * time.Hour

var (
	// ErrNoSession indica que no hay cookie de sesión presente.
	ErrNoSession = errors.New("no hay sesión")
	// ErrInvalidSession indica que la cookie existe pero es inválida (firma o formato).
	ErrInvalidSession = errors.New("sesión inválida")
	// ErrExpiredSession indica que la sesión es válida pero ha expirado.
	ErrExpiredSession = errors.New("sesión expirada")
)

// Manager firma y verifica sesiones usando un secreto del servidor.
type Manager struct {
	secret []byte
	ttl    time.Duration
	secure bool // marca Secure en la cookie (HTTPS)
}

// NewManager crea un Manager. El secreto no puede estar vacío: sin un secreto
// fuerte la firma no aporta seguridad. `secure` debe ser true en producción
// (HTTPS) para que la cookie no viaje por HTTP en claro.
func NewManager(secret string, ttl time.Duration, secure bool) (*Manager, error) {
	if len(secret) < 16 {
		return nil, fmt.Errorf("el secreto de sesión debe tener al menos 16 caracteres (tiene %d)", len(secret))
	}
	if ttl <= 0 {
		ttl = DefaultTTL
	}
	return &Manager{secret: []byte(secret), ttl: ttl, secure: secure}, nil
}

// sign devuelve la cookie firmada para un usuario con expiración `exp`.
func (m *Manager) sign(username string, exp int64) string {
	u := base64.RawURLEncoding.EncodeToString([]byte(username))
	payload := u + "." + strconv.FormatInt(exp, 10)
	sig := m.mac(payload)
	return payload + "." + sig
}

func (m *Manager) mac(payload string) string {
	h := hmac.New(sha256.New, m.secret)
	h.Write([]byte(payload))
	return base64.RawURLEncoding.EncodeToString(h.Sum(nil))
}

// Verify valida el token y devuelve el username si la firma es correcta y no
// ha expirado. La comparación de la firma es en tiempo constante. `now` se pasa
// como parámetro para poder testear la expiración de forma determinista.
func (m *Manager) Verify(token string, now time.Time) (string, error) {
	if token == "" {
		return "", ErrNoSession
	}
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return "", ErrInvalidSession
	}
	payload := parts[0] + "." + parts[1]
	expected := m.mac(payload)
	// Comparación en tiempo constante para evitar timing attacks.
	if !hmac.Equal([]byte(expected), []byte(parts[2])) {
		return "", ErrInvalidSession
	}
	exp, err := strconv.ParseInt(parts[1], 10, 64)
	if err != nil {
		return "", ErrInvalidSession
	}
	if now.Unix() > exp {
		return "", ErrExpiredSession
	}
	userBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return "", ErrInvalidSession
	}
	return string(userBytes), nil
}

// SetCookie firma una sesión para `username` y la escribe en la respuesta.
func (m *Manager) SetCookie(w http.ResponseWriter, username string, now time.Time) {
	exp := now.Add(m.ttl)
	http.SetCookie(w, &http.Cookie{
		Name:     CookieName,
		Value:    m.sign(username, exp.Unix()),
		Path:     "/",
		HttpOnly: true,
		Secure:   m.secure,
		SameSite: http.SameSiteLaxMode,
		Expires:  exp,
	})
}

// ClearCookie invalida la cookie de sesión en el cliente.
func (m *Manager) ClearCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     CookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   m.secure,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
	})
}

// UserFromRequest extrae y verifica la sesión de la cookie de la petición.
func (m *Manager) UserFromRequest(r *http.Request, now time.Time) (string, error) {
	c, err := r.Cookie(CookieName)
	if err != nil {
		return "", ErrNoSession
	}
	return m.Verify(c.Value, now)
}
