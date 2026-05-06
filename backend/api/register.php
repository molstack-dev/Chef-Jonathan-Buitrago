<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Método no permitido']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['name']) || !isset($data['email']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Datos incompletos']);
    exit;
}

$name = trim($data['name']);
$email = trim($data['email']);
$password = $data['password'];

if (empty($name) || empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['message' => 'Todos los campos son requeridos']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['message' => 'Email inválido']);
    exit;
}

try {
    // Verificar si el usuario ya existe
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['message' => 'El usuario ya existe']);
        exit;
    }

    // Crear hash de la contraseña
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insertar nuevo usuario
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')");
    $stmt->execute([$name, $email, $hashedPassword]);

    $userId = $pdo->lastInsertId();

    echo json_encode([
        'message' => 'Usuario registrado exitosamente',
        'user' => [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'role' => 'user'
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Error interno del servidor']);
}
?>