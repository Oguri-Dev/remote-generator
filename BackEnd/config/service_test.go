package config

import "testing"

func TestGetDefaultRelaysShape(t *testing.T) {
	relays := GetDefaultRelays()
	if len(relays) != 8 {
		t.Fatalf("se esperaban 8 relays por defecto, hay %d", len(relays))
	}
	if relays[0].Type != "generador" {
		t.Errorf("relay 1 type = %q, se esperaba generador", relays[0].Type)
	}
	if relays[7].Type != "manual" {
		t.Errorf("relay 8 type = %q, se esperaba manual", relays[7].Type)
	}
}

func TestNormalizeRelaysEmptyReturnsDefaults(t *testing.T) {
	out := normalizeRelays(nil)
	if len(out) != 8 {
		t.Fatalf("normalizeRelays(nil) debe devolver los 8 defaults, devolvió %d", len(out))
	}
}

func TestNormalizeRelaysFillsMissingFields(t *testing.T) {
	in := []RelayConfig{
		{ID: "", Type: "rack"},            // ID vacío -> "1"; rack -> delay 5
		{ID: "2", Type: ""},               // type vacío -> disabled
		{ID: "3", Type: "modulo"},         // InputID vacío -> "3"
		{ID: "4", Type: "generador"},      // generador -> delay 0
	}
	out := normalizeRelays(in)

	if out[0].ID != "1" {
		t.Errorf("ID vacío no se rellenó: %q", out[0].ID)
	}
	if out[0].RestartDelaySec != 5 {
		t.Errorf("rack debe tener delay 5, tiene %d", out[0].RestartDelaySec)
	}
	if out[1].Type != "disabled" {
		t.Errorf("type vacío debe ser disabled, es %q", out[1].Type)
	}
	if out[1].Enabled {
		t.Error("un relay disabled no debe quedar Enabled")
	}
	if out[2].InputID != "3" {
		t.Errorf("InputID vacío debe heredar el ID; es %q", out[2].InputID)
	}
	if out[3].RestartDelaySec != 0 {
		t.Errorf("generador debe tener delay 0, tiene %d", out[3].RestartDelaySec)
	}
}

func TestNormalizeRelaysEnabledMatchesType(t *testing.T) {
	in := []RelayConfig{
		{ID: "1", Type: "generador", Enabled: false}, // debe quedar Enabled=true
		{ID: "2", Type: "disabled", Enabled: true},   // debe quedar Enabled=false
	}
	out := normalizeRelays(in)
	if !out[0].Enabled {
		t.Error("un relay con tipo activo debe quedar Enabled")
	}
	if out[1].Enabled {
		t.Error("un relay disabled debe quedar no-Enabled")
	}
}

func TestRedactedHidesSecrets(t *testing.T) {
	c := Config{
		Usermqtt: "test-user",
		Passmqtt: "test-password",
	}
	r := c.Redacted()

	if r.Passmqtt != SecretSentinel {
		t.Errorf("Passmqtt no redactada: %q", r.Passmqtt)
	}
	// Los campos no secretos se conservan.
	if r.Usermqtt != "test-user" {
		t.Errorf("el usuario no debe redactarse: %q", r.Usermqtt)
	}
	// El original NO debe mutarse (Redacted trabaja sobre copia por valor).
	if c.Passmqtt != "test-password" {
		t.Error("Redacted no debe mutar la config original")
	}
}

func TestRedactedKeepsEmptySecretEmpty(t *testing.T) {
	c := Config{Passmqtt: ""}
	if c.Redacted().Passmqtt != "" {
		t.Error("una contraseña vacía no debe convertirse en centinela")
	}
}

func TestSetComputesDiff(t *testing.T) {
	// set() actualiza el cache global y calcula el diff respecto al estado previo.
	set(Config{Ipbroker: "a", Topic: "t1", Idplaca: 1})
	diff, _ := set(Config{Ipbroker: "b", Topic: "t1", Idplaca: 1})

	if !diff.BrokerChanged {
		t.Error("BrokerChanged debe ser true al cambiar Ipbroker")
	}
	if diff.TopicChanged {
		t.Error("TopicChanged debe ser false si el topic no cambió")
	}
	if diff.PlacaChanged {
		t.Error("PlacaChanged debe ser false si la placa no cambió")
	}
}
