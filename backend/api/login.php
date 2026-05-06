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

if (!$data || !isset($data['email']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Email y contraseña requeridos']);
    exit;
}

$email = trim($data['email']);
$password = $data['password'];

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['message' => 'Email y contraseña requeridos']);
    exit;
}

try {
    // Buscar usuario
    $stmt = $pdo->prepare("SELECT id, name, email, password, role FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(['message' => 'Credenciales inválidas']);
        exit;
    }

    // No enviar contraseña en la respuesta
    unset($user['password']);

    echo json_encode([
        'message' => 'Inicio de sesión exitoso',
        'user' => $user
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Error interno del servidor']);
}
?>