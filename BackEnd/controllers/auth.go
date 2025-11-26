package controllers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
)

type authPayload struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// Register: guarda usuario y contraseña en texto plano (solo para pruebas locales)
func (a *ConfigAPI) Register(w http.ResponseWriter, r *http.Request) {
	var p authPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "payload inválido", http.StatusBadRequest)
		return
	}
	if p.Username == "" || p.Password == "" {
		http.Error(w, "username y password requeridos", http.StatusBadRequest)
		return
	}

	coll := a.Store.DB().Collection("users")
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var existing bson.M
	if err := coll.FindOne(ctx, bson.M{"username": p.Username}).Decode(&existing); err == nil {
		http.Error(w, "usuario ya existe", http.StatusConflict)
		return
	}

	_, err := coll.InsertOne(ctx, bson.M{
		"username": p.Username,
		"password": p.Password, // texto plano intencional
		"created":  time.Now().UTC(),
	})
	if err != nil {
		http.Error(w, "error interno", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("usuario creado"))
}

// Login: compara password en texto plano y establece cookie
func (a *ConfigAPI) Login(w http.ResponseWriter, r *http.Request) {

	var p authPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "payload inválido", http.StatusBadRequest)
		return
	}
	if p.Username == "" || p.Password == "" {
		http.Error(w, "username y password requeridos", http.StatusBadRequest)
		return
	}

	coll := a.Store.DB().Collection("users")
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var user struct {
		Username string `bson:"username"`
		Password string `bson:"password"`
	}

	if err := coll.FindOne(ctx, bson.M{"username": p.Username}).Decode(&user); err != nil {
		http.Error(w, "credenciales inválidas", http.StatusUnauthorized)
		return
	}

	if user.Password != p.Password {
		http.Error(w, "credenciales inválidas", http.StatusUnauthorized)
		return
	}

	// Login: cookie de sesión (sin Expires/MaxAge)
	http.SetCookie(w, &http.Cookie{
		Name:     "username",
		Value:    user.Username,
		Path:     "/", // *** importante ***
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode, // *** coincide con lo que ves en DevTools ***
		// Secure: true,                 // solo si sirves por HTTPS
	})
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("login ok"))

}

func (a *ConfigAPI) Logout(w http.ResponseWriter, r *http.Request) {
	log.Println("Deleting cookies")

	http.SetCookie(w, &http.Cookie{
		Name:     "username",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode, // 👈 Igual que en el login
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
	})

	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusNoContent)
}

func (a *ConfigAPI) Me(w http.ResponseWriter, r *http.Request) {
	c, err := r.Cookie("username")
	if err != nil || c.Value == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"username": c.Value})
}
