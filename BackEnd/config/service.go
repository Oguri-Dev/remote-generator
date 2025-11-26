package config

import (
	"context"
	"errors"
	"log"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Config struct {
	Ipplaca  string `bson:"ipplaca"  json:"ipplaca"`
	Idplaca  int    `bson:"idplaca"  json:"idplaca"`
	Ipbroker string `bson:"ipbroker" json:"ipbroker"`
	Usermqtt string `bson:"usermqtt" json:"usermqtt"`
	Passmqtt string `bson:"passmqtt" json:"passmqtt"`
	Topic    string `bson:"topic"    json:"topic"`
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
		c = Config{Topic: "generador/estado"}
		_, err = s.client.Database(s.dbName).Collection(s.collName).InsertOne(ctx, c)
	}
	if err != nil {
		return Config{}, err
	}
	set(c)
	return c, nil
}

func (s *Store) Save(ctx context.Context, in Config) (Config, error) {
	// 1) Documento normalizado (llaves nuevas en minúscula)
	doc := bson.M{
		"ipplaca":  in.Ipplaca,
		"idplaca":  in.Idplaca,
		"ipbroker": in.Ipbroker,
		"usermqtt": in.Usermqtt,
		"passmqtt": in.Passmqtt,
		"topic":    in.Topic,
	}

	// 2) Llaves legacy a eliminar (las que te aparecieron duplicadas)
	legacyUnset := bson.M{
		"IpPlaca":  1,
		"IdPlaca":  1,
		"IpBroker": 1,
		"UserMqtt": 1,
		"PassMqtt": 1,
		"Topic":    1, // por si quedó con mayúscula
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
