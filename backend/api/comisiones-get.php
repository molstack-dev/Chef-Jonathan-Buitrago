<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config.php';

try {
    $stmt = $pdo->query("
        SELECT 
            com.id,
            s.id as sale_id,
            sel.name as seller_name,
            c.name as client_name,
            co.title as course_title,
            s.amount as sale_amount,
            com.amount as commission_amount,
            com.date
        FROM commissions com
        JOIN sales s ON com.sale_id = s.id
        JOIN sellers sel ON com.seller_id = sel.id
        JOIN clients c ON s.client_id = c.id
        JOIN courses co ON s.course_id = co.id
        ORDER BY com.date DESC
    ");
    $commissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $commissions
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener comisiones: ' . $e->getMessage()
    ]);
}
?>
