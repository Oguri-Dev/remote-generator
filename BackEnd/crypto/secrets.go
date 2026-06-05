// Package crypto cifra y descifra secretos recuperables (p. ej. contraseñas de
// broker MQTT) que deben almacenarse en reposo pero que el backend necesita en
// claro en tiempo de ejecución.
//
// Usa AES-256-GCM (cifrado autenticado): además de ocultar el contenido,
// detecta manipulación —si el texto cifrado se altera, el descifrado falla en
// lugar de devolver datos corruptos—. Cada valor cifrado lleva un nonce
// aleatorio propio y se serializa como:
//
//	enc:v1:base64std(nonce || ciphertext)
//
// El prefijo permite distinguir valores cifrados de valores en claro heredados
// (los que ya existían en Mongo antes de activar el cifrado), de modo que la
// migración es transparente: lo que no tenga prefijo se trata como texto plano.
package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
)

const prefix = "enc:v1:"

// ErrDecrypt indica que un valor con prefijo no pudo descifrarse (clave
// incorrecta o dato manipulado/corrupto).
var ErrDecrypt = errors.New("no se pudo descifrar el secreto")

// Cipher cifra y descifra secretos con una clave maestra fija.
type Cipher struct {
	aead cipher.AEAD
}

// New crea un Cipher a partir de una clave maestra. La clave se normaliza a 32
// bytes con SHA-256, de modo que se admite cualquier cadena suficientemente
// larga (se exige un mínimo razonable para no aceptar claves triviales).
func New(masterKey string) (*Cipher, error) {
	if len(masterKey) < 16 {
		return nil, fmt.Errorf("la clave de cifrado debe tener al menos 16 caracteres (tiene %d)", len(masterKey))
	}
	sum := sha256.Sum256([]byte(masterKey))
	block, err := aes.NewCipher(sum[:])
	if err != nil {
		return nil, err
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	return &Cipher{aead: aead}, nil
}

// IsEncrypted reporta si un valor ya está cifrado (tiene el prefijo).
func IsEncrypted(s string) bool {
	return strings.HasPrefix(s, prefix)
}

// Encrypt cifra un texto en claro y devuelve el valor serializado con prefijo.
// Una cadena vacía se devuelve tal cual (no tiene sentido cifrar "nada", y así
// un campo sin contraseña no genera ruido).
func (c *Cipher) Encrypt(plaintext string) (string, error) {
	if plaintext == "" {
		return "", nil
	}
	if IsEncrypted(plaintext) {
		// Ya está cifrado; no volver a cifrar (idempotente).
		return plaintext, nil
	}
	nonce := make([]byte, c.aead.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}
	sealed := c.aead.Seal(nonce, nonce, []byte(plaintext), nil)
	return prefix + base64.StdEncoding.EncodeToString(sealed), nil
}

// Decrypt descifra un valor. Si el valor NO tiene prefijo se asume que es texto
// plano heredado y se devuelve sin cambios (compatibilidad hacia atrás).
func (c *Cipher) Decrypt(value string) (string, error) {
	if value == "" {
		return "", nil
	}
	if !IsEncrypted(value) {
		return value, nil // valor legado en claro
	}
	raw, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(value, prefix))
	if err != nil {
		return "", ErrDecrypt
	}
	ns := c.aead.NonceSize()
	if len(raw) < ns {
		return "", ErrDecrypt
	}
	nonce, ciphertext := raw[:ns], raw[ns:]
	plaintext, err := c.aead.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", ErrDecrypt
	}
	return string(plaintext), nil
}
