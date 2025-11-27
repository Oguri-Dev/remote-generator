# ===== Build Stage =====
FROM golang:1.24-alpine AS builder

# Instalar dependencias de compilación
RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /app

# Copiar módulos y descargar dependencias
COPY go.mod go.sum ./
RUN go mod download

# Copiar código fuente
COPY . .

# Compilar aplicación (binario estático)
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o generador .

# ===== Runtime Stage =====
FROM alpine:latest

# Instalar certificados CA para HTTPS/TLS
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copiar binario desde build stage
COPY --from=builder /app/generador .

# Crear usuario no-root para seguridad
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser && \
    chown -R appuser:appuser /app

USER appuser

# Puerto por defecto (se puede sobrescribir con env)
EXPOSE 8099

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8099/api/auth/check-setup || exit 1

# Ejecutar aplicación
CMD ["./generador"]
