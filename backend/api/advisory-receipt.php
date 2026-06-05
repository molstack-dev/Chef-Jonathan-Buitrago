<?php
header('Content-Type: application/json');
require_once '../cors.php';
header('Access-Control-Allow-Methods: PUT, POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['id']) || !isset($data['payment_receipt'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit;
}

$id = (int)$data['id'];
$receipt = trim($data['payment_receipt']);

if (empty($receipt)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Comprobante requerido']);
    exit;
}

try {
    // Verificar que la asesoría existe (sin importar user_id, porque puede haber sido creada sin sesión)
    $check = $pdo->prepare('SELECT id FROM advisories WHERE id = ?');
    $check->execute([$id]);

    if (!$check->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Asesoría no encontrada']);
        exit;
    }

    $stmt = $pdo->prepare('UPDATE advisories SET payment_receipt = ?, payment_status = ? WHERE id = ?');
    $stmt->execute([$receipt, 'paid', $id]);

    echo json_encode([
        'success' => true,
        'message' => 'Comprobante recibido. Te contactaremos pronto para confirmar tu pago.'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al guardar comprobante']);
}
?>