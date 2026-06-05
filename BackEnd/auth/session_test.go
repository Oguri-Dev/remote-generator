package auth

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

const testSecret = "0123456789abcdef-secreto-de-test"

func newTestManager(t *testing.T) *Manager {
	t.Helper()
	m, err := NewManager(testSecret, time.Hour, false)
	if err != nil {
		t.Fatalf("NewManager: %v", err)
	}
	return m
}

func TestNewManagerRejectsWeakSecret(t *testing.T) {
	if _, err := NewManager("", time.Hour, false); err == nil {
		t.Error("se esperaba error con secreto vacío")
	}
	if _, err := NewManager("corto", time.Hour, false); err == nil {
		t.Error("se esperaba error con secreto < 16 chars")
	}
}

func TestSignAndVerifyRoundtrip(t *testing.T) {
	m := newTestManager(t)
	now := time.Unix(1_700_000_000, 0)

	token := m.sign("alice", now.Add(time.Hour).Unix())
	user, err := m.Verify(token, now)
	if err != nil {
		t.Fatalf("Verify devolvió error: %v", err)
	}
	if user != "alice" {
		t.Errorf("user = %q, se esperaba %q", user, "alice")
	}
}

func TestVerifyRejectsTamperedSignature(t *testing.T) {
	m := newTestManager(t)
	now := time.Unix(1_700_000_000, 0)
	token := m.sign("alice", now.Add(time.Hour).Unix())

	// Alterar el último carácter de la firma.
	tampered := token[:len(token)-1]
	if strings.HasSuffix(token, "A") {
		tampered += "B"
	} else {
		tampered += "A"
	}

	if _, err := m.Verify(tampered, now); err != ErrInvalidSession {
		t.Errorf("err = %v, se esperaba ErrInvalidSession", err)
	}
}

func TestVerifyRejectsForgedUser(t *testing.T) {
	m := newTestManager(t)
	now := time.Unix(1_700_000_000, 0)

	// Un atacante intenta inyectar otro usuario reusando el payload pero sin
	// poder recalcular el HMAC: tomamos un token válido de "bob" y cambiamos el
	// usuario codificado. La firma deja de cuadrar.
	valid := m.sign("bob", now.Add(time.Hour).Unix())
	parts := strings.Split(valid, ".")
	// Reemplazar el username codificado por el de "admin" (base64url sin padding).
	forged := "YWRtaW4" + "." + parts[1] + "." + parts[2]

	if _, err := m.Verify(forged, now); err != ErrInvalidSession {
		t.Errorf("err = %v, se esperaba ErrInvalidSession para usuario falsificado", err)
	}
}

func TestVerifyRejectsExpired(t *testing.T) {
	m := newTestManager(t)
	issued := time.Unix(1_700_000_000, 0)
	token := m.sign("alice", issued.Add(time.Hour).Unix())

	// "Ahora" es 2 horas después de la emisión: ya expiró.
	later := issued.Add(2 * time.Hour)
	if _, err := m.Verify(token, later); err != ErrExpiredSession {
		t.Errorf("err = %v, se esperaba ErrExpiredSession", err)
	}
}

func TestVerifyRejectsMalformed(t *testing.T) {
	m := newTestManager(t)
	now := time.Unix(1_700_000_000, 0)

	cases := map[string]string{
		"vacío":            "",
		"sin separadores":  "soloalgo",
		"dos partes":       "a.b",
		"cuatro partes":    "a.b.c.d",
		"exp no numérica":  "YWxpY2U.xx.zzz",
	}
	for name, tok := range cases {
		t.Run(name, func(t *testing.T) {
			if _, err := m.Verify(tok, now); err == nil {
				t.Errorf("Verify(%q) no devolvió error", tok)
			}
		})
	}
}

func TestDifferentSecretsDoNotValidate(t *testing.T) {
	m1 := newTestManager(t)
	m2, err := NewManager("otro-secreto-distinto-1234567", time.Hour, false)
	if err != nil {
		t.Fatal(err)
	}
	now := time.Unix(1_700_000_000, 0)
	token := m1.sign("alice", now.Add(time.Hour).Unix())

	if _, err := m2.Verify(token, now); err != ErrInvalidSession {
		t.Errorf("un token firmado con otro secreto no debe validar; err = %v", err)
	}
}

func TestSetAndClearCookie(t *testing.T) {
	m := newTestManager(t)
	now := time.Unix(1_700_000_000, 0)

	rec := httptest.NewRecorder()
	m.SetCookie(rec, "alice", now)
	res := rec.Result()
	cookies := res.Cookies()
	if len(cookies) != 1 {
		t.Fatalf("se esperaba 1 cookie, hay %d", len(cookies))
	}
	c := cookies[0]
	if c.Name != CookieName {
		t.Errorf("nombre de cookie = %q, se esperaba %q", c.Name, CookieName)
	}
	if !c.HttpOnly {
		t.Error("la cookie de sesión debe ser HttpOnly")
	}

	// La cookie emitida debe verificar como "alice".
	user, err := m.Verify(c.Value, now)
	if err != nil || user != "alice" {
		t.Errorf("la cookie emitida no verifica: user=%q err=%v", user, err)
	}

	// ClearCookie debe emitir una cookie expirada.
	rec2 := httptest.NewRecorder()
	m.ClearCookie(rec2)
	cleared := rec2.Result().Cookies()
	if len(cleared) != 1 || cleared[0].MaxAge >= 0 {
		t.Errorf("ClearCookie no invalidó la cookie: %+v", cleared)
	}
}

func TestUserFromRequest(t *testing.T) {
	m := newTestManager(t)
	now := time.Unix(1_700_000_000, 0)

	// Sin cookie -> ErrNoSession.
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	if _, err := m.UserFromRequest(r, now); err != ErrNoSession {
		t.Errorf("sin cookie: err = %v, se esperaba ErrNoSession", err)
	}

	// Con cookie válida -> usuario.
	r2 := httptest.NewRequest(http.MethodGet, "/", nil)
	r2.AddCookie(&http.Cookie{Name: CookieName, Value: m.sign("alice", now.Add(time.Hour).Unix())})
	user, err := m.UserFromRequest(r2, now)
	if err != nil || user != "alice" {
		t.Errorf("con cookie válida: user=%q err=%v", user, err)
	}
}
