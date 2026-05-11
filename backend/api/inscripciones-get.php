<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config.php';

try {
    $stmt = $pdo->query("
        SELECT 
            r.id,
            u.name as user_name,
            c.title as course_title,
            r.status,
            r.registration_date
        FROM registrations r
        JOIN users u ON r.client_id = u.id
        JOIN courses c ON r.course_id = c.id
        ORDER BY r.registration_date DESC
    ");
    $registrations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $registrations
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener inscripciones: ' . $e->getMessage()
    ]);
}
?>
