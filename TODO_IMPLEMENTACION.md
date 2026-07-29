# Plan de Implementación: Agregar Nombre Completo y Documento al Usuario

## Objetivo
Agregar los campos `full_name` (nombre completo), `id_type` (tipo de documento) e `id_number` (número de documento) a la tabla `users`, conservando el campo `name` como **alias/username** para mostrar en la interfaz.

---

## Información Recopilada

### Estado actual de la tabla `users` (en `init_db.php`)
```sql
users (
    id, name, email, phone, password, role,
    security_question, security_answer,
    notify_email, notify_whatsapp, created_at
)
```

### Cómo se usa `name` actualmente:
- **Registro**: `register-name` → se guarda como `name`
- **Perfil**: `profile-name` → se edita como `name`
- **Login**: se guarda en `$_SESSION['user_name']`
- **Dashboard**: se muestra en `<span id="user-greeting-name">`
- **Header**: aparece la inicial en el avatar
- **localStorage**: se guarda como `currentUser.name`
- **Inscripciones admin**: se muestra como `user_name`
- **Tabla usuarios admin**: se lista como `name`

---

## Plan de Edición

### Paso 1: Base de datos - `backend/init_db.php`
- Agregar columnas `full_name`, `id_type`, `id_number` a la definición de la tabla `users`
- Agregar migración para que los usuarios existentes tengan `full_name = name` (no perder datos)

### Paso 2: Backend registro - `backend/api/register.php`
- Aceptar campos `full_name`, `id_type`, `id_number` del frontend
- Validar que no estén vacíos
- Guardarlos en la base de datos

### Paso 3: Backend perfil - `backend/api/profile-update.php`
- Aceptar campos `full_name`, `id_type`, `id_number` en la actualización
- Actualizar en BD
- Incluir en la respuesta `user`

### Paso 4: Backend obtener usuario - `backend/api/users.php`
- Incluir `full_name`, `id_type`, `id_number` en la consulta `get_current_user`

### Paso 5: Backend lista usuarios admin - `backend/api/usuarios-get.php`
- Incluir `full_name`, `id_type`, `id_number` en el SELECT

### Paso 6: Backend CRUD admin - `backend/api/usuarios.php`
- Incluir `full_name`, `id_type`, `id_number` en `create_user` y `update_user`

### Paso 7: Frontend registro - `views/registro.html`
- Agregar campo "Nombre Completo"
- Agregar campo "Tipo de Documento" (select: CC, NIT, Pasaporte, CE, Otro)
- Agregar campo "Número de Documento"
- El campo "Nombre" actual pasa a ser "Nombre de Usuario / Alias"

### Paso 8: Frontend perfil - `views/user/perfil.html`
- Agregar campo "Nombre Completo" (editable)
- Agregar campo "Tipo de Documento" (select)
- Agregar campo "Número de Documento" (editable)
- Mantener campo "Nombre" actual como alias

### Paso 9: JavaScript perfil - `assets/perfil.js`
- Cargar y mostrar `full_name`, `id_type`, `id_number` desde la API
- Enviarlos al guardar perfil

### Paso 10: JavaScript global - `assets/script.js`
- Actualizar `setCurrentUser` para incluir `full_name`, `id_type`, `id_number`
- Actualizar display donde corresponda

---

## Archivos Modificados (10 archivos) - ✅ COMPLETADO

| # | Archivo | Cambio | Estado |
|---|---------|--------|--------|
| 1 | `backend/init_db.php` | Schema + migración | ✅ |
| 2 | `backend/api/register.php` | Nuevos campos en registro | ✅ |
| 3 | `backend/api/profile-update.php` | Nuevos campos en perfil | ✅ |
| 4 | `backend/api/users.php` | Incluir en get_current_user + listado | ✅ |
| 5 | `backend/api/usuarios-get.php` | Incluir en listado admin | ✅ |
| 6 | `backend/api/usuarios.php` | Solo delete - sin cambios requeridos | ✅ |
| 7 | `views/registro.html` | Formulario registro con full_name, id_type, id_number | ✅ |
| 8 | `views/user/perfil.html` | Formulario perfil editable | ✅ |
| 9 | `assets/perfil.js` | Cargar/guardar nuevos campos + enable/disable | ✅ |
| 10 | `assets/script.js` | Enviar full_name, id_type, id_number en registro | ✅ |
| 11 | `views/admin/admin-usuarios.html` | Tabla con columnas Alias, Nombre Completo, Documento | ✅ |
| 12 | `assets/admin-tables.js` | loadUsers y createUser con nuevos campos | ✅ |

---

## Resumen de cambios realizados

### Base de datos - `users` tabla ahora tiene:
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `name` | VARCHAR(255) | **Alias / Username** (para mostrar en dashboard) |
| `full_name` | VARCHAR(255) | Nombre completo real |
| `id_type` | ENUM('CC','NIT','Pasaporte','CE','Otro') | Tipo de documento |
| `id_number` | VARCHAR(50) | Número de documento |

### Flujo de datos:
- **Registro**: Se pide Alias, Nombre Completo, Tipo Doc, Número Doc
- **Perfil**: Se pueden editar todos los campos
- **Dashboard**: Sigue mostrando `name` (alias) como antes
- **Admin**: Lista usuarios incluye `full_name`, `id_type`, `id_number`

### Migración para usuarios existentes:
- `UPDATE users SET full_name = name WHERE full_name IS NULL` - copia automática

## Pasos Siguientes (Post-Implementación)
1. Ejecutar `php backend/init_db.php` para aplicar migración de BD
2. Verificar que los usuarios existentes tengan `full_name` poblado
3. Probar registro con nuevos campos
4. Probar edición de perfil con nuevos campos
5. Probar visualización en admin

