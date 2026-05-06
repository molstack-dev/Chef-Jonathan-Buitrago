<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM courses ORDER BY created_at DESC");
        $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($courses);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Error interno del servidor']);
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !isset($data['title']) || !isset($data['description']) || !isset($data['price'])) {
        http_response_code(400);
        echo json_encode(['message' => 'Datos incompletos']);
        exit;
    }

    $title = trim($data['title']);
    $description = trim($data['description']);
    $price = $data['price'];
    $duration = $data['duration'] ?? '';
    $category = $data['category'] ?? '';

    try {
        $stmt = $pdo->prepare("INSERT INTO courses (title, description, price, duration, category) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$title, $description, $price, $duration, $category]);

        $courseId = $pdo->lastInsertId();

        echo json_encode([
            'message' => 'Curso creado exitosamente',
            'course' => [
                'id' => $courseId,
                'title' => $title,
                'description' => $description,
                'price' => $price,
                'duration' => $duration,
                'category' => $category
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Error interno del servidor']);
    }
} else {
    http_response_code(405);
    echo json_encode(['message' => 'Método no permitido']);
}
?>