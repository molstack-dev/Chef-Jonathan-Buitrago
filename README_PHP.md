# Chef Jonathan Buitrago - Versión PHP (MySQL)

## ✅ Cambios Realizados

### 1. **Base de Datos SQLite (Local)**
- Uso de **MySQL** con XAMPP para desarrollo local.
- El nombre de la base es: `chef_jonathan`.
- Archivo de base de datos: `backend/chef_jonathan.sqlite3`
- Totalmente portátil y funciona con PHP por defecto.

### 2. **CRUD Completo Implementado**

#### **Usuarios (Admin, Trabajadores, Usuarios)**
- `POST /backend/api/register.php` - Registro con password encriptado
- `POST /backend/api/login.php` - Login con verificación segura
- `GET /backend/api/users.php` - Listar todos los usuarios

#### **Clientes**
- `GET /backend/api/clients.php` - Listar clientes
- `POST /backend/api/clients.php` - Crear cliente
- `PUT /backend/api/clients.php` - Actualizar cliente
- `DELETE /backend/api/clients.php` - Eliminar cliente

#### **Vendedores/Trabajadores**
- `GET /backend/api/sellers.php` - Listar vendedores
- `POST /backend/api/sellers.php` - Crear vendedor
- `PUT /backend/api/sellers.php` - Actualizar vendedor
- `DELETE /backend/api/sellers.php` - Eliminar vendedor

#### **Cursos**
- `GET /backend/api/courses.php` - Listar cursos
- `POST /backend/api/courses.php` - Crear curso

### 3. **Seguridad**
✅ Passwords encriptados con `password_hash()`
✅ Verificación con `password_verify()`
✅ Validación de emails y datos
✅ Manejo de errores PDO

### 4. **Datos Iniciales**
- **Admin**: `admin@chefjonathan.com` / `admin123`
- **Usuario Test**: `edwinalex8712@gmail.com` / `12345`
- **Tres cursos de ejemplo**

---

## 🚀 Cómo Usar

### 1. **Iniciar el Servidor**
```bash
cd /workspaces/Chef-Jonathan-Buitrago
php -S 0.0.0.0:8000
```

### 2. **Acceder a la Aplicación**
```
http://localhost:8000
```

### 3. **Login de Prueba**
- **Email**: `admin@chefjonathan.com`
- **Contraseña**: `admin123`

---

## 📋 Tablas de Base de Datos

### `users`
- id, name, email, password, role (admin|seller|user), created_at

### `clients`
- id, name, email, phone, address, created_at

### `sellers`
- id, name, email, phone, commission_rate, created_at

### `courses`
- id, title, description, price, duration, category, created_at

### `sales`
- id, client_id, seller_id, course_id, amount, date

### `commissions`
- id, seller_id, sale_id, amount, date

### `visits`
- id, client_id, date, notes

### `registrations`
- id, client_id, course_id, status (pending|confirmed|completed), registration_date

---

## 🔧 Endpoints de Ejemplo

### Registro de Usuario
```bash
curl -X POST http://localhost:8000/backend/api/register.php \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan","email":"juan@test.com","password":"123456"}'
```

### Login
```bash
curl -X POST http://localhost:8000/backend/api/login.php \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@chefjonathan.com","password":"admin123"}'
```

### Crear Cliente
```bash
curl -X POST http://localhost:8000/backend/api/clients.php \
  -H "Content-Type: application/json" \
  -d '{"name":"María López","email":"maria@email.com","phone":"3001234567"}'
```

### Listar Clientes
```bash
curl http://localhost:8000/backend/api/clients.php
```

---

## 📦 Archivos Clave

```
backend/
├── config.php              # Configuración MySQL
├── init_db.php             # Inicializar base de datos
├── chef_jonathan.sqlite3   # Base de datos (auto-generada)
└── api/
    ├── register.php        # Registro de usuarios
    ├── login.php           # Login
    ├── users.php           # Gestión de usuarios
    ├── clients.php         # CRUD de clientes
    ├── sellers.php         # CRUD de vendedores
    ├── courses.php         # CRUD de cursos
    └── dashboard.php       # Dashboard por rol
```

---

## ✨ Estados de los Endpoints

| Item | Estado |
|------|--------|
| Login Admin | ✅ Funcionando |
| Registro | ✅ Funcionando |
| CRUD Clientes | ✅ Funcionando |
| CRUD Vendedores | ✅ Funcionando |
| CRUD Cursos | ✅ Funcionando |
| Seguridad | ✅ Activa |

---

**Rama**: `php` | **Base de Datos**: MySQL | **Servidor**: PHP Built-in
