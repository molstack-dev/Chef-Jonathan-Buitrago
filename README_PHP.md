# Chef Jonathan Buitrago - Versión PHP (MySQL)

## ✅ Estado actual
El proyecto ya está funcional en Linux/Fedora cuando PHP tiene instaladas las extensiones correctas de PDO/MySQL.

## Requisitos de software
### Opción recomendada: Fedora / Linux
```bash
sudo dnf install -y php php-cli php-pdo php-mysqlnd mariadb-server
```

### Si vas a usar Apache
```bash
sudo dnf install -y httpd
sudo systemctl enable --now httpd mariadb
```

### Verificar que todo esté instalado
```bash
php -v
php -m | grep -Ei 'pdo|mysql|mysqli'
php /opt/lampp/htdocs/Chef-Jonathan-Buitrago/check_requirements.php
```

Debes ver algo como:
- `PDO`
- `pdo_mysql`
- `mysqli`
- `mysqlnd`

Si no aparecen, el backend no podrá conectar con MySQL y devolverá errores 500 o JSON inválido.

### XAMPP (si lo usas)
```bash
/opt/lampp/bin/php -m | grep -Ei 'pdo|mysql|mysqli'
```

---

## 🚀 Cómo arrancar el proyecto
### Opción 1: Servidor integrado de PHP
```bash
cd /opt/lampp/htdocs/Chef-Jonathan-Buitrago
php -S 0.0.0.0:8000
```
Y luego abre:
```text
http://localhost:8000/
```

### Opción 2: XAMPP / Apache
- Inicia Apache y MySQL desde XAMPP.
- Abre la app en:
```text
http://localhost/Chef-Jonathan-Buitrago/
```

---

## 🗄️ Inicializar la base de datos
1. Abre:
```text
http://localhost:8000/backend/init_db.php
```
2. Luego ejecuta:
```text
http://localhost:8000/backend/seed.php
```

Si usas XAMPP, reemplaza `localhost:8000` por `localhost/Chef-Jonathan-Buitrago`.

---

## 🔑 Credenciales de prueba
- Admin: `admin@chefjonathan.com` / `admin123`
- Usuario: `edwinalex8712@gmail.com` / `12345`

---

## 🔧 Endpoints principales
- `POST /backend/api/register.php`
- `POST /backend/api/login.php`
- `GET /backend/api/cursos-get.php`
- `GET /backend/api/usuarios-get.php`
- `GET /backend/api/inscripciones-get.php`

---

## 🛠️ Qué revisar si algo falla
- Ejecuta:
```bash
php -m | grep -Ei 'pdo|mysql|mysqli'
```
- Verifica que la base de datos esté corriendo.
- Revisa que `backend/config.php` pueda crear y usar la base `chef_jonathan`.

---

## 📌 Resumen rápido
Si el proyecto no funciona en Linux/Fedora, lo primero que debes comprobar es:
1. PHP instalado.
2. Extensiones PDO/MySQL cargadas.
3. MySQL/MariaDB corriendo.
4. Scripts de inicialización ejecutados.
