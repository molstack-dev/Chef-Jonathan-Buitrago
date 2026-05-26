<?php
/**
 * cors.php - Configuración segura de CORS
 * Incluir en todos los endpoints API
 */

// Definir origen permitido (cambiar en producción)
$allowedOrigins = [
    'http://localhost:8000',
    'http://localhost',
    'http://127.0.0.1:8000',
    'http://127.0.0.1'
];

// Obtener el origen de la solicitud
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Validar origen
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}

// Headers CORS
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Max-Age: 3600');

// Manejar preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
?>
