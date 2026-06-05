package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestRequireBlocksWithoutSession(t *testing.T) {
	m := newTestManager(t)

	called := false
	protected := m.Require(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	}))

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/mqtt/action", nil)
	protected.ServeHTTP(rec, req)

	if called {
		t.Error("el handler protegido NO debe ejecutarse sin sesión")
	}
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, se esperaba 401", rec.Code)
	}
}

func TestRequireAllowsWithValidSession(t *testing.T) {
	m := newTestManager(t)
	now := time.Now()

	var seenUser string
	protected := m.Require(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seenUser = UserFromContext(r.Context())
		w.WriteHeader(http.StatusOK)
	}))

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/mqtt/action", nil)
	req.AddCookie(&http.Cookie{Name: CookieName, Value: m.sign("operador", now.Add(time.Hour).Unix())})
	protected.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, se esperaba 200", rec.Code)
	}
	if seenUser != "operador" {
		t.Errorf("UserFromContext = %q, se esperaba %q", seenUser, "operador")
	}
}

func TestRequireBlocksForgedCookie(t *testing.T) {
	m := newTestManager(t)

	protected := m.Require(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/mqtt/action", nil)
	// Cookie en texto plano como la del esquema antiguo: ya no es válida.
	req.AddCookie(&http.Cookie{Name: CookieName, Value: "admin"})
	protected.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, se esperaba 401 para cookie falsificada", rec.Code)
	}
}

func TestUserFromContextEmptyWhenAbsent(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	if u := UserFromContext(req.Context()); u != "" {
		t.Errorf("UserFromContext sin sesión = %q, se esperaba vacío", u)
	}
}
