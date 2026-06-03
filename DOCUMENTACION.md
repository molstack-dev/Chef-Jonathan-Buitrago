# Documentación del Sistema - Chef Jonathan Buitrago

## 1. Sistema de Autenticación

### Login / Registro
- **Archivos**: `backend/api/login.php`, `backend/api/register.php`
- **Métodos**: POST con JSON `{email, password}` o `{name, email, password, phone}`
- **Sesiones**: PHP sessions con `user_id` y `user_name`
- **Almacenamiento**: LocalStorage `currentUser` para persistencia frontend

### Cambio de Contraseña
- **Archivo**: `backend/api/password-change.php`
- **Requiere**: Sesión activa
- **Valida**: Contraseña actual antes de cambiar

### Recuperación de Contraseña
- **Archivos**: `backend/api/forgot-password.php`, `backend/api/reset-password.php`
- **Flujo**: Solicitar email → Enviar link → Reset con token

---

## 2. Gestión de Cursos

### Catálogo de Cursos
- **Archivo**: `views/catalogo.html`
- **API**: `backend/api/courses.php`
- **Contenido**: Grid de cursos con imagen, título, precio, botón de inscripción

### Inscripción a Cursos
- **Archivo**: `backend/api/inscripciones.php`
- **Tipo**: POST con `{course_id, num_persons}`
- **Validaciones**:
  - No estar ya inscrito
  - Cupo disponible
  - Pago pendiente (no aprobado automáticamente)

### Contenido de Cursos (Lecciónes)
- **Archivo**: `backend/api/course-content-get.php`
- **Parámetro**: `course_id` via GET
- **Verificación**: Usuario debe estar inscrito con `payment_status = 'paid'`
- **Retorna**: Lista de lecciones con título, descripción, URL de video, duración

---

## 3. Módulo de Usuario

### Panel Principal
- **Archivo**: `views/user/user.html`
- **Funciones**: Bienvenida personalizada, navegación a módulos

### Mis Cursos
- **Archivo**: `views/user/mis-cursos.html` + `assets/mis-cursos.js`
- **Características**:
  - Lista de cursos con pago aprobado
  - Barra de progreso por curso
  - **Accordion desplegable**: Al hacer click en un curso, se expande mostrando las lecciones
  - Carga lazy del contenido via API
  - Botón "Ver" para abrir reproductor seguro

### Historial
- **Archivo**: `views/user/historial.html`
- **API**: `backend/api/my-history-get.php`
- **Contenido**: Combina inscripciones y asesorías del usuario
- **Botón reembolso**: Solo para cursos (`service_type = 'curso'`) y dentro de 7 días

### Certificados
- **Archivo**: `views/user/certificados.html`
- **API**: `backend/api/certificados.php`
- **Contenido**: Lista de certificados generados

### Agendar Servicio
- **Archivo**: `views/user/agendar.html` + `assets/agendar.js`
- **Tipos**: `curso`, `asesoria`, `evento`
- **Campos**: Servicio, fecha, hora, número de personas, notas
- **Accordion de lecciones**: Igual que en mis-cursos,click en curso expande lecciones

### Perfil
- **Archivo**: `views/user/perfil.html` + `assets/perfil.js`
- **Funciones**: Actualizar datos personales, cambiar contraseña

---

## 4. Sistema de Reembolsos

### Solicitar Reembolso (Usuario)
- **Archivo**: `backend/api/refund-request.php`
- **Tipo**: POST con `{id, type}` donde `type` = `registration` o `advisory`
- **Validaciones**:
  - Solo para servicio_type = `curso`
  - Máximo 7 días desde la creación
  - Solo estados `confirmed` o `completed`
  - No tener solicitud pendiente
- **Acción**: Cambia `payment_status` a `refund_requested`

### Gestión de Reembolsos (Admin)
- **Archivos**:
  - `backend/api/refunds-get.php` - Lista solicitudes pendientes
  - `backend/api/refund-process.php` - Aprueba/rechaza
  - `views/admin/admin-reembolsos.html` - Interfaz admin
- **Acciones**:
  - **Aprobar**: Status = `cancelled`, payment_status = `refunded`
  - **Rechazar**: Revertir a `paid`

---

## 5. Módulo Admin

### Dashboard Admin
- **Archivo**: `views/admin/admin.html`
- **Secciones**:
  - Gestión de Usuarios
  - Gestión de Servicios (Inscripciones)
  - Gestión de Asesoría
  - Gestión de Reembolsos

### Gestión de Usuarios
- **Archivo**: `views/admin/admin-usuarios.html`
- **API**: `backend/api/users.php`
- **Acciones**: CRUD completo de usuarios

### Gestión de Inscripciones
- **Archivo**: `views/admin/admin-inscripciones.html` + `assets/admin-inscripciones.js`
- **APIs**:
  - `backend/api/inscripciones-get.php` - Lista
  - `backend/api/inscripciones.php` - Crear/Actualizar
- **Campos**: Cliente, Curso, Fecha, Estado, Pago

### Gestión de Servicios
- **Archivo**: `views/admin/admin-servicios.html`
- **Contenido**: Servicios disponibles con precios

### Gestión de Reembolsos
- **Archivo**: `views/admin/admin-reembolsos.html`
- **Tabla**: Cliente, Servicio, Fecha solicitud, Monto
- **Botones**: Aprobar / Rechazar con confirmación

---

## 6. Base de Datos (SQLite)

### Tablas Principales

#### users
```sql
id, name, email, password, phone, role, created_at
```

#### courses
```sql
id, title, description, price, image_url, is_active, created_at
```

#### registrations
```sql
id, client_id, course_id, num_persons, status, payment_status,
registration_date, created_at
```

#### advisories
```sql
id, user_id, service_type, advisory_service, reservation_date,
reservation_time, num_persons, status, payment_status, notes, created_at
```

#### course_content
```sql
id, course_id, title, description, content_type, video_url,
preview_url, duration, order_index, is_active
```

#### notifications
```sql
id, user_id, title, message, type, is_read, created_at
```

---

## 7. APIs del Sistema

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/login.php | Autenticación |
| POST | /api/register.php | Registro |
| POST | /api/password-change.php | Cambiar contraseña |
| POST | /api/forgot-password.php | Solicitar recuperación |
| POST | /api/reset-password.php | Reset con token |
| GET | /api/courses.php | Listar cursos |
| GET | /api/inscripciones.php | Mis inscripciones |
| POST | /api/inscripciones.php | Crear inscripción |
| GET | /api/course-content-get.php | Contenido de curso |
| GET | /api/my-history-get.php | Historial usuario |
| GET | /api/my-advisories-get.php | Mis asesorías |
| GET | /api/certificados.php | Mis certificados |
| POST | /api/refund-request.php | Solicitar reembolso |
| GET | /api/refunds-get.php | Lista reembolsos (admin) |
| POST | /api/refund-process.php | Procesar reembolso |
| GET | /api/users.php | Gestión usuarios |
| GET | /api/notifications.php | Notificaciones |

---

## 8. Flujos Principales

### Inscripción a Curso
1. Usuario ve catálogo en `catalogo.html`
2. Hace click en "Inscribirse"
3.填写 datos (número de personas)
4. `inscripciones.php` crea registro con `payment_status = pending`
5. Admin approves en `admin-inscripciones.html`
6. Usuario puede ver curso en `mis-cursos.html`

### Solicitar Reembolso
1. Usuario va a `historial.html`
2. Ve botón "Solicitar Reembolso" (si aplica)
3. Click → `refund-request.php` cambia estado a `refund_requested`
4. Admin ve solicitud en `admin-reembolsos.html`
5. Admin approve/reject en `refund-process.php`

### Ver Contenido de Curso
1. Usuario click en curso en `mis-cursos.html`
2. Accordion expande y carga contenido via `course-content-get.php`
3. Usuario click "Ver" en lección
4. Abre `reproductor.php` con token tiempo-limitado

---

## 9. Estructura de Archivos

```
Chef-Jonathan-Buitrago/
├── index.html                    # Landing page
├── backend/
│   ├── api/
│   │   ├── login.php
│   │   ├── register.php
│   │   ├── courses.php
│   │   ├── inscripciones.php
│   │   ├── course-content-get.php
│   │   ├── my-history-get.php
│   │   ├── refund-request.php
│   │   ├── refunds-get.php
│   │   ├── refund-process.php
│   │   └── ...
│   ├── config.php
│   ├── cors.php
│   └── init_db.php
├── assets/
│   ├── script.js
│   ├── style.css
│   ├── agendar.js
│   ├── mis-cursos.js
│   └── ...
├── views/
│   ├── user/
│   │   ├── user.html
│   │   ├── mis-cursos.html
│   │   ├── historial.html
│   │   ├── agendar.html
│   │   └── ...
│   └── admin/
│       ├── admin.html
│       ├── admin-usuarios.html
│       ├── admin-inscripciones.html
│       ├── admin-reembolsos.html
│       └── ...
└── DOCUMENTACION.md
```

---

## 10. Notas Técnicas

- **Base de datos**: SQLite local en `backend/chef_jonathan.db`
- **CORS**: Configurado para permitir peticiones desde cualquier origen
- **Sesiones**: PHP native sessions
- **Frontend**: HTML vanilla + TailwindCSS + vanilla JS
- **Accordion cursos**: Implementado en `agendar.js` y `mis-cursos.js` con carga async de lecciones
