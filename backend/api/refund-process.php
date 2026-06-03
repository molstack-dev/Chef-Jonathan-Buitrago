<?php
// refund-process.php - Procesar solicitudes de reembolso (aprobar/rechazar)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../cors.php';
require_once '../config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

if (!isset($_SESSION['user_id']) || ($_SESSION['role'] ?? null) !== 'admin') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['id']) || !isset($data['type']) || !isset($data['action'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit;
}

$id = intval($data['id']);
$type = trim($data['type']); // 'registration' o 'advisory'
$action = trim($data['action']); // 'approve' o 'reject'

if (!in_array($action, ['approve', 'reject'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Acción inválida']);
    exit;
}

try {
    if ($type === 'registration') {
        // Verificar que existe la solicitud
        $stmt = $pdo->prepare('SELECT id, payment_status FROM registrations WHERE id = ? AND payment_status = ?');
        $stmt->execute([$id, 'refund_requested']);
        $record = $stmt->fetch();

        if (!$record) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Solicitud no encontrada']);
            exit;
        }

        // Aprobar: cambiar status a 'cancelled' y payment_status a 'rejected'
        // Rechazar: volver a 'paid'
        if ($action === 'approve') {
            $stmt = $pdo->prepare('UPDATE registrations SET payment_status = ?, status = ? WHERE id = ?');
            $stmt->execute(['rejected', 'cancelled', $id]);
            $message = 'Reembolso aprobado';
        } else {
            $stmt = $pdo->prepare('UPDATE registrations SET payment_status = ? WHERE id = ?');
            $stmt->execute(['paid', $id]);
            $message = 'Reembolso rechazado';
        }

    } elseif ($type === 'advisory') {
        // Verificar que existe la solicitud
        $stmt = $pdo->prepare('SELECT id, payment_status FROM advisories WHERE id = ? AND payment_status = ?');
        $stmt->execute([$id, 'refund_requested']);
        $record = $stmt->fetch();

        if (!$record) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Solicitud no encontrada']);
            exit;
        }

        if ($action === 'approve') {
            $stmt = $pdo->prepare('UPDATE advisories SET payment_status = ?, status = ? WHERE id = ?');
            $stmt->execute(['rejected', 'cancelled', $id]);
            $message = 'Reembolso aprobado';
        } else {
            $stmt = $pdo->prepare('UPDATE advisories SET payment_status = ? WHERE id = ?');
            $stmt->execute(['paid', $id]);
            $message = 'Reembolso rechazado';
        }
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Tipo inválido']);
        exit;
    }

    echo json_encode(['success' => true, 'message' => $message]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno']);
}
?>