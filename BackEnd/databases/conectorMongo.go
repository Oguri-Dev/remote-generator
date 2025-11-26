package databases

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// MongoConnect realiza la conexión a la base de datos MongoDB.
func MongoConnect() *mongo.Client {
	// Contexto para controlar el timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Opciones de conexión a MongoDB
	clientOptions := options.Client().ApplyURI("mongodb://localhost:27017/generador")

	// Conexión al cluster de MongoDB
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatal(err)
	}

	// Ping al cluster de MongoDB
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}

	log.Println("Conexión a MongoDB exitosa!")
	return client
}
