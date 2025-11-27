package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI("mongodb://localhost:27017"))
	if err != nil {
		log.Fatal("Error conectando a MongoDB:", err)
	}
	defer client.Disconnect(ctx)

	// Listar todas las bases de datos
	databases, err := client.ListDatabaseNames(ctx, bson.M{})
	if err != nil {
		log.Fatal("Error listando bases de datos:", err)
	}

	fmt.Println("=== Bases de datos disponibles ===")
	for _, db := range databases {
		fmt.Printf("- %s\n", db)
	}
	fmt.Println()

	// Ver contenido de la colección config en la base de datos generator
	coll := client.Database("generator").Collection("config")

	cursor, err := coll.Find(ctx, bson.M{})
	if err != nil {
		log.Fatal("Error buscando en config:", err)
	}
	defer cursor.Close(ctx)

	fmt.Println("=== Contenido de generator.config ===")
	var count int
	for cursor.Next(ctx) {
		var doc bson.M
		if err := cursor.Decode(&doc); err != nil {
			log.Printf("Error decodificando documento: %v", err)
			continue
		}

		jsonData, _ := json.MarshalIndent(doc, "", "  ")
		fmt.Println(string(jsonData))
		count++
	}

	if count == 0 {
		fmt.Println("⚠️  La colección está vacía")
	} else {
		fmt.Printf("\nTotal documentos: %d\n", count)
	}
}
