<?php
// init_db.php - Inicializar la base de datos MySQL con todas las tablas

require_once 'config.php';

try {
    // Desactivar checks de foreign keys para poder borrar
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

    // RESET COMPLETO SIEMPRE: eliminar datos anteriores y dejar solo lo nuevo.
    // Se intenta TRUNCATE por orden (con FK checks desactivados). Si algo falla, se hace DELETE.
    $tablesToReset = ['course_content','registrations','reservations','advisories','clients','courses','users','password_resets','refunds'];
    foreach ($tablesToReset as $tbl) {
        try {
            $pdo->exec("TRUNCATE TABLE {$tbl}");
        } catch (Exception $e) {
            try {
                $pdo->exec("DELETE FROM {$tbl}");
            } catch (Exception $ignore) {
                // no romper init_db
            }
        }
    }




    // Reactivar foreign keys
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

    // Parche determinista: asegurar esquema de refunds (aunque la tabla ya exista)
    // - admin_receipt siempre exista
    // - refund_status siempre tenga pending/approved/rejected
    try {
        $refundCols = $pdo->query("SHOW COLUMNS FROM refunds")->fetchAll(PDO::FETCH_COLUMN);
        if ($refundCols && !in_array('admin_receipt', $refundCols, true)) {
            $pdo->exec("ALTER TABLE refunds ADD COLUMN admin_receipt TEXT NULL");
        }
        // Ajustar enum refund_status
        $hasRefundStatus = $refundCols && in_array('refund_status', $refundCols, true);
        if ($hasRefundStatus) {
            $pdo->exec("ALTER TABLE refunds MODIFY COLUMN refund_status ENUM('pending','approved','rejected') DEFAULT 'pending'");
        }
    } catch (Exception $e) {
        // si refunds aún no existe, lo ignoramos (se creará más abajo)
    }



    // (Se reutiliza la validación al final del script, usando course_content)



    // Crear tabla de recuperación de contraseñas
    $pdo->exec("CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(64) NOT NULL,
        expires DATETIME NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_token (token)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Crear tabla de usuarios (antes de tablas que la referencian)
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,

        password VARCHAR(255) NOT NULL,
        role ENUM('admin','user') NOT NULL DEFAULT 'user',
        security_question VARCHAR(255),
        security_answer VARCHAR(255),
        notify_email BOOLEAN DEFAULT TRUE,
        notify_whatsapp BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // NOTA: Evitamos ALTERS sobre users (especialmente phone) porque este script hace TRUNCATE
    // y ya definimos el esquema completo arriba. Los ALTERS aquí pueden causar errores como
    // "Duplicate column name 'phone'" en ejecuciones parciales.

    // Agregar columnas de notificación si no existen (para compatibilidad)
    $userCols = $pdo->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_COLUMN);


    if (!in_array('notify_email', $userCols)) {
        try { $pdo->exec("ALTER TABLE users ADD COLUMN notify_email BOOLEAN DEFAULT TRUE"); } catch (Exception $e) {}
    }
    if (!in_array('notify_whatsapp', $userCols)) {
        try { $pdo->exec("ALTER TABLE users ADD COLUMN notify_whatsapp BOOLEAN DEFAULT FALSE"); } catch (Exception $e) {}
    }

    // Crear tabla de cursos
    $pdo->exec("CREATE TABLE IF NOT EXISTS courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        description_detail TEXT,
        price DECIMAL(10, 2) NOT NULL,
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
        phone VARCHAR(20) NOT NULL,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");


    // Crear tabla de registros
    $pdo->exec("CREATE TABLE IF NOT EXISTS registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT,
        course_id INT,
        course_price DECIMAL(10,2),
        status ENUM('pending', 'confirmed', 'completed') DEFAULT 'pending',
        payment_status ENUM('pending', 'paid', 'rejected', 'refund_requested', 'refunded') DEFAULT 'pending',
        payment_receipt TEXT,
        payment_date DATETIME,
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");


    // Corregir migraciones anteriores donde registrations.client_id referenciaba clients.id
    try {
        $oldFk = $pdo->query("SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'registrations' AND COLUMN_NAME = 'client_id' AND REFERENCED_TABLE_NAME = 'clients'")->fetchColumn();
        if ($oldFk) {
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
            $pdo->exec("ALTER TABLE registrations DROP FOREIGN KEY `" . $oldFk . "`");
            $pdo->exec("ALTER TABLE registrations ADD CONSTRAINT registrations_ibfk_1 FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE SET NULL");
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
        }
    } catch (Exception $e) {
        // Si no existe la tabla o la clave ya es correcta, no hacemos nada.
    }

    // Crear tabla de asesorías
    $pdo->exec("CREATE TABLE IF NOT EXISTS advisories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        service_type ENUM('asesoria', 'curso', 'evento') NOT NULL DEFAULT 'asesoria',
        advisory_type VARCHAR(50),
        advisory_service VARCHAR(255),
        advisory_mode VARCHAR(50),
        event_name VARCHAR(255),
        date DATE NULL,
        time TIME,
        notes TEXT,
        status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
        price DECIMAL(10, 2),
        num_persons INT DEFAULT 1,
        payment_status ENUM('pending', 'paid', 'rejected', 'refund_requested', 'refunded') DEFAULT 'pending',
        payment_receipt TEXT,
        payment_date DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");


    // Agregar columnas nuevas si no existen (para actualizaciones)
    $cols = $pdo->query("SHOW COLUMNS FROM advisories")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('service_type', $cols)) {
        try { $pdo->exec("ALTER TABLE advisories ADD COLUMN service_type ENUM('asesoria', 'curso', 'evento') NOT NULL DEFAULT 'asesoria'"); } catch (Exception $e) {}
    }
    if (!in_array('advisory_type', $cols)) {
        try { $pdo->exec("ALTER TABLE advisories ADD COLUMN advisory_type VARCHAR(50)"); } catch (Exception $e) {}
    }
    if (!in_array('advisory_service', $cols)) {
        try { $pdo->exec("ALTER TABLE advisories ADD COLUMN advisory_service VARCHAR(255)"); } catch (Exception $e) {}
    }
    if (!in_array('advisory_mode', $cols)) {
        try { $pdo->exec("ALTER TABLE advisories ADD COLUMN advisory_mode VARCHAR(50)"); } catch (Exception $e) {}
    }
    if (!in_array('event_name', $cols)) {
        try { $pdo->exec("ALTER TABLE advisories ADD COLUMN event_name VARCHAR(255)"); } catch (Exception $e) {}
    }
    if (!in_array('payment_status', $cols)) {
        try { $pdo->exec("ALTER TABLE advisories ADD COLUMN payment_status ENUM('pending', 'paid', 'rejected', 'refund_requested', 'refunded') DEFAULT 'pending'"); } catch (Exception $e) {}
    }

    if (!in_array('payment_receipt', $cols)) {
        try { $pdo->exec("ALTER TABLE advisories ADD COLUMN payment_receipt TEXT"); } catch (Exception $e) {}
    }
    if (!in_array('payment_date', $cols)) {
        try { $pdo->exec("ALTER TABLE advisories ADD COLUMN payment_date DATETIME"); } catch (Exception $e) {}
    }
    if (!in_array('num_persons', $cols)) {
        try { $pdo->exec("ALTER TABLE advisories ADD COLUMN num_persons INT DEFAULT 1"); } catch (Exception $e) {}
    }
    // Hacer phone NOT NULL si aún no lo es
    try {
        $pdo->exec("ALTER TABLE advisories MODIFY COLUMN phone VARCHAR(20) NOT NULL");
    } catch (Exception $e) {
        // Puede fallar si ya es NOT NULL
    }

    // Agregar columnas de pago a registrations si no existen
    $regCols = $pdo->query("SHOW COLUMNS FROM registrations")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('payment_status', $regCols)) {
        try { $pdo->exec("ALTER TABLE registrations ADD COLUMN payment_status ENUM('pending', 'paid', 'rejected', 'refund_requested', 'refunded') DEFAULT 'pending'"); } catch (Exception $e) {}
    }

    if (!in_array('payment_receipt', $regCols)) {
        try { $pdo->exec("ALTER TABLE registrations ADD COLUMN payment_receipt TEXT"); } catch (Exception $e) {}
    }
    if (!in_array('payment_date', $regCols)) {
        try { $pdo->exec("ALTER TABLE registrations ADD COLUMN payment_date DATETIME"); } catch (Exception $e) {}
    }
    if (!in_array('course_price', $regCols)) {
        try { $pdo->exec("ALTER TABLE registrations ADD COLUMN course_price DECIMAL(10,2)"); } catch (Exception $e) {}
    }

    // Crear tabla de reservas
    $pdo->exec("CREATE TABLE IF NOT EXISTS reservations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
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

    // Tabla exclusiva de reembolsos
        $pdo->exec("CREATE TABLE IF NOT EXISTS refunds (

        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type ENUM('registration','advisory') NOT NULL,
        refundable_id INT NOT NULL,
        service_title VARCHAR(255),
        service_name VARCHAR(255),
        amount DECIMAL(10,2),
        refund_status ENUM('pending','approved','rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at DATETIME NULL,
        processed_by INT NULL,
        rejection_reason TEXT NULL,
        admin_receipt TEXT NULL,
        INDEX idx_refund_status (refund_status),

        INDEX idx_refund_user (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Crear tabla de contenido de cursos
    $pdo->exec("CREATE TABLE IF NOT EXISTS course_content (

        id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        content_type VARCHAR(50) DEFAULT 'video',
        video_url TEXT NOT NULL,
        duration VARCHAR(20),

        order_index INT DEFAULT 0,
        is_active INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        INDEX idx_course_content_course (course_id),
        INDEX idx_course_content_order (course_id, order_index)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Insertar datos iniciales (idempotente)
    // Solo se siembra todo (users/courses/course_content) si no existe contenido.
    // Esto evita duplicar lecciones cuando se ejecuta init_db repetidamente.
    // Sembrado inicial controlado por flag para evitar duplicados por ejecuciones repetidas
    $pdo->exec("CREATE TABLE IF NOT EXISTS seed_meta (
        `key` VARCHAR(100) PRIMARY KEY,
        `value` VARCHAR(255) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $stmt = $pdo->prepare("SELECT value FROM seed_meta WHERE `key` = ? LIMIT 1");
    $stmt->execute(['initial_seed_done']);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $seedDone = !empty($row);

    if (!$seedDone) {



        // Insertar admin
        $hashedPassword = password_hash('Admin@2026', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (name, email, phone, password, role, security_question, security_answer) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute(['Jonathan', 'admin@chefjonathan.com', '3220000000', $hashedPassword, 'admin', '¿Cuál es tu postre favorito?', 'torta de chocolate']);

        // Insertar usuario de prueba
        $hashedPassword2 = password_hash('User@2026', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (name, email, phone, password, role, security_question, security_answer) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute(['Alex', 'edwinalex8712@gmail.com', '3508085470', $hashedPassword2, 'user', '¿Cuál es el nombre de tu primera mascota?', 'max']);


        // Insertar cursos (guardar imágenes como base64)
        $img1 = file_exists('../img/chef_jonathan_buitrago_post_12_5_2024_10_07_303366402308080947431.jpg')
            ? base64_encode(file_get_contents('../img/chef_jonathan_buitrago_post_12_5_2024_10_07_303366402308080947431.jpg')) : null;
        $img2 = file_exists('../img/chef_jonathan_buitrago_post_12_9_2019_8_46_522131343889580551158.jpg')
            ? base64_encode(file_get_contents('../img/chef_jonathan_buitrago_post_12_9_2019_8_46_522131343889580551158.jpg')) : null;
        $img3 = file_exists('../img/chef_jonathan_buitrago_post_29_12_2021_8_36_232739425447496136534.jpg')
            ? base64_encode(file_get_contents('../img/chef_jonathan_buitrago_post_29_12_2021_8_36_232739425447496136534.jpg')) : null;

        $courses = [
            [
                'Cata de Cacao',
                'Descubre los sabores y aromas del cacao en una experiencia única.',
                'Explora los secretos del cacao en una cata sensorial. Identificarás notas y orígenes de variedades colombianas, aprenderás a reconocer perfiles de sabor (frutal, floral, terrestre) y comprenderás el proceso desde la cosecha hasta la fermentación. Ideal para amantes del chocolate y profesionales de la gastronomía.',
                50000,
                '2 horas',
                'eventos',
                $img1
            ],
            [
                'Pastelería de Vanguardia',
                'Técnicas modernas para crear postres sorprendentes.',
                'Domina las últimas tendencias de la pastelería mundial. Aprende sobre esferificación, espumas, gels, textures de chocolate y técnicas de emplatado profesional. Desarrollarás habilidades para innovar y crear postres que combinen estética y sabor de manera excepcional.',
                150000,
                '10 semanas',
                'asesorias',
                $img2
            ],
            [
                'Bombonería',
                'Elabora bombones artesanales con acabados profesionales.',
                'Aprende a crear bombones de chocolate con rellenos sofisticados (ganache, praliné, fruitpaste). Estudiarás templado, técnicas de acabado brillante y decorado. Al finalizar podrás desarrollar tu propia línea de bombones artesanales con presentación de altura.',
                95000,
                '6 semanas',
                'cursos',
                $img3
            ],
        ];

        $stmt = $pdo->prepare("INSERT INTO courses (title, description, description_detail, price, duration, category, image) VALUES (?, ?, ?, ?, ?, ?, ?)");
        foreach ($courses as $course) {
            $stmt->execute($course);
        }

        // Insertar contenido de cursos (course_content)
        // Bombonería (curso id 3) tiene 2 videos
        $contentVideos = [
            ['course_id' => 3, 'title' => 'Introducción a la Bombonería', 'description' => 'Aprende los fundamentos de la bombonería artesanal', 'video_url' => 'https://youtu.be/WHGVasGardA', 'duration' => '15 min', 'order_index' => 1],
            ['course_id' => 3, 'title' => 'Técnicas de Templado', 'description' => 'Domina el arte del templado del chocolate', 'video_url' => 'https://youtu.be/bRPpExRQaB4', 'duration' => '20 min', 'order_index' => 2]
        ];

        $stmtContent = $pdo->prepare("INSERT INTO course_content (course_id, title, description, video_url, duration, order_index, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)");
        foreach ($contentVideos as $video) {
            $stmtContent->execute([$video['course_id'], $video['title'], $video['description'], $video['video_url'], $video['duration'], $video['order_index']]);
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