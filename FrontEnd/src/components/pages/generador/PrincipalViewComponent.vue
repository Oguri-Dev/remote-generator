<template>
  <div class="personal-dashboard personal-dashboard-v3">
    <div class="columns is-variable is-1-mobile is-2-tablet">
      <!-- Columna Izquierda: Estados de Relés -->
      <div class="column is-12-mobile is-12-tablet is-6-desktop">
        <div class="columns is-multiline is-flex-tablet-p is-variable is-1-mobile is-2-tablet">
          <!-- Banner de Modo Manual Activo -->
          <div v-if="isManualMode" class="column is-12">
            <div class="dashboard-card is-welcome" style="background-color: #ff9f43; color: white;">
              <div class="welcome-title">
                <h3 class="dark-inverted" style="color: white;">⚠️ Modo Manual Activo</h3>
                <h2 style="color: white;">El generador fue encendido físicamente. Los controles remotos están
                  bloqueados.</h2>
              </div>
            </div>
          </div>

          <!-- Tarjetas de Estado (Dinámicas) -->
          <div v-for="relay in enabledRelays" :key="relay.id" class="column is-12">
            <div class="dashboard-card is-welcome">
              <div class="welcome-title">
                <h3 class="dark-inverted">Estado Actual {{ relay.name }}</h3>
                <h2 v-if="!isSystemConnected" class="text-warning">Esperando datos...</h2>
                <h2 v-else :class="{
                  'text-success': placaStore.relays[relay.id] === 'ON',
                  'text-warning': placaStore.relays[relay.id] !== 'ON'
                }">
                  Estado actual: {{ placaStore.relays[relay.id] || "Esperando datos..." }}
                </h2>
              </div>
            </div>
          </div>

          <!-- Mensaje cuando no hay relés configurados -->
          <div v-if="enabledRelays.length === 0" class="column is-12">
            <div class="dashboard-card is-welcome">
              <div class="welcome-title">
                <h3 class="dark-inverted">Sin Relés Configurados</h3>
                <h2 class="text-warning">Configure los relés en la sección de Configuración</h2>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna Derecha: Controles -->
      <div class="column is-12-mobile is-12-tablet is-5-desktop">
        <div class="columns is-multiline is-flex-tablet-p">
          <div class="column is-12">
            <div class="stats-wrapper">
              <div class="columns is-multiline is-flex-tablet-p">
                <!-- Estado de la Placa -->
                <div class="column is-12">
                  <div class="dashboard-card is-welcome">
                    <div class="welcome-title">
                      <h2>Estado controladores</h2>
                    </div>
                    <div class="columns">
                      <div class="column is-6">
                        <h2 :class="{
                          'text-success': estadoPlaca === 'Conectada',
                          'text-warning-breathing': estadoPlaca === 'Intentando conexión',
                          'text-danger-breathing': estadoPlaca === 'Desconectada'
                        }">
                          Estado Placa: {{ estadoPlaca }}
                        </h2>
                      </div>
                      <div class="column is-6">
                        <p>IP: {{ placaStore.ip }}</p>
                      </div>
                    </div>
                    <div class="columns">
                      <div class="column is-6">
                        <h2>Serial: {{ placaStore.serialNumber }}</h2>
                      </div>
                      <div class="column is-6">
                        <p>Mac: {{ placaStore.mac }}</p>
                      </div>
                    </div>
                    <div class="columns">
                      <div class="column is-7">
                        <h2 :class="{
                          'text-warning-breathing': estadoBroker === 'Conectando...',
                          'text-success': estadoBroker === 'Conectado'
                        }">
                          Estado Conexion Broker: {{ estadoBroker }}
                        </h2>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- End Estado de la Placa -->
                <!-- Control Generador (Dinámico) -->
                <div v-if="generatorRelays.length > 0" class="column is-12">
                  <div class="dashboard-card is-welcome">
                    <div class="welcome-title">
                      <h2>Control Generador</h2>
                    </div>
                    <div class="columns is-multiline">
                      <div v-for="relay in generatorRelays" :key="relay.id" class="button-wrap column is-6">
                        <VButton type="submit" color="primary" bold raised fullwidth @click="toggleRelay(relay.id)"
                          :disabled="!canToggleGenerator">
                          {{ placaStore.relays[relay.id] === 'ON' ? `Apagar ${relay.name}` : `Encender
                          ${relay.name}` }}
                        </VButton>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- End Control Generador -->
                <!-- Control Equipamiento Monitoreo (Dinámico) -->
                <div v-if="hasEquipmentRelays" class="column is-12">
                  <div class="dashboard-card is-welcome">
                    <div class="welcome-title">
                      <h2>Control Equipamiento Monitoreo</h2>
                    </div>
                    <!-- Botones Rack -->
                    <div v-if="rackRelays.length > 0" class="columns is-multiline">
                      <div v-for="relay in rackRelays" :key="relay.id" class="button-wrap column is-6">
                        <VButton type="submit" color="primary" bold raised fullwidth @click="restartComponent(relay.id)"
                          :disabled="isButtonDisabled(relay.id)">
                          Reiniciar {{ relay.name }}
                        </VButton>
                      </div>
                    </div>
                    <!-- Botones Módulos -->
                    <div v-if="moduleRelays.length > 0" class="columns is-multiline">
                      <div v-for="relay in moduleRelays" :key="relay.id" class="button-wrap column is-6">
                        <VButton type="submit" color="primary" bold raised fullwidth @click="restartComponent(relay.id)"
                          :disabled="isButtonDisabled(relay.id)">
                          Reiniciar {{ relay.name }}
                        </VButton>
                      </div>
                    </div>
                    <!-- Botón Reiniciar Todo -->
                    <div v-if="equipmentRelays.length > 1" class="columns">
                      <div class="button-wrap column is-6">
                        <VButton type="submit" color="primary" bold raised fullwidth @click="restartComponent('all')"
                          :disabled="areButtonsDisabled || areAllEquipmentRestarting">
                          Reiniciar Todo
                        </VButton>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- End Control Equipamiento Monitoreo -->
                <!-- Progreso de sequences -->
                <div class="column is-12">
                  <div class="dashboard-card is-welcome">
                    <div class="welcome-title">
                      <h2>Progreso de Accionamientos</h2>
                    </div>
                    <div class="welcome-progress">
                      <template v-if="activeSequences.length > 0">
                        <div v-for="relayId in activeSequences" :key="relayId" class="progress-item">
                          <div class="progress-row">
                            <p style="font-size: x-large;">
                              <strong>{{ getRelayName(relayId) }}:</strong>
                              {{ mqttStore.sequenceState[relayId] }}...
                              <ProgressSpinner style="width: 30px; height: 25px;" strokeWidth="8" animationDuration="2s"
                                aria-label="Custom ProgressSpinner" />
                            </p>
                          </div>
                        </div>
                      </template>
                      <p v-else class="text-muted">No hay accionamientos en progreso</p>
                    </div>
                  </div>
                </div>
                <!-- End Progreso de sequences -->
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- End Controles -->
    </div>

    <!-- Modal de confirmación para encender/apagar generador -->
    <VModal :open="showGeneratorConfirm" :title="confirmTitle" @close="showGeneratorConfirm = false" actions="center"
      noclosebutton>
      <template #content>
        <div class="has-text-centered" style="padding: 2rem;">
          <h2 style="font-size: 1.8rem; margin-bottom: 1rem;">{{ confirmMessage }}</h2>
        </div>
      </template>
      <template #cancel><span style="display: none;"></span></template>
      <template #action>
        <VButton :color="pendingAction === 'ON' ? 'success' : 'danger'" @click="confirmToggleRelay" bold raised
          style="font-size: 1.2rem; padding: 1rem 2rem;">
          {{ pendingAction === 'ON' ? 'Sí, Encender' : 'Sí, Apagar' }}
        </VButton>
        <VButton color="light" @click="showGeneratorConfirm = false" bold
          style="font-size: 1.2rem; padding: 1rem 2rem;">
          Cancelar
        </VButton>
      </template>
    </VModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useMqttStore } from "/@src/stores/MqttStore";
import { usePlacaStore } from "/@src/stores/PlacaStore";
import { useConfigStore } from "/@src/stores/ConfigStore";
import { sendActionToBackend } from "/@src/services/mqttService";
import ProgressSpinner from 'primevue/progressspinner';

const mqttStore = useMqttStore();
const placaStore = usePlacaStore();
const configStore = useConfigStore();

// Cargar configuración y conectar WebSocket al montar
onMounted(async () => {
  await configStore.loadConfig();
  mqttStore.connectToWebSocket();
});

// ===== Relés por tipo (desde ConfigStore) =====
const enabledRelays = computed(() => configStore.enabledRelays);
const generatorRelays = computed(() => configStore.generadores);
const rackRelays = computed(() => configStore.racks);
const moduleRelays = computed(() => configStore.modulos);

// Relés de equipamiento (rack + módulos)
const equipmentRelays = computed(() => [...rackRelays.value, ...moduleRelays.value]);
const hasEquipmentRelays = computed(() => equipmentRelays.value.length > 0);

// ===== Estado de Conexión =====
const estadoPlaca = computed(() => placaStore.connectionStatus);
const estadoBroker = computed(() => (mqttStore.isConnected ? "Conectado" : "Conectando..."));

// ===== Verificar estados individuales =====
// Relés de tipo "manual" - sensor de modo manual físico
const manualRelays = computed(() => configStore.enabledRelays.filter(r => r.type === 'manual'));
const isManualMode = computed(() =>
  manualRelays.value.some(relay => placaStore.relays[relay.id] === "ON")
);
const isGeneratorOn = computed(() => {
  // Verificar si algún generador está encendido
  // Si no hay generadores configurados, considerar como "encendido" para no bloquear
  if (generatorRelays.value.length === 0) return true;
  return generatorRelays.value.some(relay => placaStore.relays[relay.id] === "ON");
});
const isSystemConnected = computed(() => placaStore.connectionStatus === "Conectada" && mqttStore.isConnected);

// ===== Control de secuencias =====
const isAnySequenceActive = computed(() =>
  Object.values(mqttStore.sequenceState).some(state => state !== "")
);

// Deshabilitar botones de equipamiento si no hay conexión, hay secuencia activa, o está en modo manual
const areButtonsDisabled = computed(() =>
  isAnySequenceActive.value || !isSystemConnected.value || isManualMode.value
);

// Habilitar botón del generador solo si no hay NINGUNA secuencia activa
const canToggleGenerator = computed(() =>
  !isAnySequenceActive.value && isSystemConnected.value && !isManualMode.value
);

const isButtonDisabled = (relayId: string) => {
  // Verificar si hay una secuencia activa para este relay específico
  const sequenceState = mqttStore.sequenceState[relayId];
  const hasActiveSequence = sequenceState !== undefined && sequenceState !== "";
  return hasActiveSequence || areButtonsDisabled.value;
};

// Verificar si todos los equipos están reiniciando
const areAllEquipmentRestarting = computed(() => {
  return equipmentRelays.value.every(relay => mqttStore.sequenceState[relay.id] !== "");
});

// ===== Modal de confirmación del generador =====
const showGeneratorConfirm = ref(false);
const pendingRelayId = ref<string | null>(null);
const pendingAction = ref<string>('');

const confirmTitle = computed(() =>
  pendingAction.value === 'ON' ? '⚡ Confirmar Encendido' : '⚠️ Confirmar Apagado'
);

const confirmMessage = computed(() => {
  const relayName = pendingRelayId.value ? getRelayName(pendingRelayId.value) : 'Generador';
  return pendingAction.value === 'ON'
    ? `¿Estás seguro de ENCENDER ${relayName}?`
    : `¿Estás seguro de APAGAR ${relayName}?`;
});

const confirmDescription = computed(() =>
  pendingAction.value === 'ON'
    ? 'El generador se encenderá de forma remota.'
    : 'El generador se apagará de forma remota. Asegúrate de que no haya cargas críticas conectadas.'
);

// ===== Funciones de control =====
const toggleRelay = (relayId: string) => {
  if (!canToggleGenerator.value) return;
  pendingRelayId.value = relayId;
  pendingAction.value = placaStore.relays[relayId] === "ON" ? "OFF" : "ON";
  showGeneratorConfirm.value = true;
};

const confirmToggleRelay = async () => {
  if (!pendingRelayId.value) return;
  await sendActionToBackend(pendingRelayId.value, pendingAction.value);
  showGeneratorConfirm.value = false;
  pendingRelayId.value = null;
  pendingAction.value = '';
};

const restartComponent = async (component: string) => {
  if (areButtonsDisabled.value) return;
  await sendActionToBackend(component, "restart");
};

// ===== Helper para nombres de relés =====
const getRelayName = (relayId: string): string => {
  return configStore.getRelayName(relayId);
};

// ===== Secuencias activas =====
const activeSequences = computed(() => {
  return Object.keys(mqttStore.sequenceState).filter(relayId => mqttStore.sequenceState[relayId] !== "");
});
</script>


<style lang="scss">
@import '/@src/scss/abstracts/all';

.button-wrap {
  .button {
    min-height: 60px;
    font-size: 1rem;
    font-weight: 500;
    font-family: var(--font-alt);
  }
}

.is-navbar {
  .personal-dashboard {
    margin-top: 30px;
  }
}

.personal-dashboard-v3 {
  margin: 1% 5%;
  padding: 0 1rem;

  .columns {
    &.is-flex-tablet-p {
      .column {
        &.is-6 {
          min-width: 50%;
        }
      }
    }
  }

  .dashboard-card {
    @include vuero-l-card;
    font-family: var(--font);

    &.is-welcome {
      background: var(--widget-grey);
      border: none;
      padding: 30px 40px 30px 40px;

      .welcome-title {
        h3 {
          font-family: var(--font-alt);
          font-weight: 700;
          font-size: 2rem;
          color: var(--dark-text);
        }

        h2 {
          font-family: var(--font-alt);
          font-size: 1.5rem;
          padding-bottom: 10px;
        }
      }
    }
  }

  .stats-wrapper {
    height: auto;
  }
}

.is-dark {
  .personal-dashboard-v3 {
    .dashboard-card {
      @include vuero-card--dark;
    }
  }
}

.is-dark {
  .picker-widget {
    @include vuero-card--dark;

    .current-day {
      color: var(--primary);
    }
  }
}

// ===== Media Queries Responsivas =====

// Pantallas muy pequeñas (móviles < 768px)
@media only screen and (max-width: 767px) {
  .personal-dashboard-v3 {
    margin: 0.5rem 0.5rem;
    padding: 0;

    .columns {
      margin-left: -0.25rem;
      margin-right: -0.25rem;
    }

    .dashboard-card {
      &.is-welcome {
        padding: 20px 15px;

        .welcome-title {
          h3 {
            font-size: 1.3rem;
          }

          h2 {
            font-size: 1rem;
            padding-bottom: 8px;
          }
        }
      }
    }

    .button-wrap {
      .button {
        min-height: 50px;
        font-size: 0.9rem;
        padding: 0.75rem 0.5rem;
      }
    }
  }
}

// Tablets (768px - 1023px)
@media only screen and (min-width: 768px) and (max-width: 1023px) {
  .personal-dashboard-v3 {
    margin: 1% 2%;

    .dashboard-card {
      &.is-welcome {
        padding: 25px 20px;

        .welcome-title {
          h3 {
            font-size: 1.5rem;
          }

          h2 {
            font-size: 1.2rem;
          }
        }
      }
    }

    .button-wrap {
      .button {
        min-height: 55px;
        font-size: 0.95rem;
      }
    }
  }
}

// Pantallas grandes (desktop > 1024px)
@media only screen and (min-width: 1024px) {
  .personal-dashboard-v3 {
    margin: 1% 5%;
  }
}

@keyframes breathing {
  0% {
    color: #28a745;
  }

  50% {
    color: #8bfd8b;
  }

  100% {
    color: #28a745;
  }
}

.text-success {
  font-weight: bold;
  animation: breathing 3.5s infinite ease-in-out;
}

.text-danger {
  color: #dc3545;
  font-weight: bold;
}

@keyframes breathing-yellow {
  0% {
    color: #ffd700;
  }

  50% {
    color: #fd3f3f;
  }

  100% {
    color: #ffd700;
  }
}

.text-warning {
  font-weight: bold;
  animation: breathing-yellow 2s infinite ease-in-out;
}

@keyframes breathing-red {
  0% {
    color: #dc3545;
  }

  50% {
    color: #ff6b6b;
  }

  100% {
    color: #dc3545;
  }
}

.text-danger-breathing {
  font-weight: bold;
  animation: breathing-red 2s infinite ease-in-out;
}

.text-warning-breathing {
  font-weight: bold;
  animation: breathing-yellow 2s infinite ease-in-out;
}
</style>
