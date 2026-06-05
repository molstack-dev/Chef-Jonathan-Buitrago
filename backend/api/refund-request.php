<?php
// refund-request.php - Solicitar reembolso de un curso
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

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['id']) || !isset($data['type'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit;
}

$id = intval($data['id']);
$type = trim($data['type']); // 'registration' o 'advisory'

// Solo permitir solicitudes propias (usuario logueado)
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Debe iniciar sesión']);
    exit;
}

$userId = $_SESSION['user_id'];

// Verificar que el usuario puede solicitar reembolso
// Solo cursos (service_type = 'curso') y dentro de 7 días

try {
    if ($type === 'registration') {
        // Verificar inscripción
        $stmt = $pdo->prepare('
            SELECT r.id, r.created_at, r.status, r.payment_status, c.title as course_title
            FROM registrations r
            JOIN courses c ON r.course_id = c.id
            WHERE r.id = ? AND r.client_id = ?
        ');
        $stmt->execute([$id, $userId]);
        $record = $stmt->fetch();

        if (!$record) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Inscripción no encontrada']);
            exit;
        }

        // Verificar estado (solo confirmed o completed)
        if (!in_array($record['status'], ['confirmed', 'completed'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No se puede solicitar reembolso para este estado']);
            exit;
        }

        // Verificar 7 días
        $createdAt = strtotime($record['created_at']);
        $daysSince = (time() - $createdAt) / (60 * 60 * 24);
        if ($daysSince > 7) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El período de 7 días para reembolso ha expirado']);
            exit;
        }

        // Verificar que no ya tiene solicitud de reembolso pendiente
        // (podríamos añadir una tabla refund_requests, por ahora solo cambiamos estado)
        if ($record['payment_status'] === 'refund_requested') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Ya existe una solicitud de reembolso pendiente']);
            exit;
        }

        // Actualizar estado a refund_requested
        $stmt = $pdo->prepare('UPDATE registrations SET payment_status = ? WHERE id = ?');
        $stmt->execute(['refund_requested', $id]);

        echo json_encode(['success' => true, 'message' => 'Solicitud de reembolso enviada para: ' . $record['course_title']]);
        exit;

    } elseif ($type === 'advisory') {
        // Verificar asesoría
        $stmt = $pdo->prepare('
            SELECT a.id, a.created_at, a.status, a.payment_status, a.service_type
            FROM advisories a
            WHERE a.id = ? AND a.user_id = ?
        ');
        $stmt->execute([$id, $userId]);
        $record = $stmt->fetch();

        if (!$record) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Asesoría no encontrada']);
            exit;
        }

        // Solo asesorías de tipo curso (service_type = 'curso')
        if ($record['service_type'] !== 'curso') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Solo se permiten reembolsos para cursos']);
            exit;
        }

        // Verificar 7 días
        $createdAt = strtotime($record['created_at']);
        $daysSince = (time() - $createdAt) / (60 * 60 * 24);
        if ($daysSince > 7) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El período de 7 días para reembolso ha expirado']);
            exit;
        }

        // Actualizar estado
        $stmt = $pdo->prepare('UPDATE advisories SET payment_status = ? WHERE id = ?');
        $stmt->execute(['refund_requested', $id]);

        echo json_encode(['success' => true, 'message' => 'Solicitud de reembolso enviada']);
        exit;
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Tipo inválido']);
    exit;

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno']);
}
?>