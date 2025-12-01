package structs

import "time"

// ActivityLog representa un registro de activación del sistema
type ActivityLog struct {
	ID          string    `json:"id" bson:"_id,omitempty"`
	Timestamp   time.Time `json:"timestamp" bson:"timestamp"`
	RelayID     string    `json:"relayId" bson:"relayId"`
	RelayName   string    `json:"relayName" bson:"relayName"`
	Action      string    `json:"action" bson:"action"` // "ON", "OFF", "restart", "starting", "stopping"
	Description string    `json:"description" bson:"description"`
	User        string    `json:"user,omitempty" bson:"user,omitempty"`
}
