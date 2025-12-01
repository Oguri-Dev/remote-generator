<template>
  <div class="personal-dashboard personal-dashboard-v3">
    <div class="columns">
      <div class="column is-6">
        <div class="columns is-multiline is-flex-tablet-p">
          <!-- Estado del Generador -->
          <div class="column is-11">
            <div class="dashboard-card is-welcome">
              <div class="welcome-title">
                <h3 class="dark-inverted">Estado Actual Generador</h3>
                <h2 v-if="!isSystemConnected" class="text-warning">Esperando datos...</h2>
                <h2 v-else-if="isManualMode" class="text-success">Estado actual: Encendido Manualmente</h2>
                <h2 v-else :class="{ 'text-success': isGeneratorOn, 'text-warning': !isGeneratorOn }">
                  Estado actual: {{ isGeneratorOn ? 'ON' : 'OFF' }}
                </h2>
              </div>
            </div>
          </div>

          <!-- Estado Rack Monitoreo -->
          <div class="column is-11">
            <div class="dashboard-card is-welcome">
              <div class="welcome-title">
                <h3 class="dark-inverted">Estado Actual Rack Monitoreo</h3>
                <h2 v-if="!isSystemConnected" class="text-warning">Esperando datos...</h2>
                <h2 v-else-if="isManualMode" class="text-success">Estado actual: Encendido Manualmente</h2>
                <h2 v-else
                  :class="{ 'text-success': placaStore.relays['2'] === 'ON', 'text-warning': placaStore.relays['2'] === 'OFF' }">
                  Estado actual: {{ placaStore.relays["2"] || "Esperando datos..." }}
                </h2>
              </div>
            </div>
          </div>

          <!-- Estado Módulo 1 -->
          <div class="column is-11">
            <div class="dashboard-card is-welcome">
              <div class="welcome-title">
                <h3 class="dark-inverted">Estado Actual Módulo 1</h3>
                <h2 v-if="!isSystemConnected" class="text-warning">Esperando datos...</h2>
                <h2 v-else-if="isManualMode" class="text-success">Estado actual: Encendido Manualmente</h2>
                <h2 v-else
                  :class="{ 'text-success': placaStore.relays['3'] === 'ON', 'text-warning': placaStore.relays['3'] === 'OFF' }">
                  Estado actual: {{ placaStore.relays["3"] || "Esperando datos..." }}
                </h2>
              </div>
            </div>
          </div>

          <!-- Estado Módulo 2 -->
          <div class="column is-11">
            <div class="dashboard-card is-welcome">
              <div class="welcome-title">
                <h3 class="dark-inverted">Estado Actual Módulo 2</h3>
                <h2 v-if="!isSystemConnected" class="text-warning">Esperando datos...</h2>
                <h2 v-else-if="isManualMode" class="text-success">Estado actual: Encendido Manualmente</h2>
                <h2 v-else
                  :class="{ 'text-success': placaStore.relays['4'] === 'ON', 'text-warning': placaStore.relays['4'] === 'OFF' }">
                  Estado actual: {{ placaStore.relays["4"] || "Esperando datos..." }}
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Controles -->
      <div class="column is-5">
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
                <!-- Control Generador -->
                <div class="column is-12">
                  <div class="dashboard-card is-welcome">
                    <div class="welcome-title">
                      <h2>Control Generador</h2>
                    </div>
                    <div class="columns">
                      <div class="button-wrap column is-6">
                        <!-- Botón de Encender/Apagar Generador -->
                        <VButton type="submit" color="primary" bold raised fullwidth @click="toggleRelay('1')"
                          :disabled="!canToggleGenerator">
                          {{ placaStore.relays['1'] === 'ON' ? 'Apagar Generador' : 'Encender Generador' }}
                        </VButton>
                      </div>
                    </div>
                  </div>
                </div>
                <!--End Control Generador -->
                <!-- Control Equipamiento Monitoreo -->
                <div class="column is-12">
                  <div class="dashboard-card is-welcome">
                    <div class="welcome-title">
                      <h2>Control Equipamiento Monitoreo</h2>
                    </div>
                    <div class="columns">
                      <div class="button-wrap column is-6">
                        <VButton type="submit" color="primary" bold raised fullwidth @click="restartComponent('2')"
                          :disabled="isButtonDisabled('2')">
                          Reiniciar Rack Monitoreo
                        </VButton>
                      </div>
                      <div class="button-wrap column is-6">
                        <VButton type="submit" color="primary" bold raised fullwidth @click="restartComponent('3')"
                          :disabled="isButtonDisabled('3')">
                          Reiniciar Módulo 1
                        </VButton>
                      </div>
                    </div>
                    <div class="columns">
                      <div class="button-wrap column is-6">
                        <VButton type="submit" color="primary" bold raised fullwidth @click="restartComponent('all')"
                          :disabled="areButtonsDisabled || areAllModulesRestarting">
                          Reiniciar Todo
                        </VButton>
                      </div>
                      <div class="button-wrap column is-6">
                        <VButton type="submit" color="primary" bold raised fullwidth @click="restartComponent('4')"
                          :disabled="isButtonDisabled('4')">
                          Reiniciar Módulo 2
                        </VButton>
                      </div>
                    </div>
                  </div>
                </div>
                <!--End Control Equipamiento Monitoreo -->
                <!-- Progreso de sequences -->
                <div class="column is-12">
                  <div class="dashboard-card is-welcome">
                    <div class="welcome-title">
                      <h2>Progreso de Accionamientos</h2>
                    </div>
                    <div class="welcome-progress">
                      <template v-if="activeSequences.length > 0">
                        <div v-for="(relayId) in activeSequences" :key="relayId" class="progress-item">
                          <div class="progress-row">
                            <p style="font-size: x-large; "><strong>{{
                              relayNames[relayId]
                                }}:</strong> {{
                                  mqttStore.sequenceState[relayId] }}...
                              <ProgressSpinner style=" width: 30px; height: 25px;" strokeWidth="8"
                                animationDuration="2s" aria-label="Custom ProgressSpinner" />
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useMqttStore } from "/@src/stores/MqttStore";
import { usePlacaStore } from "/@src/stores/PlacaStore";
import { sendActionToBackend } from "/@src/services/mqttService";
import ProgressSpinner from 'primevue/progressspinner';

const mqttStore = useMqttStore();
const placaStore = usePlacaStore();

// Conectar WebSocket al montar
onMounted(() => {
  mqttStore.connectToWebSocket();
});

//Estado de la Placa y del Broker
const estadoPlaca = computed(() => placaStore.connectionStatus);
const estadoBroker = computed(() => (mqttStore.isConnected ? "Conectado" : "Conectando..."));

//  Verificar estados individuales
const isManualMode = computed(() => placaStore.relays["8"] === "ON");
const isGeneratorOn = computed(() => placaStore.relays["1"] === "ON");
const isSystemConnected = computed(() => placaStore.connectionStatus === "Conectada" && mqttStore.isConnected);

//  Verificar si el generador está ejecutando una secuencia
const isSequenceRunning = computed(() =>
  mqttStore.sequenceState["1"] === "starting" || mqttStore.sequenceState["1"] === "stopping"
);

// Verificar si hay CUALQUIER secuencia activa (módulos o generador)
const isAnySequenceActive = computed(() =>
  Object.values(mqttStore.sequenceState).some(state => state !== "")
);

// Deshabilitar TODOS los botones si hay cualquier secuencia activa
const areButtonsDisabled = computed(() =>
  isAnySequenceActive.value || !isSystemConnected.value || !isGeneratorOn.value || !estadoPlaca.value
);

// Habilitar botón del generador solo si no hay NINGUNA secuencia activa
const canToggleGenerator = computed(() =>
  !isAnySequenceActive.value && isSystemConnected.value && !isManualMode.value
);

const isButtonDisabled = (relayId: string) => {
  return mqttStore.sequenceState[relayId] !== "" || areButtonsDisabled.value;
};

// Función para encender/apagar el Generador
const toggleRelay = async (relayId: string) => {
  if (!canToggleGenerator.value) return;
  const newState = placaStore.relays[relayId] === "ON" ? "OFF" : "ON";
  await sendActionToBackend(relayId, newState);
};

// Función para reiniciar módulos
const restartComponent = async (component: string) => {
  if (areButtonsDisabled.value) return;
  await sendActionToBackend(component, "restart");
};

const areAllModulesRestarting = computed(() => {
  return ["2", "3", "4"].every((relayId) => mqttStore.sequenceState[relayId] !== "");
});
// Mapeo de nombres de los dispositivos según el relé
const relayNames: Record<string, string> = {
  "1": "Generador",
  "2": "Rack de Monitoreo",
  "3": "Módulo 1",
  "4": "Módulo 2",
};

// Computed Property para obtener solo los relés con secuencias activas
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

.personal-dashboard-v3 {
  margin: 1% 5%;
}

@media only screen and (width <=767px) {
  .personal-dashboard-v3 {
    .stats-wrapper {
      height: auto;
    }
  }
}

@keyframes breathing {
  0% {
    color: #28a745;
  }

  /* Verde fuerte */
  50% {
    color: #8bfd8b;
  }

  /* Verde más claro */
  100% {
    color: #28a745;
  }

  /* Regresa al verde fuerte */
}

.text-success {
  font-weight: bold;
  animation: breathing 3.5s infinite ease-in-out;
  /* Aplica animación */
}

.text-danger {
  color: #dc3545;
  /* Rojo fijo para OFF */
  font-weight: bold;
}

@keyframes breathing-yellow {
  0% {
    color: #ffd700;
  }

  /* Amarillo fuerte */
  50% {
    color: #fd3f3f;
  }

  /* Amarillo eléctrico */
  100% {
    color: #ffd700;
  }

  /* Regresa al amarillo fuerte */
}

.text-warning {
  font-weight: bold;
  animation: breathing-yellow 2s infinite ease-in-out;
  /* Animación amarilla para Conectando */
}

@keyframes breathing-red {
  0% {
    color: #dc3545;
  }

  /* Rojo fuerte */
  50% {
    color: #ff6b6b;
  }

  /* Rojo más claro */
  100% {
    color: #dc3545;
  }

  /* Regresa al rojo fuerte */
}

.text-danger-breathing {
  font-weight: bold;
  animation: breathing-red 2s infinite ease-in-out;
  /* Animación roja para Desconectada */
}

.text-warning-breathing {
  font-weight: bold;
  animation: breathing-yellow 2s infinite ease-in-out;
  /* Animación amarilla para Intentando conexión */
}
</style>