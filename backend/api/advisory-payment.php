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

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit;
}

// Verificar que es admin
$stmt = $pdo->prepare('SELECT id, role FROM users WHERE id = ?');
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$user || $user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['id']) || !isset($data['payment_status'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit;
}

$id = (int)$data['id'];
$payment_status = trim($data['payment_status']);

if (!in_array($payment_status, ['paid', 'rejected', 'pending'], true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Estado inválido']);
    exit;
}

try {
    $stmt = $pdo->prepare('UPDATE advisories SET payment_status = ?, payment_date = NOW() WHERE id = ?');
    $stmt->execute([$payment_status, $id]);

    // Si es aprobado, marcar como confirmado; si es rechazado, marcar como cancelled
    if ($payment_status === 'paid') {
        $stmt = $pdo->prepare('UPDATE advisories SET status = ? WHERE id = ?');
        $stmt->execute(['confirmed', $id]);
    } elseif ($payment_status === 'rejected') {
        $stmt = $pdo->prepare('UPDATE advisories SET status = ? WHERE id = ?');
        $stmt->execute(['cancelled', $id]);
    }

    echo json_encode(['success' => true, 'message' => 'Pago actualizado']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al actualizar']);
}
?>