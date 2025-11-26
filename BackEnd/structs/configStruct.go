package structs

type ConfigGenerador struct {
	Ipplaca  string `bson:"ipplaca"   json:"ipplaca"`
	Idplaca  int    `bson:"idplaca"   json:"idplaca"`
	Ipbroker string `bson:"ipbroker"  json:"ipbroker"`
	Usermqtt string `bson:"usermqtt"  json:"usermqtt"`
	Passmqtt string `bson:"passmqtt"  json:"passmqtt"`
	Topic    string `bson:"topic"     json:"topic"` // <— nuevo: tópico de suscripción
}
