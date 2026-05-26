<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config.php';

try {
    $stmt = $pdo->query("
        SELECT 
            s.id,
            c.name as client_name,
            co.title as course_title,
            s.amount,
            s.date
        FROM sales s
        JOIN clients c ON s.client_id = c.id
        JOIN courses co ON s.course_id = co.id
        ORDER BY s.date DESC
    ");
    $sales = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $sales
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener ventas: ' . $e->getMessage()
    ]);
}
?>
