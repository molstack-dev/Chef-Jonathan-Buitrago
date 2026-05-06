<?php
// init_db.php - Inicializar la base de datos SQLite con todas las tablas

require_once 'config.php';

try {
    // Habilitar claves foráneas en SQLite
    $pdo->exec("PRAGMA foreign_keys = ON");

    // Crear tabla de usuarios
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'seller', 'user')) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Crear tabla de cursos
    $pdo->exec("CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        price REAL,
        duration TEXT,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Crear tabla de clientes
    $pdo->exec("CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Crear tabla de vendedores/trabajadores
    $pdo->exec("CREATE TABLE IF NOT EXISTS sellers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        commission_rate REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Crear tabla de ventas
    $pdo->exec("CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        seller_id INTEGER,
        course_id INTEGER,
        amount REAL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (seller_id) REFERENCES sellers(id),
        FOREIGN KEY (course_id) REFERENCES courses(id)
    )");

    // Crear tabla de comisiones
    $pdo->exec("CREATE TABLE IF NOT EXISTS commissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        seller_id INTEGER,
        sale_id INTEGER,
        amount REAL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES sellers(id),
        FOREIGN KEY (sale_id) REFERENCES sales(id)
    )");

    // Crear tabla de visitas
    $pdo->exec("CREATE TABLE IF NOT EXISTS visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        FOREIGN KEY (client_id) REFERENCES clients(id)
    )");

    // Crear tabla de registros
    $pdo->exec("CREATE TABLE IF NOT EXISTS registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        course_id INTEGER,
        status TEXT CHECK(status IN ('pending', 'confirmed', 'completed')) DEFAULT 'pending',
        registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (course_id) REFERENCES courses(id)
    )");

    // Insertar datos iniciales
    // Verificar si ya existen datos
    $stmt = $pdo->query("SELECT COUNT(*) FROM users");
    $count = $stmt->fetchColumn();

    if ($count == 0) {
        // Insertar admin
        $hashedPassword = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
        $stmt->execute(['Administrador', 'admin@chefjonathan.com', $hashedPassword, 'admin']);

        // Insertar usuario de prueba
        $hashedPassword2 = password_hash('12345', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
        $stmt->execute(['Alex', 'edwinalex8712@gmail.com', $hashedPassword2, 'user']);

        // Insertar cursos
        $courses = [
            ['Cata de Cacao', 'Una experiencia sensorial para descubrir los secretos del cacao, identificando notas y orígenes de distintas variedades.', 50000, '2 horas', 'evento'],
            ['Pastelería de Vanguardia', 'Explora las últimas tendencias de la pastelería mundial, aplicando técnicas innovadoras y creativas a tus postres.', 150000, '10 semanas', 'cursos'],
            ['Bombonería', 'Crea bombones artesanales con diferentes rellenos y acabados, dominando las técnicas profesionales de la chocolatería fina.', 95000, '6 semanas', 'cursos']
        ];

        $stmt = $pdo->prepare("INSERT INTO courses (title, description, price, duration, category) VALUES (?, ?, ?, ?, ?)");
        foreach ($courses as $course) {
            $stmt->execute($course);
        }

        echo "✓ Base de datos inicializada correctamente con datos de ejemplo.\n";
    } else {
        echo "✓ Base de datos ya existente con datos.\n";
    }

} catch (PDOException $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>