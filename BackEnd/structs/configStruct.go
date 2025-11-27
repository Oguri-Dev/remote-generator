package structs

type ConfigGenerador struct {
	Ipplaca  string `bson:"ipplaca"   json:"ipplaca"`
	Idplaca  int    `bson:"idplaca"   json:"idplaca"`
	Ipbroker string `bson:"ipbroker"  json:"ipbroker"`
	Usermqtt string `bson:"usermqtt"  json:"usermqtt"`
	Passmqtt string `bson:"passmqtt"  json:"passmqtt"`
	Topic    string `bson:"topic"     json:"topic"` // tópico de suscripción

	// Mapeo de funciones a IDs de relay de la placa
	RelayGenerador     string `bson:"relay_generador"      json:"relay_generador"`      // Default: "1"
	RelayRackMonitoreo string `bson:"relay_rack_monitoreo" json:"relay_rack_monitoreo"` // Default: "2"
	RelayModulo1       string `bson:"relay_modulo1"        json:"relay_modulo1"`        // Default: "3"
	RelayModulo2       string `bson:"relay_modulo2"        json:"relay_modulo2"`        // Default: "4"
}
