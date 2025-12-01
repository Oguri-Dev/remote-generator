<template>
  <div class="personal-dashboard personal-dashboard-v3">
    <div class="columns">
      <div class="column is-12">
        <div class="dashboard-card">
          <div class="card-head">
            <h3 class="dark-inverted">Historial de Activaciones</h3>
            <div class="button-group">
              <VButton color="info" @click="loadLogs" :loading="isLoading">
                <i class="iconify" data-icon="feather:refresh-cw"></i>
                Actualizar
              </VButton>
              <VButton color="success" @click="exportToPDF" :disabled="filteredLogs.length === 0">
                <i class="iconify" data-icon="feather:download"></i>
                Exportar PDF
              </VButton>
              <VButton color="warning" @click="showClearConfirm = true">
                <i class="iconify" data-icon="feather:trash-2"></i>
                Limpiar Historial
              </VButton>
            </div>
          </div>

          <!-- Filtros de fecha -->
          <div class="filters-row">
            <div class="field">
              <label class="label">Fecha Desde</label>
              <div class="control">
                <input type="datetime-local" class="input" v-model="dateFrom" @change="applyFilters" />
              </div>
            </div>
            <div class="field">
              <label class="label">Fecha Hasta</label>
              <div class="control">
                <input type="datetime-local" class="input" v-model="dateTo" @change="applyFilters" />
              </div>
            </div>
            <div class="field">
              <label class="label">&nbsp;</label>
              <div class="control">
                <VButton @click="clearFilters">
                  <i class="iconify" data-icon="feather:x"></i>
                  Limpiar Filtros
                </VButton>
              </div>
            </div>
          </div>

          <!-- Estadísticas -->
          <div class="stats-row" v-if="stats">
            <div class="stat-box">
              <span class="stat-label">Total de Registros</span>
              <span class="stat-value">{{ stats.total }}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Registros Filtrados</span>
              <span class="stat-value">{{ filteredLogs.length }}</span>
            </div>
            <div class="stat-box" v-for="action in stats.byAction" :key="action._id">
              <span class="stat-label">{{ action._id || 'Sin definir' }}</span>
              <span class="stat-value">{{ action.count }}</span>
            </div>
          </div>

          <!-- Tabla de registros -->
          <div class="table-wrapper">
            <table class="table is-fullwidth is-hoverable">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Dispositivo</th>
                  <th>Acción</th>
                  <th>Descripción</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoading">
                  <td colspan="5" class="has-text-centered">
                    <div class="loader-wrapper">
                      <div class="loader is-loading"></div>
                    </div>
                  </td>
                </tr>
                <tr v-else-if="filteredLogs.length === 0">
                  <td colspan="5" class="has-text-centered">
                    <p class="has-text-grey">No hay registros que coincidan con los filtros</p>
                  </td>
                </tr>
                <tr v-else v-for="log in filteredLogs" :key="log.id">
                  <td>
                    <span class="has-text-weight-semibold">{{ formatDate(log.timestamp) }}</span>
                  </td>
                  <td>
                    <span class="tag" :class="getRelayColor(log.relayId)">
                      {{ log.relayName }}
                    </span>
                  </td>
                  <td>
                    <span class="tag" :class="getActionColor(log.action)">
                      {{ log.action }}
                    </span>
                  </td>
                  <td>{{ log.description }}</td>
                  <td>
                    <span class="has-text-grey-light">{{ log.user || 'Sistema' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de confirmación para limpiar -->
    <VModal :open="showClearConfirm" title="Confirmar Eliminación" @close="showClearConfirm = false" actions="center">
      <template #content>
        <div class="modal-content-wrapper">
          <h3 class="has-text-centered mb-4">¿Estás seguro de eliminar todo el historial?</h3>
          <p class="has-text-centered has-text-grey">Esta acción no se puede deshacer.</p>
        </div>
      </template>
      <template #action>
        <VButton color="danger" @click="clearLogs" :loading="isClearing">Eliminar Todo</VButton>
        <VButton @click="showClearConfirm = false">Cancelar</VButton>
      </template>
    </VModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useNotyf } from '/@src/composable/useNotyf'
import axios from 'axios'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ActivityLog {
  id: string;
  timestamp: string;
  relayId: string;
  relayName: string;
  action: string;
  description: string;
  user?: string;
}

interface ActivityStats {
  total: number;
  byAction: Array<{ _id: string; count: number }>;
}

const notyf = useNotyf();
const logs = ref<ActivityLog[]>([]);
const stats = ref<ActivityStats | null>(null);
const isLoading = ref(false);
const isClearing = ref(false);
const showClearConfirm = ref(false);
const dateFrom = ref('');
const dateTo = ref('');

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8099';

// Computed para filtrar logs por fecha
const filteredLogs = computed(() => {
  if (!dateFrom.value && !dateTo.value) {
    return logs.value;
  }

  return logs.value.filter(log => {
    const logDate = new Date(log.timestamp);
    const from = dateFrom.value ? new Date(dateFrom.value) : null;
    const to = dateTo.value ? new Date(dateTo.value) : null;

    if (from && logDate < from) return false;
    if (to && logDate > to) return false;
    return true;
  });
});

onMounted(() => {
  loadLogs();
  loadStats();
});

const loadLogs = async () => {
  isLoading.value = true;
  try {
    const response = await axios.get(`${API_BASE_URL}/api/activity/logs`);
    logs.value = response.data || [];
  } catch (error) {
    notyf.error('Error al cargar el historial de activaciones');
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

const loadStats = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/activity/stats`);
    stats.value = response.data;
  } catch (error) {
    console.error('Error al cargar estadísticas:', error);
  }
};

const clearLogs = async () => {
  isClearing.value = true;
  try {
    await axios.delete(`${API_BASE_URL}/api/activity/logs`);
    notyf.success('Historial eliminado correctamente');
    showClearConfirm.value = false;
    logs.value = [];
    loadStats();
  } catch (error) {
    notyf.error('Error al eliminar el historial');
    console.error(error);
  } finally {
    isClearing.value = false;
  }
};

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const applyFilters = () => {
  // Los filtros se aplican automáticamente mediante el computed
};

const clearFilters = () => {
  dateFrom.value = '';
  dateTo.value = '';
};

const exportToPDF = () => {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(16);
  doc.text('Historial de Activaciones - Sistema Generador', 14, 20);

  // Información del filtro
  doc.setFontSize(10);
  let yPos = 30;
  if (dateFrom.value || dateTo.value) {
    doc.text('Filtrado por:', 14, yPos);
    yPos += 6;
    if (dateFrom.value) {
      doc.text(`Desde: ${formatDate(dateFrom.value)}`, 14, yPos);
      yPos += 6;
    }
    if (dateTo.value) {
      doc.text(`Hasta: ${formatDate(dateTo.value)}`, 14, yPos);
      yPos += 6;
    }
    yPos += 4;
  }

  // Preparar datos para la tabla
  const tableData = filteredLogs.value.map(log => [
    formatDate(log.timestamp),
    log.relayName,
    log.action,
    log.description,
    log.user || 'Sistema'
  ]);

  // Generar tabla
  autoTable(doc, {
    head: [['Fecha y Hora', 'Dispositivo', 'Acción', 'Descripción', 'Usuario']],
    body: tableData,
    startY: yPos,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 10, right: 14, bottom: 10, left: 14 },
  });

  // Footer con fecha de generación
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Generado el ${new Date().toLocaleString('es-ES')} - Página ${i} de ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  // Descargar PDF
  const fileName = `historial_activaciones_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
  notyf.success('PDF generado correctamente');
};

const getRelayColor = (relayId: string) => {
  const colors: Record<string, string> = {
    '1': 'is-success',
    '2': 'is-info',
    '3': 'is-warning',
    '4': 'is-danger',
  };
  return colors[relayId] || 'is-light';
};

const getActionColor = (action: string) => {
  const colors: Record<string, string> = {
    'ON': 'is-success',
    'OFF': 'is-danger',
    'RESTART': 'is-warning',
    'starting': 'is-info',
    'stopping': 'is-danger',
    'restarting': 'is-warning',
  };
  return colors[action] || 'is-light';
};
</script>

<style lang="scss" scoped>
.dashboard-card {
  background: var(--widget-grey);
  border-radius: 12px;
  padding: 30px;
  font-family: var(--font);

  .card-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h3 {
      font-family: var(--font-alt);
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--dark-text);
    }

    .button-group {
      display: flex;
      gap: 10px;
    }
  }

  .filters-row {
    display: flex;
    gap: 20px;
    margin-bottom: 25px;
    align-items: flex-end;
    flex-wrap: wrap;

    .field {
      flex: 1;
      min-width: 200px;

      .label {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--dark-text);
        margin-bottom: 8px;
      }

      .input {
        background: var(--white);
        border: 1px solid var(--fade-grey-dark-3);
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 0.95rem;
        width: 100%;

        &:focus {
          border-color: var(--primary);
          outline: none;
        }
      }
    }
  }

  .stats-row {
    display: flex;
    gap: 20px;
    margin-bottom: 30px;
    flex-wrap: wrap;

    .stat-box {
      flex: 1;
      min-width: 150px;
      background: var(--white);
      padding: 15px 20px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 5px;

      .stat-label {
        font-size: 0.85rem;
        color: var(--light-text);
        text-transform: uppercase;
        font-weight: 500;
      }

      .stat-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: var(--primary);
      }
    }
  }

  .table-wrapper {
    overflow-x: auto;

    table {
      background: var(--white);
      border-radius: 8px;

      thead {
        tr {
          th {
            color: var(--dark-text);
            font-weight: 600;
            padding: 15px;
            border-bottom: 2px solid var(--fade-grey-dark-3);
          }
        }
      }

      tbody {
        tr {
          td {
            padding: 15px;
            vertical-align: middle;
          }

          &:hover {
            background: var(--fade-grey-light-3);
          }
        }
      }
    }
  }

  .loader-wrapper {
    padding: 40px;
  }
}

.modal-content-wrapper {
  padding: 20px;
}

.is-dark {
  .dashboard-card {
    background: var(--dark-sidebar-light-2);

    .card-head h3 {
      color: var(--dark-dark-text);
    }

    .filters-row .field {
      .label {
        color: var(--dark-dark-text);
      }

      .input {
        background: var(--dark-sidebar-light-6);
        border-color: var(--dark-sidebar-light-12);
        color: var(--dark-dark-text);
      }
    }

    .stats-row .stat-box {
      background: var(--dark-sidebar-light-6);

      .stat-value {
        color: var(--primary-light-12);
      }
    }

    .table-wrapper table {
      background: var(--dark-sidebar-light-6);

      thead tr th {
        color: var(--dark-dark-text);
        border-bottom-color: var(--dark-sidebar-light-12);
      }

      tbody tr:hover {
        background: var(--dark-sidebar-light-10);
      }
    }
  }
}
</style>
