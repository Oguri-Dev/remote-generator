<template>
  <div class="personal-dashboard personal-dashboard-v3">
    <div class="columns is-variable is-1-mobile is-2-tablet">
      <!-- Columna Izquierda: Estados de Relés -->
      <div class="column is-12-mobile is-12-tablet is-5-desktop">
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

          <!-- Banner de Parada de Emergencia Activa -->
          <div v-if="emergencyStopActive" class="column is-12">
            <div class="dashboard-card is-welcome" style="background-color: #ff3860; color: white;">
              <div class="welcome-title">
                <h3 class="dark-inverted" style="color: white;">🚨 Parada de Emergencia Activada</h3>
                <h2 style="color: white;">El sistema está bloqueado. Todos los controles están deshabilitados.</h2>
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
                  'text-success': getRelayState(relay.id) === 'Encendido',
                  'text-warning': getRelayState(relay.id) === 'Apagado'
                }">
                  Estado actual: {{ getRelayState(relay.id) || "Esperando datos..." }}
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
      <div class="column is-12-mobile is-12-tablet is-7-desktop">
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
                          {{ isInputOn(relay) ? `Apagar ${relay.name}` : `Encender ${relay.name}` }}
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

    <!-- Modal de Parada de Emergencia -->
    <VModal :open="showEmergencyModal" title="⚠️ Parada de Emergencia" @close="showEmergencyModal = false"
      actions="center">
      <template #content>
        <div class="has-text-centered" style="padding: 2rem;">
          <h2 style="font-size: 1.8rem; margin-bottom: 1rem;">Parada de Emergencia Activada</h2>
        </div>
      </template>
      <template #cancel><span style="display: none;"></span></template>
      <template #action>
        <div class="has-text-centered">
          <p style="margin-bottom: 1rem; font-size: 1.1rem; color: #ff6b6b;">
            Alerta de emergencia. Los controles permanecen bloqueados mientras el input siga activo.
          </p>
          <VButton color="danger" @click="showEmergencyModal = false" bold
            style="font-size: 1.2rem; padding: 1rem 2rem;">
            Entendido
          </VButton>
        </div>
      </template>
    </VModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
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
// Helper: interpreta el estado de un input (LOW = conectado/energizado)
const getInputPowerStatus = (relayConfig?: { input_id?: string }) => {
  if (!relayConfig?.input_id) return null;
  const raw = placaStore.inputs[relayConfig.input_id];
  if (!raw) return null;

  if (raw === 'LOW') return 'Encendido'; // LOW = con conectividad/energía
  if (raw === 'HIGH') return 'Apagado';  // HIGH = sin conectividad/energía
  return raw; // Estado desconocido
};

const isInputOn = (relayConfig?: { input_id?: string }) => {
  return getInputPowerStatus(relayConfig) === 'Encendido';
};

// Prioriza estado del input; si no existe, usa el estado del relay reportado por la placa
const isRelayOn = (relayId: string) => {
  const relayConfig = configStore.config?.relays.find(r => r.id === relayId);
  const inputStatus = getInputPowerStatus(relayConfig);
  if (inputStatus) return inputStatus === 'Encendido';

  const relayState = placaStore.relays[relayId];
  return relayState === 'ON';
};

// Detectar modo manual según configuración
const isManualMode = computed(() => {
  const detectionMode = configStore.config?.manual_mode_detection || 'auto';

  // Sensor físico dedicado siempre prevalece si está configurado y en LOW (activo)
  const manualRelayId = configStore.config?.relay_manual;
  const manualRelay = configStore.config?.relays.find(r => r.id === manualRelayId);
  // Leer directamente el input elegido (si no hay input_id, usar el id como fallback)
  const manualInputId = manualRelay?.input_id || manualRelayId;
  const manualRaw = manualInputId ? placaStore.inputs[manualInputId] : undefined;
  const manualInputActive = manualRaw === 'LOW';

  if (detectionMode === 'input') {
    return manualInputActive; // Encendido = modo manual activo
  }

  // Modo 2: Detección automática por lógica
  // Generador OFF pero componentes siguen encendidos = modo manual

  // Verificar si el generador está apagado (LOW = encendido)
  const isGeneratorRelayOff = generatorRelays.value.every(relay => !isRelayOn(relay.id));

  // Verificar si los componentes tienen energía (inputs LOW = energía)
  const areComponentsPowered = equipmentRelays.value.some(relay => isRelayOn(relay.id));

  // Modo automático: solo lógica (generador OFF y equipos con energía)
  return isGeneratorRelayOff && areComponentsPowered;
});
const isGeneratorOn = computed(() => {
  // Verificar si algún generador está encendido
  // Si no hay generadores configurados, considerar como "encendido" para no bloquear
  if (generatorRelays.value.length === 0) return true;
  return generatorRelays.value.some(relay => isRelayOn(relay.id));
});
const isSystemConnected = computed(() => placaStore.connectionStatus === "Conectada" && mqttStore.isConnected);

const startSequenceDelayMs = computed(() => {
  const seconds = configStore.config?.start_sequence_delay_sec;
  return ((seconds ?? 5) > 0 ? seconds! : 5) * 1000;
});

const stopSequenceDelayMs = computed(() => {
  const seconds = configStore.config?.stop_sequence_delay_sec;
  return ((seconds ?? 5) > 0 ? seconds! : 5) * 1000;
});

const waitMs = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Bandera local para cubrir huecos entre updates MQTT
const startStopInProgress = ref(false);

// ===== Control de secuencias =====
const isAnySequenceActive = computed(() =>
  Object.values(mqttStore.sequenceState).some(state => state !== "")
  || startStopInProgress.value
);

// Deshabilitar botones de equipamiento si no hay conexión, hay secuencia activa, o está en modo manual
const areButtonsDisabled = computed(() =>
  isAnySequenceActive.value || !isSystemConnected.value || isManualMode.value || emergencyStopActive.value
);

// Habilitar botón del generador solo si no hay NINGUNA secuencia activa
const canToggleGenerator = computed(() =>
  !isAnySequenceActive.value && isSystemConnected.value && !isManualMode.value && !emergencyStopActive.value
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

// Modal de emergencia cuando el input configurado está en LOW
const showEmergencyModal = ref(false);

// Estado de parada de emergencia activa
const emergencyStopActive = ref(false);

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
  const relay = configStore.getRelayById(relayId);
  pendingRelayId.value = relayId;
  // Determinar acción basada en el estado real del input
  pendingAction.value = isInputOn(relay) ? "OFF" : "ON";
  showGeneratorConfirm.value = true;
};

const confirmToggleRelay = async () => {
  if (!pendingRelayId.value) return;

  const action = pendingAction.value;
  const relayId = pendingRelayId.value;
  const relayName = getRelayName(pendingRelayId.value);
  const startDelay = startSequenceDelayMs.value;
  const stopDelay = stopSequenceDelayMs.value;

  // Cerrar el modal inmediatamente
  showGeneratorConfirm.value = false;
  pendingRelayId.value = null;
  pendingAction.value = '';

  console.log(`🔄 Iniciando secuencia de ${action === 'ON' ? 'ENCENDIDO' : 'APAGADO'}`);
  startStopInProgress.value = true;

  if (action === 'ON') {
    // Secuencia de encendido: Generadores → Racks → Módulos
    console.log(`⚡ Paso 1: Encendiendo ${relayName}`);
    await sendActionToBackend(relayId, 'ON');

    if (rackRelays.value.length > 0) {
      console.log(`⚡ Paso 2: Encendiendo Racks (${rackRelays.value.length})`);
      for (const relay of rackRelays.value) {
        // Esperar el delay asignado a este rack antes de encenderlo
        const rackDelay = (relay.restart_delay_sec ?? startDelay / 1000) * 1000;
        console.log(`⏳ Esperando ${rackDelay / 1000} segundos antes de encender ${relay.name}...`);
        await waitMs(rackDelay);
        console.log(`⚡ Encendiendo ${relay.name}`);
        await sendActionToBackend(relay.id, 'ON');
      }
    }

    if (moduleRelays.value.length > 0) {
      console.log(`⚡ Paso 3: Encendiendo Módulos (${moduleRelays.value.length})`);
      for (const relay of moduleRelays.value) {
        // Esperar el delay asignado a este módulo antes de encenderlo
        const moduleDelay = (relay.restart_delay_sec ?? startDelay / 1000) * 1000;
        console.log(`⏳ Esperando ${moduleDelay / 1000} segundos antes de encender ${relay.name}...`);
        await waitMs(moduleDelay);
        console.log(`⚡ Encendiendo ${relay.name}`);
        await sendActionToBackend(relay.id, 'ON');
      }
    }

    console.log(`✅ Secuencia de ENCENDIDO completada`);
  } else {
    // Secuencia de apagado: Módulos → Racks → Generadores
    if (moduleRelays.value.length > 0) {
      console.log(`🛑 Paso 1: Apagando Módulos (${moduleRelays.value.length})`);
      for (let i = moduleRelays.value.length - 1; i >= 0; i--) {
        const relay = moduleRelays.value[i];
        console.log(`🛑 Apagando ${relay.name}`);
        await sendActionToBackend(relay.id, 'OFF');

        // Esperar el delay asignado a ESTE módulo antes de apagar el siguiente
        const relayDelay = (relay.restart_delay_sec ?? stopDelay / 1000) * 1000;
        console.log(`⏳ Esperando ${relayDelay / 1000} segundos...`);
        await waitMs(relayDelay);
      }
    }

    if (rackRelays.value.length > 0) {
      console.log(`🛑 Paso 2: Apagando Racks (${rackRelays.value.length})`);
      for (let i = rackRelays.value.length - 1; i >= 0; i--) {
        const relay = rackRelays.value[i];
        console.log(`🛑 Apagando ${relay.name}`);
        await sendActionToBackend(relay.id, 'OFF');

        // Esperar el delay asignado a ESTE rack antes de apagar el siguiente
        const relayDelay = (relay.restart_delay_sec ?? stopDelay / 1000) * 1000;
        console.log(`⏳ Esperando ${relayDelay / 1000} segundos...`);
        await waitMs(relayDelay);
      }
    }

    console.log(`🛑 Paso 3: Apagando ${relayName}`);
    await sendActionToBackend(relayId, 'OFF');

    console.log(`✅ Secuencia de APAGADO completada`);
  }

  startStopInProgress.value = false;
};

const restartComponent = async (component: string) => {
  if (areButtonsDisabled.value) return;

  if (component === 'all') {
    console.log(`🔄 Reiniciando TODO el equipamiento`);
  } else {
    const componentName = getRelayName(component);
    console.log(`🔄 Reiniciando ${componentName}`);
  }

  await sendActionToBackend(component, "restart");
};

// ===== Helper para nombres de relés =====
const getRelayName = (relayId: string): string => {
  return configStore.getRelayName(relayId);
};

// ===== Helper para leer estado desde inputs (prioridad) o relays (fallback) =====
const getRelayState = (relayId: string): string => {
  // Obtener la configuración del relay para saber qué input usar
  const relayConfig = configStore.config?.relays.find(r => r.id === relayId);

  // Si el relay tiene un input_id configurado, leer desde ese input (LOW = Encendido)
  const inputStatus = getInputPowerStatus(relayConfig);
  if (inputStatus) return inputStatus;

  // Fallback: relays (si no hay input configurado o disponible)
  const relayState = placaStore.relays[relayId] || '';
  // Mapear ON/OFF a Encendido/Apagado
  if (relayState === 'ON') return 'Encendido';
  if (relayState === 'OFF') return 'Apagado';
  return relayState;
};

// ===== Secuencias activas =====
const activeSequences = computed(() => {
  return Object.keys(mqttStore.sequenceState).filter(relayId => mqttStore.sequenceState[relayId] !== "");
});

watch(() => placaStore.inputs, (inputs) => {
  const emergencyId = configStore.config?.emergency_input_id;
  if (!emergencyId) return;

  const state = inputs[emergencyId];
  const triggerState = configStore.config?.emergency_input_state || 'LOW';

  // Si el input está en estado de emergencia, activar parada
  if (state === triggerState) {
    emergencyStopActive.value = true;
    showEmergencyModal.value = true;
  } else {
    // Solo permitir cerrar el modal cuando el input vuelva al estado OFF
    emergencyStopActive.value = false;
    showEmergencyModal.value = false;
  }
}, { deep: true, immediate: true });
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

  // Añade separación entre las columnas principales
  >.columns {
    column-gap: 5rem;
    row-gap: 3rem;
  }

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
