<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['name']) || !isset($data['email'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Nombre y email requeridos']);
    exit;
}

$name = trim($data['name']);
$email = trim($data['email']);
$phone = isset($data['phone']) ? trim($data['phone']) : '';
$city = isset($data['city']) ? trim($data['city']) : '';

if (empty($name) || empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Nombre y email no pueden estar vacíos']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email no válido']);
    exit;
}

try {
    // Verificar que el email no esté en uso por otro usuario
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
    $stmt->execute([$email, $_SESSION['user_id']]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'El email ya está en uso']);
        exit;
    }

    // Actualizar el perfil
    // Campos opcionales (para no romper el guardado cuando el front solo envía name/email)
    $securityQuestion = isset($data['security_question']) ? trim($data['security_question']) : null;

    // Compatibilidad con typo antiguo en el frontend/back
    $securityAnswer = null;
    if (isset($data['security_answer'])) {
        $securityAnswer = trim($data['security_answer']);
    } elseif (isset($data['sequirity_answer'])) {
        $securityAnswer = trim($data['sequirity_answer']);
    }

    // Actualizar el perfil preservando seguridad si el cliente no envía esos campos
    if ($securityQuestion === null && $securityAnswer === null) {
        $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ? WHERE id = ?");
        $stmt->execute([$name, $email, $_SESSION['user_id']]);
    } else {
        // Intentar actualizar seguridad usando el nombre correcto de columna (security_answer)
        // Si tu columna realmente se llama 'sequirity_answer', ajusta ese nombre en tu BD/consulta.
        $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ?, security_question = ?, security_answer = ? WHERE id = ?");
        $stmt->execute([
            $name,
            $email,
            $securityQuestion ?? '',
            $securityAnswer ?? '',
            $_SESSION['user_id']
        ]);
    }



    // Actualizar la sesión
    $_SESSION['user_name'] = $name;
    $_SESSION['user_email'] = $email;

    echo json_encode([
        'success' => true,
        'message' => 'Perfil actualizado exitosamente',
        'user' => [
            'id' => $_SESSION['user_id'],
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'city' => $city
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
}
?>
