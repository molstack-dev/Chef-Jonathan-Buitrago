<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Verificar que el usuario esté logueado
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $user_id = $_SESSION['user_id'];

        // Obtener certificados del usuario
        $stmt = $pdo->prepare("
            SELECT 
                c.id as certificate_id,
                c.certificate_number,
                c.issue_date,
                c.expiry_date,
                c.is_valid,
                cr.title as course_title,
                cr.duration as course_duration,
                COALESCE(r.registration_date, c.issue_date) as completion_date
            FROM certificates c
            JOIN courses cr ON c.course_id = cr.id
            LEFT JOIN registrations r ON c.registration_id = r.id
            WHERE c.user_id = ? AND c.is_valid = 1
            ORDER BY c.issue_date DESC
        ");
        $stmt->execute([$user_id]);
        $certificates = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $certificates
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al obtener certificados: ' . $e->getMessage()
        ]);
    }
    exit;
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Endpoint para emitir un nuevo certificado
    try {
        $user_id = $_SESSION['user_id'];
        $input = json_decode(file_get_contents('php://input'), true);
        
        $course_id = $input['course_id'] ?? null;
        $registration_id = $input['registration_id'] ?? null;
        $issue_date = $input['issue_date'] ?? date('Y-m-d H:i:s');
        $expiry_date = $input['expiry_date'] ?? null;
        
        if (!$course_id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Course ID es requerido']);
            exit;
        }

        // Verificar que el usuario haya completado el curso o tenga derecho al certificado
        if ($registration_id) {
            $checkStmt = $pdo->prepare("
                SELECT r.id, r.client_id, r.course_id
                FROM registrations r 
                WHERE r.client_id = ? AND r.course_id = ? AND r.id = ? AND r.status = 'completed'
            ");
            $checkStmt->execute([$user_id, $course_id, $registration_id]);
            $validRegistration = $checkStmt->fetch();
            
            if (!$validRegistration) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'No autorizado para emitir este certificado']);
                exit;
            }
        } else {
            // Si no se proporciona registration_id, verificar si el usuario completó el curso de otra manera
            // En este caso, no se puede verificar el número de personas, así que permitimos la emisión
        }

        // Generar número único de certificado
        $certificate_number = 'CERT-' . strtoupper(substr(uniqid(), -8)) . '-' . date('Y');
        
        // Insertar el certificado
        $stmt = $pdo->prepare("
            INSERT INTO certificates (user_id, course_id, registration_id, certificate_number, issue_date, expiry_date, is_valid)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $result = $stmt->execute([$user_id, $course_id, $registration_id, $certificate_number, $issue_date, $expiry_date, 1]);

        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Certificado emitido exitosamente',
                'certificate_id' => $pdo->lastInsertId(),
                'certificate_number' => $certificate_number
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al emitir el certificado'
            ]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al emitir certificado: ' . $e->getMessage()
        ]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['message' => 'Método no permitido']);
?>