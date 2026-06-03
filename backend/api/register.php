<?php
require_once '../cors.php';
header('Content-Type: application/json');

require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Método no permitido']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['name']) || !isset($data['email']) || !isset($data['password']) || !isset($data['security_question']) || !isset($data['security_answer'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Datos incompletos']);
    exit;
}

$name = trim($data['name']);
$email = trim($data['email']);
$password = $data['password'];
$security_question = trim($data['security_question']);
$security_answer = trim($data['security_answer']);

if (empty($name) || empty($email) || empty($password) || empty($security_question) || empty($security_answer)) {
    http_response_code(400);
    echo json_encode(['message' => 'Todos los campos son requeridos']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['message' => 'Email inválido']);
    exit;
}

// Validar fortaleza de contraseña
function validatePassword($password) {
    $errors = [];

    if (strlen($password) < 8) {
        $errors[] = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (!preg_match('/[A-Z]/', $password)) {
        $errors[] = 'La contraseña debe tener al menos una mayúscula';
    }

    if (!preg_match('/[!@#$%^&*(),.?":{}|<>]/', $password)) {
        $errors[] = 'La contraseña debe tener al menos un carácter especial';
    }

    // Verificar secuencias numéricas (más de 2 números consecutivos)
    if (preg_match_all('/\d+/', $password, $matches)) {
        foreach ($matches[0] as $numSeq) {
            $len = strlen($numSeq);
            if ($len > 2) {
                // Verificar si es una secuencia ascendente o descendente
                $isSequence = true;
                for ($i = 0; $i < $len - 1; $i++) {
                    $diff = intval($numSeq[$i + 1]) - intval($numSeq[$i]);
                    if ($i === 0) {
                        $expectedDiff = $diff;
                    } elseif ($diff !== $expectedDiff || abs($diff) !== 1) {
                        $isSequence = false;
                        break;
                    }
                }
                if ($isSequence && abs($expectedDiff) === 1) {
                    $errors[] = 'La contraseña no puede contener secuencias numéricas (123, 456, 789)';
                    break;
                }
            }
        }
    }

    return $errors;
}

$passwordErrors = validatePassword($password);
if (count($passwordErrors) > 0) {
    http_response_code(400);
    echo json_encode(['message' => $passwordErrors[0]]);
    exit;
}

try {
    // Verificar si el usuario ya existe
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['message' => 'El usuario ya existe']);
        exit;
    }

    // Crear hash de la contraseña
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insertar nuevo usuario
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, security_question, security_answer) VALUES (?, ?, ?, 'user', ?, ?)");
    $stmt->execute([$name, $email, $hashedPassword, $security_question, strtolower($security_answer)]);

    $userId = $pdo->lastInsertId();

    echo json_encode([
        'message' => 'Usuario registrado exitosamente',
        'user' => [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'role' => 'user'
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Error interno del servidor']);
}
?>