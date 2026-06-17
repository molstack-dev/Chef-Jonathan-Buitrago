<?php
// config.php - Configuración usando PDO (para evitar dependencia de mysqli)

$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'chef_jonathan';

// Crear conexión PDO (mysqlnd debe estar habilitado)
$dsn = "mysql:host={$db_host};charset=utf8mb4";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    // Intentar conectarse (sin seleccionar BD primero) para poder crearla si no existe
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);

    // Crear BD si no existe
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    // Seleccionar BD
    $pdo->exec("USE `{$db_name}`");

    // Asegurar charset
    $pdo->exec("SET NAMES utf8mb4");

} catch (Throwable $e) {
    http_response_code(500);
    die(json_encode(["error" => "Error de conexión: " . $e->getMessage()]));
}
?>

