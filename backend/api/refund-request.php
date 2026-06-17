<?php
// refund-request.php - Solicitar reembolso creando registro en tabla exclusiva refunds
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../cors.php';
require_once '../config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function respond(int $code, array $payload): void {
    http_response_code($code);
    echo json_encode($payload);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['success' => false, 'message' => 'Método no permitido']);
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || !isset($data['id']) || !isset($data['type'])) {
    respond(400, ['success' => false, 'message' => 'Datos incompletos']);
}

if (!isset($_SESSION['user_id'])) {
    respond(401, ['success' => false, 'message' => 'Debe iniciar sesión']);
}

$type = trim((string)$data['type']);
$id = (int)$data['id'];
$userId = (int)$_SESSION['user_id'];

if (!in_array($type, ['registration', 'advisory'], true)) {
    respond(400, ['success' => false, 'message' => 'Tipo inválido']);
}

try {
    $pdo->beginTransaction();

    // Verificar elegibilidad y llenar datos de servicio
    if ($type === 'registration') {
        $stmt = $pdo->prepare(
            "SELECT r.id, r.client_id, r.registration_date, r.status, r.payment_status, c.title, r.course_price
             FROM registrations r
             JOIN courses c ON r.course_id = c.id
             WHERE r.id = ? AND r.client_id = ?
             LIMIT 1 FOR UPDATE"
        );
        $stmt->execute([$id, $userId]);
        $rec = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$rec) {
            $pdo->rollBack();
            respond(404, ['success' => false, 'message' => 'Inscripción no encontrada']);
        }

        if (!in_array($rec['status'], ['confirmed', 'completed'], true)) {
            $pdo->rollBack();
            respond(400, ['success' => false, 'message' => 'No se puede solicitar reembolso para este estado']);
        }

        if ($rec['payment_status'] === 'refund_requested' || $rec['payment_status'] === 'refunded') {
            $pdo->rollBack();
            respond(400, ['success' => false, 'message' => 'Ya existe una solicitud de reembolso en curso']);
        }

        $daysSince = (time() - strtotime($rec['registration_date'])) / 86400;
        if ($daysSince > 7) {
            $pdo->rollBack();
            respond(400, ['success' => false, 'message' => 'El período de 7 días para reembolso ha expirado']);
        }

        $serviceTitle = $rec['title'] ?? 'Curso';
        $amount = $rec['course_price'] ?? null;

    } else {
        // advisory
        $stmt = $pdo->prepare(
            "SELECT a.id, a.user_id, a.created_at, a.status, a.payment_status, a.service_type, a.advisory_service, a.price
             FROM advisories a
             WHERE a.id = ? AND a.user_id = ? AND a.service_type = 'curso'
             LIMIT 1 FOR UPDATE"
        );
        $stmt->execute([$id, $userId]);
        $rec = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$rec) {
            $pdo->rollBack();
            respond(404, ['success' => false, 'message' => 'Asesoría no encontrada']);
        }

        if ($rec['payment_status'] === 'refund_requested' || $rec['payment_status'] === 'refunded') {
            $pdo->rollBack();
            respond(400, ['success' => false, 'message' => 'Ya existe una solicitud de reembolso en curso']);
        }

        $daysSince = (time() - strtotime($rec['created_at'])) / 86400;
        if ($daysSince > 7) {
            $pdo->rollBack();
            respond(400, ['success' => false, 'message' => 'El período de 7 días para reembolso ha expirado']);
        }

        $serviceTitle = $rec['advisory_service'] ? str_replace('_', ' ', $rec['advisory_service']) : 'Curso';
        $amount = $rec['price'] ?? null;
    }

    // Idempotencia con refunds
    $stmt = $pdo->prepare(
        "SELECT id FROM refunds WHERE type = ? AND refundable_id = ? AND user_id = ? AND refund_status = 'pending' LIMIT 1"
    );
    $stmt->execute([$type, $id, $userId]);
    if ($stmt->fetch()) {
        $pdo->rollBack();
        respond(400, ['success' => false, 'message' => 'Ya existe una solicitud de reembolso en curso']);
    }

    // Insert
    $ins = $pdo->prepare(
        "INSERT INTO refunds (user_id, type, refundable_id, service_title, service_name, amount, refund_status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())"
    );
    $ins->execute([$userId, $type, $id, $serviceTitle, null, $amount]);

    $pdo->commit();

    respond(200, ['success' => true, 'message' => 'Solicitud de reembolso enviada']);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Error en refund-request.php: ' . $e->getMessage());
    respond(500, ['success' => false, 'message' => 'No se pudo solicitar el reembolso']);
}

