package crypto

import (
	"strings"
	"testing"
)

const testKey = "clave-de-test-suficientemente-larga"

func newTestCipher(t *testing.T) *Cipher {
	t.Helper()
	c, err := New(testKey)
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	return c
}

func TestNewRejectsWeakKey(t *testing.T) {
	if _, err := New(""); err == nil {
		t.Error("se esperaba error con clave vacía")
	}
	if _, err := New("corta"); err == nil {
		t.Error("se esperaba error con clave < 16 chars")
	}
}

func TestEncryptDecryptRoundtrip(t *testing.T) {
	c := newTestCipher(t)
	plain := "colocolo-secreto-mqtt"

	enc, err := c.Encrypt(plain)
	if err != nil {
		t.Fatalf("Encrypt: %v", err)
	}
	if !IsEncrypted(enc) {
		t.Errorf("el valor cifrado debe llevar prefijo: %q", enc)
	}
	if strings.Contains(enc, plain) {
		t.Error("el texto en claro NO debe aparecer en el valor cifrado")
	}

	dec, err := c.Decrypt(enc)
	if err != nil {
		t.Fatalf("Decrypt: %v", err)
	}
	if dec != plain {
		t.Errorf("roundtrip falló: %q != %q", dec, plain)
	}
}

func TestEncryptEmptyIsEmpty(t *testing.T) {
	c := newTestCipher(t)
	enc, err := c.Encrypt("")
	if err != nil || enc != "" {
		t.Errorf("Encrypt(\"\") = %q, %v; se esperaba \"\", nil", enc, err)
	}
}

func TestEncryptIsIdempotent(t *testing.T) {
	c := newTestCipher(t)
	enc, _ := c.Encrypt("secreto")
	again, err := c.Encrypt(enc) // cifrar algo ya cifrado no debe re-cifrar
	if err != nil {
		t.Fatalf("Encrypt idempotente: %v", err)
	}
	if again != enc {
		t.Errorf("cifrar un valor ya cifrado lo cambió: %q != %q", again, enc)
	}
}

func TestEncryptUsesRandomNonce(t *testing.T) {
	c := newTestCipher(t)
	a, _ := c.Encrypt("mismo-secreto")
	b, _ := c.Encrypt("mismo-secreto")
	if a == b {
		t.Error("dos cifrados del mismo texto no deben coincidir (nonce aleatorio)")
	}
}

func TestDecryptPlaintextPassthrough(t *testing.T) {
	c := newTestCipher(t)
	// Un valor SIN prefijo se considera legado en claro y se devuelve igual.
	legacy := "contraseña-vieja-sin-cifrar"
	dec, err := c.Decrypt(legacy)
	if err != nil {
		t.Fatalf("Decrypt legacy: %v", err)
	}
	if dec != legacy {
		t.Errorf("valor legado en claro debe devolverse igual: %q != %q", dec, legacy)
	}
}

func TestDecryptDetectsTampering(t *testing.T) {
	c := newTestCipher(t)
	enc, _ := c.Encrypt("secreto-importante")

	// Alterar un carácter dentro del payload base64 (tras el prefijo).
	body := strings.TrimPrefix(enc, "enc:v1:")
	var tampered string
	if strings.HasPrefix(body, "A") {
		tampered = "enc:v1:B" + body[1:]
	} else {
		tampered = "enc:v1:A" + body[1:]
	}

	if _, err := c.Decrypt(tampered); err != ErrDecrypt {
		t.Errorf("la manipulación debe dar ErrDecrypt; err = %v", err)
	}
}

func TestDecryptWithWrongKeyFails(t *testing.T) {
	c1 := newTestCipher(t)
	c2, err := New("otra-clave-distinta-pero-larga-igual")
	if err != nil {
		t.Fatal(err)
	}
	enc, _ := c1.Encrypt("secreto")
	if _, err := c2.Decrypt(enc); err != ErrDecrypt {
		t.Errorf("descifrar con otra clave debe fallar; err = %v", err)
	}
}
