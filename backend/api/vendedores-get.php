<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config.php';

try {
    $stmt = $pdo->query("SELECT id, name, email, phone, commission_rate, created_at FROM sellers ORDER BY created_at DESC");
    $sellers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $sellers
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener vendedores: ' . $e->getMessage()
    ]);
}
?>
