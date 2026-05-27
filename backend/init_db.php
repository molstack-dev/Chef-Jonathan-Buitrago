<?php
// init_db.php - Inicializar la base de datos MySQL con todas las tablas

require_once 'config.php';

try {
    // Desactivar checks de foreign keys para poder borrar
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

    // Eliminar tablas existentes si hay error de tablespace
    $pdo->exec("DROP TABLE IF EXISTS reservations");
    $pdo->exec("DROP TABLE IF EXISTS advisories");
    $pdo->exec("DROP TABLE IF EXISTS registrations");
    $pdo->exec("DROP TABLE IF EXISTS visits");
    $pdo->exec("DROP TABLE IF EXISTS commissions");
    $pdo->exec("DROP TABLE IF EXISTS sales");
    $pdo->exec("DROP TABLE IF EXISTS courses");
    $pdo->exec("DROP TABLE IF EXISTS sellers");
    $pdo->exec("DROP TABLE IF EXISTS clients");
    $pdo->exec("DROP TABLE IF EXISTS users");

    // Reactivar foreign keys
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

    // Crear tabla de usuarios (antes de tablas que la referencian)
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin','seller','user') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Crear tabla de cursos
    $pdo->exec("CREATE TABLE IF NOT EXISTS courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        description_detail TEXT,
        price DECIMAL(10, 2),
        duration VARCHAR(100),
        category VARCHAR(100),
        image MEDIUMTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Crear tabla de clientes
    $pdo->exec("CREATE TABLE IF NOT EXISTS clients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Crear tabla de vendedores/trabajadores
    $pdo->exec("CREATE TABLE IF NOT EXISTS sellers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        commission_rate DECIMAL(5, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Crear tabla de ventas
    $pdo->exec("CREATE TABLE IF NOT EXISTS sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT,
        seller_id INT,
        course_id INT,
        amount DECIMAL(10, 2),
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Crear tabla de comisiones
    $pdo->exec("CREATE TABLE IF NOT EXISTS commissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        seller_id INT,
        sale_id INT,
        amount DECIMAL(10, 2),
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Crear tabla de visitas
    $pdo->exec("CREATE TABLE IF NOT EXISTS visits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Crear tabla de registros
    $pdo->exec("CREATE TABLE IF NOT EXISTS registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT,
        course_id INT,
        status ENUM('pending', 'confirmed', 'completed') DEFAULT 'pending',
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Crear tabla de asesorías
    $pdo->exec("CREATE TABLE IF NOT EXISTS advisories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        service VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        time TIME,
        notes TEXT,
        status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Crear tabla de reservas
    $pdo->exec("CREATE TABLE IF NOT EXISTS reservations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        id_type VARCHAR(50),
        id_number VARCHAR(100),
        reservation_type ENUM('curso', 'asesoria', 'evento') NOT NULL,
        course_id INT,
        advisory_id INT,
        event_id INT,
        date DATE NOT NULL,
        time TIME,
        notes TEXT,
        status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Insertar datos iniciales
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM users");
    $stmt->execute();
    $result = $stmt->fetch();
    $count = $result['count'] ?? 0;

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
            ['Cata de Cacao', 'Una experiencia sensorial para descubrir los secretos del cacao, identificando notas y orígenes de distintas variedades.', 50000, '2 horas', 'eventos', '../img/chef_jonathan_buitrago_post_12_5_2024_10_07_303366402308080947431.jpg'],
            ['Pastelería de Vanguardia', 'Explora las últimas tendencias de la pastelería mundial, aplicando técnicas innovadoras y creativas a tus postres.', 150000, '10 semanas', 'cursos', '../img/chef_jonathan_buitrago_post_12_9_2019_8_46_522131343889580551158.jpg'],
            ['Bombonería', 'Crea bombones artesanales con diferentes rellenos y acabados, dominando las técnicas profesionales de la chocolatería fina.', 95000, '6 semanas', 'cursos', '../img/chef_jonathan_buitrago_post_29_12_2021_8_36_232739425447496136534.jpg']
        ];

        $stmt = $pdo->prepare("INSERT INTO courses (title, description, price, duration, category, image) VALUES (?, ?, ?, ?, ?, ?)");
        foreach ($courses as $course) {
            $stmt->execute($course);
        }

        echo "✓ Base de datos inicializada correctamente con datos de ejemplo.\n";
    } else {
        echo "✓ Base de datos ya existente con datos.\n";
    }

} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>