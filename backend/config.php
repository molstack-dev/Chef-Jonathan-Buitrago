<?php
// config.php - Configuración de la base de datos
// Usar SQLite para desarrollo local (funciona con PHP por defecto sin extensiones adicionales)

$db_file = __DIR__ . '/chef_jonathan.sqlite3';

try {
    $pdo = new PDO("sqlite:$db_file");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Error de conexión: " . $e->getMessage());
}
?>