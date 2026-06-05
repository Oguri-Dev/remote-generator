package auth

import (
	"context"
	"net/http"
	"time"
)

type ctxKey string

const userCtxKey ctxKey = "username"

// Require envuelve un handler exigiendo una sesión válida. Si no la hay,
// responde 401 y no llama al handler protegido. El username verificado queda
// disponible en el contexto vía UserFromContext.
func (m *Manager) Require(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		username, err := m.UserFromRequest(r, time.Now())
		if err != nil {
			http.Error(w, "no autorizado", http.StatusUnauthorized)
			return
		}
		ctx := context.WithValue(r.Context(), userCtxKey, username)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireFunc es el equivalente a Require para http.HandlerFunc.
func (m *Manager) RequireFunc(next http.HandlerFunc) http.HandlerFunc {
	h := m.Require(next)
	return h.ServeHTTP
}

// UserFromContext devuelve el username inyectado por Require, o "" si no hay.
func UserFromContext(ctx context.Context) string {
	if v, ok := ctx.Value(userCtxKey).(string); ok {
		return v
	}
	return ""
}
