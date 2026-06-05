<?php
// refunds-get.php - Listar solicitudes de reembolso pendientes
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config.php';

session_start();

if (!isset($_SESSION['user_id']) || ($_SESSION['role'] ?? null) !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

try {
    // Obtener inscripciones con reembolso solicitado (cursos)
    $stmt = $pdo->prepare("
        SELECT r.id, r.client_id, r.course_id, r.status as registration_status, r.payment_status, r.registration_date,
               c.title as course_title, c.price as course_price,
               u.name as client_name, u.email as client_email,
               'registration' as source
        FROM registrations r
        JOIN courses c ON r.course_id = c.id
        JOIN users u ON r.client_id = u.id
        WHERE r.payment_status = 'refund_requested'
        ORDER BY r.registration_date DESC
    ");
    $stmt->execute();
    $registration_refunds = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Obtener asesorías con reembolso solicitado (cursos)
    $stmt = $pdo->prepare("
        SELECT a.id, a.user_id, a.service_type, a.advisory_service, a.status as advisory_status, a.payment_status, a.created_at,
               a.advisory_service as service_name, a.price,
               u.name as client_name, u.email as client_email,
               'advisory' as source
        FROM advisories a
        JOIN users u ON a.user_id = u.id
        WHERE a.payment_status = 'refund_requested' AND a.advisory_service = 'curso'
        ORDER BY a.created_at DESC
    ");
    $stmt->execute();
    $advisory_refunds = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Combinar y ordenar
    $refunds = array_merge($registration_refunds, $advisory_refunds);
    usort($refunds, function($a, $b) {
        return strtotime($b['registration_date'] ?? $b['created_at']) - strtotime($a['registration_date'] ?? $a['created_at']);
    });

    echo json_encode([
        'success' => true,
        'data' => $refunds
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al obtener reembolsos']);
}
?>