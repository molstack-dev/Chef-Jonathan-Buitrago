<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config.php';

try {
    $stmt = $pdo->query("
        SELECT 
            v.id,
            c.name as client_name,
            v.date,
            v.notes
        FROM visits v
        JOIN clients c ON v.client_id = c.id
        ORDER BY v.date DESC
    ");
    $visits = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $visits
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener visitas: ' . $e->getMessage()
    ]);
}
?>
