import { defineStore } from "pinia";
import { ref } from "vue";

export const usePlacaStore = defineStore("placaStore", {
  state: () => ({
    relays: {} as Record<string, string>,
    inputs: {} as Record<string, string>,
    ip: "",
    mac: "",
    serialNumber: "",
    relayCount: 0,
    inputCount: 0,
    lastMessageTime: ref(Date.now()), // ⏳ Usa `ref()` para reactividad real
    connectionStatus: ref<"Desconectada" | "Intentando conexión" | "Conectada">("Desconectada"),
  }),

  actions: {
    updatePlacaData(topic: string, message: string) {
      this.lastMessageTime = Date.now(); // 🔄 Actualiza la última actividad 

      // 🔥 Actualizar estado solo si cambió
      if (this.connectionStatus !== "Conectada") {
        this.connectionStatus = "Conectada";
      }

      if (topic.includes("/out/relay")) {
        const parsedMessage = JSON.parse(message);
        const idx = parsedMessage.idx?.toString();
        if (idx) this.relays[idx] = parsedMessage.status;
      } else if (topic.includes("/ip")) {
        this.ip = message;
      } else if (topic.includes("/mac")) {
        this.mac = message;
      } else if (topic.includes("/out/sn")) {
        this.serialNumber = message;
      } else if (topic.includes("/input_cnt")) {
        this.inputCount = parseInt(message) || 0;
      }
    },

    checkConnection() {
      const now = Date.now();
      const timeSinceLastMessage = now - this.lastMessageTime;
      if (timeSinceLastMessage <= 5000) {
        this.connectionStatus = "Conectada"; // ✅ Si hay mensajes recientes, está conectada
      } else if (timeSinceLastMessage > 20000) {
        if (this.connectionStatus !== "Desconectada") {
          this.connectionStatus = "Desconectada"; // 🛑 Más de 20s sin datos 
        }
      } else if (timeSinceLastMessage > 10000) {
        if (this.connectionStatus !== "Intentando conexión") {
          this.connectionStatus = "Intentando conexión"; // 🔄 Entre 10 y 20s sin datos 
        }
      }
    }
  }
});
