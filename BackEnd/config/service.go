package config

import (
	"context"
	"errors"
	"fmt"
	"log"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// RelayConfig define la configuración de un relay individual
type RelayConfig struct {
	ID          string `bson:"id"           json:"id"`
	Name        string `bson:"name"         json:"name"`
	Type        string `bson:"type"         json:"type"` // "generador", "rack", "modulo", "manual", "disabled"
	Enabled     bool   `bson:"enabled"      json:"enabled"`
	InvertState bool   `bson:"invert_state" json:"invert_state"` // Si true: invierte ON/OFF para la secuencia
	InputID     string `bson:"input_id"     json:"input_id"`     // ID del input físico que corresponde a este relay
}

type Config struct {
	Ipplaca  string `bson:"ipplaca"  json:"ipplaca"`
	Idplaca  int    `bson:"idplaca"  json:"idplaca"`
	Ipbroker string `bson:"ipbroker" json:"ipbroker"`
	Usermqtt string `bson:"usermqtt" json:"usermqtt"`
	Passmqtt string `bson:"passmqtt" json:"passmqtt"`
	Topic    string `bson:"topic"    json:"topic"`

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

// normalizeRelays garantiza que los relays siempre tengan los campos obligatorios
// y que el flag invert_state se persista correctamente en Mongo.
func normalizeRelays(relays []RelayConfig) []RelayConfig {
	if len(relays) == 0 {
		return GetDefaultRelays()
	}

	out := make([]RelayConfig, len(relays))
	for i, r := range relays {
		if r.ID == "" {
			r.ID = fmt.Sprintf("%d", i+1)
		}
		if r.Type == "" {
			r.Type = "disabled"
		}
		r.Enabled = r.Type != "disabled"
		// Si no tiene InputID configurado, usar el mismo ID del relay por defecto
		if r.InputID == "" && r.Type != "disabled" {
			r.InputID = r.ID
		}
		out[i] = r
	}
	return out
}

type Diff struct {
	BrokerChanged bool
	TopicChanged  bool
	PlacaChanged  bool
}

var (
	mu          sync.RWMutex
	cfg         Config
	subscribers []func(Config, Diff)
)

func Get() Config { mu.RLock(); defer mu.RUnlock(); return cfg }

// GetRelaysByType retorna todos los relays de un tipo específico
func GetRelaysByType(relayType string) []RelayConfig {
	mu.RLock()
	defer mu.RUnlock()
	var result []RelayConfig
	for _, r := range cfg.Relays {
		if r.Type == relayType && r.Enabled {
			result = append(result, r)
		}
	}
	return result
}

// GetEnabledRelays retorna todos los relays habilitados
func GetEnabledRelays() []RelayConfig {
	mu.RLock()
	defer mu.RUnlock()
	var result []RelayConfig
	for _, r := range cfg.Relays {
		if r.Enabled && r.Type != "disabled" {
			result = append(result, r)
		}
	}
	return result
}

// GetRelayByID retorna un relay por su ID
func GetRelayByID(id string) *RelayConfig {
	mu.RLock()
	defer mu.RUnlock()
	for _, r := range cfg.Relays {
		if r.ID == id {
			return &r
		}
	}
	return nil
}

func onChange(fn func(Config, Diff)) { subscribers = append(subscribers, fn) }

func set(newCfg Config) (Diff, Config) {
	mu.Lock()
	defer mu.Unlock()
	old := cfg
	cfg = newCfg
	diff := Diff{
		BrokerChanged: old.Ipbroker != newCfg.Ipbroker || old.Usermqtt != newCfg.Usermqtt || old.Passmqtt != newCfg.Passmqtt,
		TopicChanged:  old.Topic != newCfg.Topic,
		PlacaChanged:  old.Idplaca != newCfg.Idplaca || old.Ipplaca != newCfg.Ipplaca,
	}
	for _, s := range subscribers {
		s(cfg, diff)
	}
	return diff, cfg
}

// ---- Mongo ----

type Store struct {
	client   *mongo.Client
	dbName   string
	collName string
}

func NewStore(ctx context.Context, uri, db, coll string) (*Store, error) {
	cli, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, err
	}
	if err := cli.Ping(ctx, nil); err != nil {
		return nil, err
	}
	return &Store{client: cli, dbName: db, collName: coll}, nil
}

func (s *Store) Load(ctx context.Context) (Config, error) {
	var c Config
	err := s.client.Database(s.dbName).Collection(s.collName).
		FindOne(ctx, bson.M{}).Decode(&c)
	if errors.Is(err, mongo.ErrNoDocuments) {
		// si no existe, creamos una doc por defecto
		c = Config{
			Topic:       "/dingtian/relay8718/out/#",
			Relays:      GetDefaultRelays(),
			RelayManual: "8",
		}
		_, err = s.client.Database(s.dbName).Collection(s.collName).InsertOne(ctx, c)
	}
	// Si no tiene relays configurados, usar defaults
	if len(c.Relays) == 0 {
		c.Relays = GetDefaultRelays()
	}
	c.Relays = normalizeRelays(c.Relays)
	if c.RelayManual == "" {
		c.RelayManual = "8"
	}
	if err != nil {
		return Config{}, err
	}
	set(c)
	return c, nil
}

func (s *Store) Save(ctx context.Context, in Config) (Config, error) {
	// Si no tiene relays, usar defaults
	if len(in.Relays) == 0 {
		in.Relays = GetDefaultRelays()
	}
	in.Relays = normalizeRelays(in.Relays)
	if in.RelayManual == "" {
		in.RelayManual = "8"
	}

	relaysDoc := make([]bson.M, 0, len(in.Relays))
	for _, r := range in.Relays {
		relaysDoc = append(relaysDoc, bson.M{
			"id":           r.ID,
			"name":         r.Name,
			"type":         r.Type,
			"enabled":      r.Enabled,
			"invert_state": r.InvertState,
			"input_id":     r.InputID,
		})
	}

	// 1) Documento normalizado
	doc := bson.M{
		"ipplaca":      in.Ipplaca,
		"idplaca":      in.Idplaca,
		"ipbroker":     in.Ipbroker,
		"usermqtt":     in.Usermqtt,
		"passmqtt":     in.Passmqtt,
		"topic":        in.Topic,
		"relays":       relaysDoc,
		"relay_manual": in.RelayManual,
	}

	// 2) Llaves legacy a eliminar
	legacyUnset := bson.M{
		"IpPlaca":              1,
		"IdPlaca":              1,
		"IpBroker":             1,
		"UserMqtt":             1,
		"PassMqtt":             1,
		"Topic":                1,
		"relay_generador":      1,
		"relay_rack_monitoreo": 1,
		"relay_modulo1":        1,
		"relay_modulo2":        1,
	}

	// 3) Upsert de la única config + limpieza de legacy
	_, err := s.client.Database(s.dbName).Collection(s.collName).
		UpdateOne(
			ctx,
			bson.M{}, // único documento de config
			bson.M{
				"$set":   doc,
				"$unset": legacyUnset,
			},
			options.Update().SetUpsert(true),
		)
	if err != nil {
		return Config{}, err
	}

	// 4) Actualiza cache en memoria y devuelve
	_, out := set(in)
	return out, nil
}

// Helper para que otros paquetes se suscriban a cambios
func SubscribeChanges(fn func(Config, Diff)) { onChange(fn) }

// Arranque con lectura y (opcional) *poll* periódico si quieres
func InitAndPoll(ctx context.Context, store *Store, pollEvery time.Duration) error {
	if _, err := store.Load(ctx); err != nil {
		return err
	}
	if pollEvery <= 0 {
		return nil
	}
	ticker := time.NewTicker(pollEvery)
	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if _, err := store.Load(context.Background()); err != nil {
					log.Printf("config poll error: %v", err)
				}
			}
		}
	}()
	return nil
}

// en type Store { ... } ya definido
func (s *Store) DB() *mongo.Database {
	return s.client.Database(s.dbName)
}

// Close cierra la conexión con MongoDB
func (s *Store) Close(ctx context.Context) error {
	if s.client == nil {
		return nil
	}
	return s.client.Disconnect(ctx)
}
