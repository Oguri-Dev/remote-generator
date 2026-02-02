package databases

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// MongoConnect realiza la conexión a la base de datos MongoDB.
func MongoConnect() *mongo.Client {
	// Contexto para controlar el timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Obtener URI de MongoDB desde variable de entorno o usar valor por defecto
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}
	mongoDBName := os.Getenv("MONGODB_DB")
	if mongoDBName == "" {
		mongoDBName = "generator"
	}

	// Agregar la base de datos a la URI si no está incluida
	if mongoURI[len(mongoURI)-1] != '/' {
		mongoURI += "/"
	}
	mongoURI += mongoDBName

	log.Printf("Conectando a MongoDB: %s\n", mongoURI)

	// Opciones de conexión a MongoDB
	clientOptions := options.Client().ApplyURI(mongoURI)

	// Conexión al cluster de MongoDB
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatal(fmt.Sprintf("❌ Error conectando a MongoDB: %v", err))
	}

	// Ping al cluster de MongoDB
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal(fmt.Sprintf("❌ Error verificando conexión MongoDB: %v", err))
	}

	log.Println("✅ Conexión a MongoDB exitosa!")
	return client
}
