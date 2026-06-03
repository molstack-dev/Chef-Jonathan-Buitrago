<?php
require_once 'config.php';

try {
    // Insertar admin
    $hashedPassword = password_hash('admin123', PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=name");
    $stmt->execute(['Administrador', 'admin@chefjonathan.com', $hashedPassword, 'admin']);

    // Insertar usuario existente
    $hashedPassword2 = password_hash('12345', PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=name");
    $stmt->execute(['Alex', 'edwinalex8712@gmail.com', $hashedPassword2, 'user']);

    // Insertar algunos cursos
    $courses = [
        ['Cata de Cacao', 'Una experiencia sensorial para descubrir los secretos del cacao, identificando notas y orígenes de distintas variedades.', 50000, '2 horas', 'evento'],
        ['Pastelería de Vanguardia', 'Explora las últimas tendencias de la pastelería mundial, aplicando técnicas innovadoras y creativas a tus postres.', 150000, '10 semanas', 'cursos'],
        ['Bombonería', 'Crea bombones artesanales con diferentes rellenos y acabados, dominando las técnicas profesionales de la chocolatería fina.', 95000, '6 semanas', 'cursos'],
        ['Chocolatería Avanzada', 'Aprende técnicas avanzadas de temperado, moldeado y decoración de chocolate para crear piezas maestras.', 120000, '8 semanas', 'cursos'],
        ['Taller de Repostería Básica', 'Fundamentos de la repostería: masas, cremas, glaseados y técnicas básicas para principiantes.', 80000, '4 semanas', 'cursos'],
        ['Asesoría Personalizada', 'Sesión privada con el Chef Jonathan para resolver dudas específicas o planificar proyectos culinarios.', 100000, '1 hora', 'asesoria']
    ];

    foreach ($courses as $course) {
        $stmt = $pdo->prepare("INSERT INTO courses (title, description, price, duration, category) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=title");
        $stmt->execute($course);
    }

    // Insertar clientes
    $clients = [
        ['Juan Pérez', 'juan@email.com', '555-0101'],
        ['María García', 'maria@email.com', '555-0102'],
        ['Carlos López', 'carlos@email.com', '555-0103'],
        ['Ana Rodríguez', 'ana@email.com', '555-0104']
    ];

    foreach ($clients as $client) {
        $stmt = $pdo->prepare("INSERT INTO clients (name, email, phone) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=name");
        $stmt->execute($client);
    }

    // Insertar inscripciones (registrations)
    $registrations = [
        [1, 1, 'completed'], // Cliente 1 en curso 1
        [2, 3, 'pending'],   // Cliente 2 en curso 3
        [3, 2, 'completed']  // Cliente 3 en curso 2
    ];

    foreach ($registrations as $reg) {
        $stmt = $pdo->prepare("INSERT INTO registrations (client_id, course_id, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE client_id=client_id");
        $stmt->execute($reg);
    }

    echo "Datos iniciales insertados correctamente.\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>