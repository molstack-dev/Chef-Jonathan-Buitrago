<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM courses ORDER BY created_at DESC");
        $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode([
            'success' => true,
            'data' => $courses
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
    }
} elseif ($method === 'POST') {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    // Manejar multipart (upload de archivo)
    if (strpos($contentType, 'multipart/form-data') !== false) {
        $title = trim($_POST['title'] ?? '');
        $description = trim($_POST['description'] ?? '');
        $descriptionDetail = trim($_POST['description_detail'] ?? '');
        $price = $_POST['price'] ?? '';
        $duration = $_POST['duration'] ?? '';
        $category = $_POST['category'] ?? '';
        $imageUrlRef = trim($_POST['image_url'] ?? '');

        $image = $imageUrlRef;
        $newImageSent = false;

        // Procesar archivo si se subió
        if (isset($_FILES['image']) && $_FILES['image']['error'] === 0) {
            $file = $_FILES['image'];
            $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (in_array($file['type'], $allowed)) {
                $data = file_get_contents($file['tmp_name']);
                $image = 'data:' . $file['type'] . ';base64,' . base64_encode($data);
                $newImageSent = true;
            }
        }
    } else {
        // JSON normal
        $data = json_decode(file_get_contents('php://input'), true);
        $title = trim($data['title'] ?? '');
        $description = trim($data['description'] ?? '');
        $descriptionDetail = trim($data['description_detail'] ?? '');
        $price = $data['price'] ?? '';
        $duration = $data['duration'] ?? '';
        $category = $data['category'] ?? '';
        $imageUrlRef = trim($data['image'] ?? '');
        $image = $imageUrlRef;
        $newImageSent = !empty($imageUrlRef);
    }

    // Update existing course
    if (isset($_POST['id']) || isset($data['id'])) {
        $id = $_POST['id'] ?? $data['id'];

        // Si no se envió nueva imagen, conservar la existente
        if (!$newImageSent) {
            // Si image_url tiene valor (imagen actual), usarla
            if (!empty($imageUrlRef)) {
                $image = $imageUrlRef;
            } else {
                // Buscar la imagen actual en la BD
                $stmtGet = $pdo->prepare("SELECT image FROM courses WHERE id = ?");
                $stmtGet->execute([$id]);
                $oldCourse = $stmtGet->fetch(PDO::FETCH_ASSOC);
                if ($oldCourse && !empty($oldCourse['image'])) {
                    $image = $oldCourse['image'];
                }
            }
        }

        try {
            $stmt = $pdo->prepare("UPDATE courses SET title = ?, description = ?, description_detail = ?, price = ?, duration = ?, category = ?, image = ? WHERE id = ?");
            $stmt->execute([$title, $description, $descriptionDetail, $price, $duration, $category, $image, $id]);
            echo json_encode(['success' => true, 'message' => 'Curso actualizado exitosamente']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error al actualizar']);
        }
        exit;
    }

    // Create new course
    if (!$title || !$price) {
        http_response_code(400);
        echo json_encode(['message' => 'Datos incompletos']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO courses (title, description, description_detail, price, duration, category, image) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$title, $description, $descriptionDetail, $price, $duration, $category, $image]);
        $courseId = $pdo->lastInsertId();
        echo json_encode([
            'success' => true,
            'message' => 'Curso creado exitosamente',
            'data' => [
                'id' => $courseId,
                'title' => $title,
                'description' => $description,
                'description_detail' => $descriptionDetail,
                'price' => $price,
                'duration' => $duration,
                'category' => $category,
                'image' => $image
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Error interno del servidor']);
    }
} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(['message' => 'ID requerido']);
        exit;
    }

    $id = $data['id'];

    try {
        $stmt = $pdo->prepare("DELETE FROM courses WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode(['success' => true, 'message' => 'Curso eliminado exitosamente']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Error al eliminar']);
    }
} else {
    http_response_code(405);
    echo json_encode(['message' => 'Método no permitido']);
}
?>