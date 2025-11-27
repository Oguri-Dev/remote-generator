package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

// Script para migrar contraseñas de texto plano a bcrypt
// Uso: go run scripts/migrate_passwords.go

func main() {
	// Conectar a MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI("mongodb://localhost:27017"))
	if err != nil {
		log.Fatal("Error conectando a MongoDB:", err)
	}
	defer client.Disconnect(ctx)

	coll := client.Database("generator").Collection("users")

	// Obtener todos los usuarios
	cursor, err := coll.Find(ctx, bson.M{})
	if err != nil {
		log.Fatal("Error obteniendo usuarios:", err)
	}
	defer cursor.Close(ctx)

	migratedCount := 0
	skippedCount := 0

	for cursor.Next(ctx) {
		var user struct {
			Username string `bson:"username"`
			Password string `bson:"password"`
		}

		if err := cursor.Decode(&user); err != nil {
			log.Printf("Error decodificando usuario: %v", err)
			continue
		}

		// Verificar si ya está hasheada (bcrypt hash empieza con $2a$ o $2b$)
		if len(user.Password) >= 4 && user.Password[:3] == "$2a" || user.Password[:3] == "$2b" {
			log.Printf("Usuario '%s' ya tiene contraseña hasheada, omitiendo...", user.Username)
			skippedCount++
			continue
		}

		// Hashear la contraseña actual (asumiendo que está en texto plano)
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("Error hasheando contraseña para '%s': %v", user.Username, err)
			continue
		}

		// Actualizar en la base de datos
		_, err = coll.UpdateOne(
			ctx,
			bson.M{"username": user.Username},
			bson.M{"$set": bson.M{"password": string(hashedPassword)}},
		)
		if err != nil {
			log.Printf("Error actualizando usuario '%s': %v", user.Username, err)
			continue
		}

		log.Printf("✅ Usuario '%s' migrado exitosamente", user.Username)
		migratedCount++
	}

	if err := cursor.Err(); err != nil {
		log.Fatal("Error en cursor:", err)
	}

	fmt.Printf("\n=== Migración completada ===\n")
	fmt.Printf("Usuarios migrados: %d\n", migratedCount)
	fmt.Printf("Usuarios omitidos (ya hasheados): %d\n", skippedCount)
}
