<?php
// config.php - Configuración de la base de datos MySQL (XAMPP)

$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'chef_jonathan';

try {
    // Crear base de datos si no existe (requiere permisos CREATE)
    $pdo_temp = new PDO(
        "mysql:host=$db_host;charset=utf8mb4",
        $db_user,
        $db_pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    $pdo_temp->exec(
        "CREATE DATABASE IF NOT EXISTS `$db_name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    );

    // Conexión final a la BD
    $pdo = new PDO(
        "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4",
        $db_user,
        $db_pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    die("Error de conexión MySQL: " . $e->getMessage());
}
?>
