<?php
// Sesión primero - debe ser lo primero antes de cualquier output
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');
require_once '../cors.php';
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['service'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Servicio es requerido']);
    exit;
}

if (!isset($data['phone']) || empty(trim($data['phone']))) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El teléfono es requerido']);
    exit;
}

$name = isset($data['name']) ? trim($data['name']) : '';
$email = isset($data['email']) ? trim($data['email']) : '';
$user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;

if ($user_id) {
    $name = $_SESSION['user_name'] ?? $name;
    $email = $_SESSION['user_email'] ?? $email;
}

$phone = isset($data['phone']) ? trim($data['phone']) : '';
$service_type = isset($data['serviceType']) ? trim($data['serviceType']) : 'asesoria';
$advisory_type = isset($data['advisoryType']) ? trim($data['advisoryType']) : null;
$advisory_service = isset($data['advisoryService']) ? trim($data['advisoryService']) : null;
$advisory_mode = isset($data['advisoryMode']) ? trim($data['advisoryMode']) : null;
$event_name = isset($data['eventName']) ? trim($data['eventName']) : null;
$price = isset($data['price']) ? floatval($data['price']) : 0;
$date = isset($data['date']) ? trim($data['date']) : '';
$time = isset($data['time']) ? trim($data['time']) : '';
$notes = isset($data['notes']) ? trim($data['notes']) : '';
$num_persons = isset($data['numPersons']) ? intval($data['numPersons']) : 1;

// Validar email solo si se proporciona
if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
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
    $stmt = $pdo->prepare("INSERT INTO advisories (user_id, name, email, phone, service_type, advisory_type, advisory_service, advisory_mode, event_name, price, date, time, notes, num_persons) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$user_id, $name, $email, $phone, $service_type, $advisory_type, $advisory_service, $advisory_mode, $event_name, $price ?: null, $date ?: null, $time ?: null, $notes, $num_persons]);

    $advisory_id = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => 'Asesoría registrada exitosamente',
        'data' => [
            'id' => $advisory_id,
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'service_type' => $service_type,
            'advisory_type' => $advisory_type,
            'advisory_service' => $advisory_service,
            'advisory_mode' => $advisory_mode,
            'event_name' => $event_name,
            'date' => $date,
            'time' => $time,
            'status' => 'pending'
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor: ' . $e->getMessage()]);
}
?>
