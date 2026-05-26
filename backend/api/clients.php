<?php
require_once '../cors.php';
header('Content-Type: application/json');

require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM clients ORDER BY created_at DESC");
        $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($clients);
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
    $address = trim($data['address'] ?? '');

    try {
        $stmt = $pdo->prepare("INSERT INTO clients (name, email, phone, address) VALUES (?, ?, ?, ?)");
        $stmt->execute([$name, $email ?: null, $phone ?: null, $address ?: null]);

        $clientId = $pdo->lastInsertId();

        echo json_encode([
            'message' => 'Cliente creado exitosamente',
            'client' => [
                'id' => $clientId,
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'address' => $address
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
    $address = trim($data['address'] ?? '');

    try {
        $stmt = $pdo->prepare("UPDATE clients SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?");
        $stmt->execute([$name ?: null, $email ?: null, $phone ?: null, $address ?: null, $id]);

        echo json_encode(['message' => 'Cliente actualizado exitosamente']);
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
        $stmt = $pdo->prepare("DELETE FROM clients WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode(['message' => 'Cliente eliminado exitosamente']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Error interno del servidor']);
    }
} else {
    http_response_code(405);
    echo json_encode(['message' => 'Método no permitido']);
}
?>