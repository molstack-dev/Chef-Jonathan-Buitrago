<?php
// config.php - Configuración usando PDO (compatible con Windows/Linux/macOS)
//
// Soporta configuración por variables de entorno (getenv) y mantiene defaults
// para compatibilidad con tu setup actual (XAMPP local).

// Rutas (por ahora no se usa, pero queda listo si necesitas paths base)
// $BASE_DIR = __DIR__;


// MySQL / PDO (defaults actuales)
$db_host = getenv('DB_HOST') !== false ? getenv('DB_HOST') : '127.0.0.1';
$db_user = getenv('DB_USER') !== false ? getenv('DB_USER') : 'root';
$db_pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';
$db_name = getenv('DB_NAME') !== false ? getenv('DB_NAME') : 'chef_jonathan';

// Opcional: charset (por defecto utf8mb4)
$db_charset = getenv('DB_CHARSET') !== false ? getenv('DB_CHARSET') : 'utf8mb4';

// Opcional: collation
$db_collation = getenv('DB_COLLATION') !== false ? getenv('DB_COLLATION') : 'utf8mb4_unicode_ci';

// Opcional: driver/flags
$db_options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    // Intentar conectarse (sin seleccionar BD primero) para poder crearla si no existe
    // Nota: el DSN no incluye dbname para permitir CREATE DATABASE.
    $dsn = "mysql:host={$db_host};charset={$db_charset}";

    $pdo = new PDO($dsn, $db_user, $db_pass, $db_options);

    // Crear BD si no existe
    $pdo->exec(
        "CREATE DATABASE IF NOT EXISTS `" . str_replace('`', '``', $db_name) .
        "` CHARACTER SET {$db_charset} COLLATE {$db_collation}"
    );

    // Seleccionar BD
    $pdo->exec("USE `" . str_replace('`', '``', $db_name) . "`");

    // Asegurar charset
    $pdo->exec("SET NAMES {$db_charset}");

} catch (Throwable $e) {
    // Si se consulta desde endpoints web, devolvemos JSON para que no reviente el frontend.
    // Si se usa desde CLI, igual se ve el error.
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    die(json_encode(["error" => "Error de conexión: " . $e->getMessage()]));
}
?>

