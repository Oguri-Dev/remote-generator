package controllers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"golang.org/x/crypto/bcrypt"
)

type authPayload struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// CheckSetup: verifica si existe al menos un usuario
func (a *ConfigAPI) CheckSetup(w http.ResponseWriter, r *http.Request) {
	coll := a.Store.DB().Collection("users")
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	count, err := coll.CountDocuments(ctx, bson.M{})
	if err != nil {
		http.Error(w, "error interno", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"needsSetup": count == 0,
		"userCount":  count,
	})
}

// Register: guarda usuario con contraseña hasheada
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

	// Verificar si ya existe el usuario
	var existing bson.M
	if err := coll.FindOne(ctx, bson.M{"username": p.Username}).Decode(&existing); err == nil {
		http.Error(w, "usuario ya existe", http.StatusConflict)
		return
	}

	// Hash de la contraseña
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(p.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "error al procesar contraseña", http.StatusInternalServerError)
		return
	}

	_, err = coll.InsertOne(ctx, bson.M{
		"username": p.Username,
		"password": string(hashedPassword),
		"created":  time.Now().UTC(),
	})
	if err != nil {
		http.Error(w, "error interno", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("usuario creado"))
}

// Login: compara password hasheada y establece cookie
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

	// Comparar contraseña hasheada
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(p.Password)); err != nil {
		http.Error(w, "credenciales inválidas", http.StatusUnauthorized)
		return
	}

	// Login: cookie de sesión FIRMADA con HMAC (no falsificable por el cliente).
	a.Sessions.SetCookie(w, user.Username, time.Now())
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("login ok"))
}

func (a *ConfigAPI) Logout(w http.ResponseWriter, r *http.Request) {
	a.Sessions.ClearCookie(w)
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusNoContent)
}

func (a *ConfigAPI) Me(w http.ResponseWriter, r *http.Request) {
	username, err := a.Sessions.UserFromRequest(r, time.Now())
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"username": username})
}
