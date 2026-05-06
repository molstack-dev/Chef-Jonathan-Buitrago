<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM sellers ORDER BY created_at DESC");
        $sellers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($sellers);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Error interno del servidor']);
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !isset($data['name'])) {
        http_response_code(400);
        echo json_encode(['message' => 'Nombre requerido']);
        exit;
    }

    $name = trim($data['name']);
    $email = trim($data['email'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $commission_rate = $data['commission_rate'] ?? 0;

    try {
        $stmt = $pdo->prepare("INSERT INTO sellers (name, email, phone, commission_rate) VALUES (?, ?, ?, ?)");
        $stmt->execute([$name, $email, $phone, $commission_rate]);

        $sellerId = $pdo->lastInsertId();

        echo json_encode([
            'message' => 'Trabajador creado exitosamente',
            'seller' => [
                'id' => $sellerId,
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'commission_rate' => $commission_rate
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Error interno del servidor']);
    }
} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !isset($data['id'])) {
        http_response_code(400);
        echo json_encode(['message' => 'ID requerido']);
        exit;
    }

    $id = $data['id'];
    $name = trim($data['name'] ?? '');
    $email = trim($data['email'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $commission_rate = $data['commission_rate'] ?? 0;

    try {
        $stmt = $pdo->prepare("UPDATE sellers SET name = ?, email = ?, phone = ?, commission_rate = ? WHERE id = ?");
        $stmt->execute([$name, $email, $phone, $commission_rate, $id]);

        echo json_encode(['message' => 'Trabajador actualizado exitosamente']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Error interno del servidor']);
    }
} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !isset($data['id'])) {
        http_response_code(400);
        echo json_encode(['message' => 'ID requerido']);
        exit;
    }

    $id = $data['id'];

    try {
        $stmt = $pdo->prepare("DELETE FROM sellers WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode(['message' => 'Trabajador eliminado exitosamente']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Error interno del servidor']);
    }
} else {
    http_response_code(405);
    echo json_encode(['message' => 'Método no permitido']);
}
?>