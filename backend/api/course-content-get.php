<?php
// course-content-get.php - Obtiene contenido de curso verificando inscripción
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

$course_id = isset($_GET['course_id']) ? intval($_GET['course_id']) : 0;

if (!$course_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'course_id requerido']);
    exit;
}

try {
    // Obtener info del curso
    $stmt = $pdo->prepare('SELECT id, title FROM courses WHERE id = ?');
    $stmt->execute([$course_id]);
    $course = $stmt->fetch();

    if (!$course) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Curso no encontrado']);
        exit;
    }

    // Verificar si el usuario está inscrito (pago aprobado)
    // registrations.client_id une con users.id según el JOIN en inscripciones.php
    $is_enrolled = false;
    if (isset($_SESSION['user_id'])) {
        $stmt = $pdo->prepare('
            SELECT id FROM registrations
            WHERE client_id = ?
            AND course_id = ?
            AND payment_status = "paid"
            AND status != "pending"
        ');
        $stmt->execute([$_SESSION['user_id'], $course_id]);
        $is_enrolled = $stmt->fetch() !== false;
    }

    // Obtener contenido del curso
    $stmt = $pdo->prepare('
        SELECT id, title, description, content_type, video_url, preview_url, duration, order_index
        FROM course_content
        WHERE course_id = ? AND is_active = 1
        ORDER BY order_index ASC, id ASC
    ');
    $stmt->execute([$course_id]);
    $content = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'course' => $course,
        'is_enrolled' => $is_enrolled,
        'content' => $content
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al obtener contenido']);
}
?>
