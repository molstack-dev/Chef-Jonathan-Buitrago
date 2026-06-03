<?php
header('Content-Type: application/json; charset=utf-8');

$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'chef_jonathan';

echo "=== TEST DE CONEXIÓN MySQL ===\n\n";

// 1. Probar conexión básica
echo "1. Conectando a MySQL (sin BD)...\n";
try {
    $mysqli = new mysqli($db_host, $db_user, $db_pass);
    
    if ($mysqli->connect_error) {
        echo "   ❌ Error: " . $mysqli->connect_error . "\n";
        die();
    }
    echo "   ✓ Conexión exitosa\n";
    echo "   ✓ Server Version: " . $mysqli->server_info . "\n\n";
    
    // 2. Crear BD
    echo "2. Creando BD chef_jonathan...\n";
    $result = $mysqli->query("CREATE DATABASE IF NOT EXISTS chef_jonathan");
    if ($result) {
        echo "   ✓ BD creada o ya existe\n\n";
    } else {
        echo "   ❌ Error: " . $mysqli->error . "\n";
    }
    
    // 3. Seleccionar BD
    echo "3. Seleccionando BD...\n";
    if ($mysqli->select_db($db_name)) {
        echo "   ✓ BD seleccionada\n\n";
    } else {
        echo "   ❌ Error: " . $mysqli->error . "\n";
        die();
    }
    
    // 4. Crear tabla users
    echo "4. Creando tabla users...\n";
    $sql = "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin','user') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    
    if ($mysqli->query($sql)) {
        echo "   ✓ Tabla users creada\n\n";
    } else {
        echo "   ❌ Error: " . $mysqli->error . "\n";
    }
    
    // 5. Verificar si hay datos
    echo "5. Verificando datos en users...\n";
    $result = $mysqli->query("SELECT COUNT(*) as count FROM users");
    $row = $result->fetch_assoc();
    $count = $row['count'] ?? 0;
    echo "   Registros: $count\n\n";
    
    if ($count == 0) {
        echo "6. Insertando datos de prueba...\n";
        
        $password = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt = $mysqli->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
        $role = 'admin';
        $stmt->bind_param("ssss", $name, $email, $password, $role);
        
        $name = "Administrador";
        $email = "admin@chefjonathan.com";
        $stmt->execute();
        
        echo "   ✓ Usuario admin@chefjonathan.com creado\n";
        echo "   ✓ Contraseña: admin123\n\n";
    }
    
    echo "=== ✓ TODO FUNCIONANDO ===" . "\n";
    echo "\nAccede a:\n";
    echo "  • phpMyAdmin: http://localhost/phpmyadmin/\n";
    echo "  • Aplicación: http://localhost/Chef-Jonathan-Buitrago/\n";
    echo "  • Login con: admin@chefjonathan.com / admin123\n";
    
    $mysqli->close();
    
} catch (Exception $e) {
    echo "❌ Excepción: " . $e->getMessage() . "\n";
}
?>
