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
        ['Bombonería', 'Crea bombones artesanales con diferentes rellenos y acabados, dominando las técnicas profesionales de la chocolatería fina.', 95000, '6 semanas', 'cursos']
    ];

    foreach ($courses as $course) {
        $stmt = $pdo->prepare("INSERT INTO courses (title, description, price, duration, category) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=title");
        $stmt->execute($course);
    }

    echo "Datos iniciales insertados correctamente.\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>