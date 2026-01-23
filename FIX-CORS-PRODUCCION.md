# 🔧 Arreglando CORS en Producción

## Problema
- ❌ Frontend accede desde `http://10.1.2.16`
- ❌ Backend recibe peticiones pero rechaza por CORS
- ❌ Error 401 en `/api/auth/login`

## Solución

### Paso 1: En la PC de Producción (10.1.2.16)

Abre PowerShell en la carpeta donde está `docker-compose.yml` y ejecuta:

```powershell
# Crear/Actualizar .env.docker con la IP correcta
@"
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=TuPasswordSeguro123!

FRONTEND_ORIGIN=http://10.1.2.16
VITE_API_BASE_URL=http://10.1.2.16:8099
"@ | Out-File -Encoding UTF8 ".env.docker"

# Reiniciar Docker para aplicar cambios
docker-compose down
docker-compose up -d --build
```

### Paso 2: Esperar a que levante (2-3 minutos)

```powershell
docker-compose logs -f
```

Espera a ver:
```
backend  | ✅ Servidor HTTP escuchando en puerto 8099
frontend | ✅ Frontend listo
```

### Paso 3: Probar desde el navegador

1. Abre `http://10.1.2.16` desde cualquier PC en la red
2. Deberías ver el login funcionando
3. **No debería haber errores CORS**

---

## ¿Si sigues sin poder conectarte?

### Verificar que Docker está corriendo:
```powershell
docker ps
# Deberías ver: generador-mongodb, generador-mqtt, generador-backend, generador-frontend
```

### Verificar puertos abiertos:
```powershell
netstat -ano | findstr "80 8099"
# Deberías ver listening en ambos puertos
```

### Ver logs del backend:
```powershell
docker logs generador-backend --tail 50
```

### Ver logs del frontend:
```powershell
docker logs generador-frontend --tail 50
```

---

## Explicación técnica

| Componente | Ubicación | Puerto | Función |
|---|---|---|---|
| **Frontend (Nginx)** | `http://10.1.2.16` | 80 | Sirve la página web |
| **Backend (Go API)** | `http://10.1.2.16:8099` | 8099 | API REST + WebSocket |
| **MongoDB** | Docker network | 27017 | BD (interna) |
| **MQTT** | Docker network | 1883/9001 | Broker MQTT (interna) |

El `FRONTEND_ORIGIN=http://10.1.2.16` le dice al backend: "acepta peticiones que vengan de ese navegador"

El `VITE_API_BASE_URL=http://10.1.2.16:8099` le dice al frontend: "las API están aquí"

---

## Para cambiar la IP en el futuro

Solo edita `.env.docker`:
```env
FRONTEND_ORIGIN=http://10.1.2.100    # Tu nueva IP
VITE_API_BASE_URL=http://10.1.2.100:8099
```

Y reinicia:
```powershell
docker-compose restart
```

No necesitas rebuildear todo, solo cambiar variables de entorno.
