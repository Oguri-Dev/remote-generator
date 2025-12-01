package controllers

import (
	"context"
	"encoding/json"
	"generador/structs"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// LogActivity registra una actividad en la base de datos
func (a *ConfigAPI) LogActivity(relayID, relayName, action, description, user string) {
	coll := a.Store.DB().Collection("activity_logs")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	log := structs.ActivityLog{
		Timestamp:   time.Now().UTC(),
		RelayID:     relayID,
		RelayName:   relayName,
		Action:      action,
		Description: description,
		User:        user,
	}

	if _, err := coll.InsertOne(ctx, log); err != nil {
		// Solo log el error, no fallar la operación principal
		log := log
		_ = log
	}
}

// GetActivityLogs obtiene el historial de actividades (paginado y ordenado)
func (a *ConfigAPI) GetActivityLogs(w http.ResponseWriter, r *http.Request) {
	coll := a.Store.DB().Collection("activity_logs")
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Opciones: ordenar por timestamp descendente, limitar a 1000 registros
	opts := options.Find().
		SetSort(bson.D{{Key: "timestamp", Value: -1}}).
		SetLimit(1000)

	cursor, err := coll.Find(ctx, bson.M{}, opts)
	if err != nil {
		http.Error(w, "error al obtener registros", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var logs []structs.ActivityLog
	if err := cursor.All(ctx, &logs); err != nil {
		http.Error(w, "error al decodificar registros", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

// ClearActivityLogs elimina todos los registros de actividad
func (a *ConfigAPI) ClearActivityLogs(w http.ResponseWriter, r *http.Request) {
	coll := a.Store.DB().Collection("activity_logs")
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	result, err := coll.DeleteMany(ctx, bson.M{})
	if err != nil {
		http.Error(w, "error al eliminar registros", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"deleted": result.DeletedCount,
		"message": "Registros eliminados correctamente",
	})
}

// GetActivityStats obtiene estadísticas de actividades
func (a *ConfigAPI) GetActivityStats(w http.ResponseWriter, r *http.Request) {
	coll := a.Store.DB().Collection("activity_logs")
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Contar total de registros
	totalCount, err := coll.CountDocuments(ctx, bson.M{})
	if err != nil {
		http.Error(w, "error al contar registros", http.StatusInternalServerError)
		return
	}

	// Contar por tipo de acción
	pipeline := []bson.M{
		{"$group": bson.M{
			"_id":   "$action",
			"count": bson.M{"$sum": 1},
		}},
	}

	cursor, err := coll.Aggregate(ctx, pipeline)
	if err != nil {
		http.Error(w, "error al agregar estadísticas", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var actionCounts []bson.M
	if err := cursor.All(ctx, &actionCounts); err != nil {
		http.Error(w, "error al decodificar estadísticas", http.StatusInternalServerError)
		return
	}

	stats := map[string]interface{}{
		"total":       totalCount,
		"byAction":    actionCounts,
		"lastUpdated": time.Now().UTC(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}
