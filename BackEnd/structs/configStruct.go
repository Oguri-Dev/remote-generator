package structs

// RelayConfig define la configuración de un relay individual
type RelayConfig struct {
	ID          string `bson:"id"           json:"id"`           // "1", "2", etc.
	Name        string `bson:"name"         json:"name"`         // Nombre personalizado: "Generador Principal"
	Type        string `bson:"type"         json:"type"`         // Tipo: "generador", "rack", "modulo", "manual", "disabled"
	Enabled     bool   `bson:"enabled"      json:"enabled"`      // Si está habilitado para mostrar en UI
	InvertState bool   `bson:"invert_state" json:"invert_state"` // Si el cableado está invertido (ON=Apagar, OFF=Encender)
	InputID     string `bson:"input_id"     json:"input_id"`     // ID del input físico que corresponde a este relay ("1"-"8", "" = deshabilitado)
}

type ConfigGenerador struct {
	Ipplaca  string `bson:"ipplaca"   json:"ipplaca"`
	Idplaca  int    `bson:"idplaca"   json:"idplaca"`
	Ipbroker string `bson:"ipbroker"  json:"ipbroker"`
	Usermqtt string `bson:"usermqtt"  json:"usermqtt"`
	Passmqtt string `bson:"passmqtt"  json:"passmqtt"`
	Topic    string `bson:"topic"     json:"topic"` // tópico de suscripción

	// Configuración dinámica de los 8 relays
	Relays []RelayConfig `bson:"relays" json:"relays"`

	// Relay para modo manual (por defecto "8")
	RelayManual string `bson:"relay_manual" json:"relay_manual"`
}

// GetDefaultRelays retorna la configuración por defecto de los 8 relays
func GetDefaultRelays() []RelayConfig {
	return []RelayConfig{
		{ID: "1", Name: "Generador", Type: "generador", Enabled: true, InvertState: false, InputID: "1"},
		{ID: "2", Name: "Rack Monitoreo", Type: "rack", Enabled: true, InvertState: false, InputID: "2"},
		{ID: "3", Name: "Módulo 1", Type: "modulo", Enabled: true, InvertState: false, InputID: "3"},
		{ID: "4", Name: "Módulo 2", Type: "modulo", Enabled: true, InvertState: false, InputID: "4"},
		{ID: "5", Name: "Relay 5", Type: "disabled", Enabled: false, InvertState: false, InputID: ""},
		{ID: "6", Name: "Relay 6", Type: "disabled", Enabled: false, InvertState: false, InputID: ""},
		{ID: "7", Name: "Relay 7", Type: "disabled", Enabled: false, InvertState: false, InputID: ""},
		{ID: "8", Name: "Modo Manual", Type: "manual", Enabled: false, InvertState: false, InputID: "8"},
	}
}
