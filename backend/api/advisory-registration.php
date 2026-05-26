<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['name']) || !isset($data['email']) || !isset($data['service'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Nombre, email y servicio son requeridos']);
    exit;
}

$name = trim($data['name']);
$email = trim($data['email']);
$phone = isset($data['phone']) ? trim($data['phone']) : '';
$service = trim($data['service']);
$date = isset($data['date']) ? trim($data['date']) : '';
$time = isset($data['time']) ? trim($data['time']) : '';
$notes = isset($data['notes']) ? trim($data['notes']) : '';
$user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;

if (empty($name) || empty($email) || empty($service)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Nombre, email y servicio no pueden estar vacíos']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email no válido']);
    exit;
}

if ($date && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Formato de fecha inválido']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO advisories (user_id, name, email, phone, service, date, time, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$user_id, $name, $email, $phone, $service, $date ?: null, $time ?: null, $notes]);

    $advisory_id = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => 'Asesoría registrada exitosamente',
        'data' => [
            'id' => $advisory_id,
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'service' => $service,
            'date' => $date,
            'time' => $time,
            'status' => 'pending'
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
}
?>
