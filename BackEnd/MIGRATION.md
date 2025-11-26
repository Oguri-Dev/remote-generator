# Migración de Autenticación

## Cambios realizados

### Backend

1. **Contraseñas hasheadas con bcrypt**: Las contraseñas ya no se guardan en texto plano
2. **Nuevo endpoint `/api/auth/check-setup`**: Verifica si necesita configuración inicial
3. **Endpoint de registro mejorado**: Ahora hashea las contraseñas antes de guardarlas
4. **Login actualizado**: Usa bcrypt para comparar contraseñas

### Migración de datos existentes

Si ya tienes usuarios con contraseñas en texto plano, ejecuta el script de migración:

```bash
cd BackEnd
go run scripts/migrate_passwords.go
```

Este script:
- Detecta usuarios con contraseñas en texto plano
- Las convierte a bcrypt hash
- Omite usuarios ya migrados

### Flujo de setup inicial

1. El frontend llama a `/api/auth/check-setup`
2. Si `needsSetup: true`, muestra formulario de registro
3. Si `needsSetup: false`, muestra formulario de login normal

### API

#### GET `/api/auth/check-setup`
Respuesta:
```json
{
  "needsSetup": true,
  "userCount": 0
}
```

#### POST `/api/auth/register`
Body:
```json
{
  "username": "admin",
  "password": "tu_contraseña"
}
```

#### POST `/api/auth/login`
Body:
```json
{
  "username": "admin",
  "password": "tu_contraseña"
}
```

## Próximos pasos en el Frontend

1. Modificar la página de login para verificar `check-setup`
2. Si necesita setup, mostrar formulario de "Crear primer usuario"
3. Después del setup inicial, redirigir al login normal
