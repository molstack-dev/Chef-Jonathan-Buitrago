<?php
// config.php - Configuración usando MySQLi (compatible con código existente)

$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'chef_jonathan';

class PDOCompat {
    private $mysqli;
    private $lastInsertId = 0;
    
    public function __construct($mysqli) {
        $this->mysqli = $mysqli;
    }
    
    public function prepare($sql) {
        $stmt = $this->mysqli->prepare($sql);
        if (!$stmt) {
            throw new Exception("Error preparando consulta: " . $this->mysqli->error);
        }
        return new MySQLiStatement($stmt);
    }
    
    public function query($sql) {
        $result = $this->mysqli->query($sql);
        if (!$result) {
            throw new Exception("Error en consulta: " . $this->mysqli->error);
        }
        return new MySQLiResult($result);
    }
    
    public function exec($sql) {
        return $this->query($sql);
    }
    
    public function lastInsertId() {
        return $this->mysqli->insert_id;
    }
}

class MySQLiStatement {
    private $stmt;
    
    public function __construct($stmt) {
        $this->stmt = $stmt;
    }
    
    public function execute($params = []) {
        if (!empty($params)) {
            $types = str_repeat('s', count($params));
            $this->stmt->bind_param($types, ...$params);
        }
        return $this->stmt->execute();
    }
    
    public function fetch($mode = null) {
        $result = $this->stmt->get_result();
        if (!$result) return false;
        return $result->fetch_assoc();
    }
    
    public function fetchAll($mode = null) {
        $result = $this->stmt->get_result();
        if (!$result) return [];
        return $result->fetch_all(MYSQLI_ASSOC);
    }
    
    public function fetchColumn($col = 0) {
        $result = $this->stmt->get_result();
        if (!$result) return null;
        $row = $result->fetch_assoc();
        if (!$row) return null;
        $values = array_values($row);
        return $values[$col] ?? null;
    }
}

class MySQLiResult {
    private $result;
    
    public function __construct($result) {
        $this->result = $result;
    }
    
    public function fetch($mode = null) {
        return $this->result->fetch_assoc();
    }
    
    public function fetchAll($mode = null) {
        return $this->result->fetch_all(MYSQLI_ASSOC);
    }
    
    public function fetchColumn($col = 0) {
        $row = $this->result->fetch_assoc();
        if (!$row) return null;
        $values = array_values($row);
        return $values[$col] ?? null;
    }
}

try {
    $mysqli = new mysqli($db_host, $db_user, $db_pass);
    
    if ($mysqli->connect_error) {
        throw new Exception("Conexión fallida: " . $mysqli->connect_error);
    }

    // Crear base de datos si no existe
    $mysqli->query("CREATE DATABASE IF NOT EXISTS `$db_name`");
    
    // Seleccionar BD
    if (!$mysqli->select_db($db_name)) {
        throw new Exception("Error seleccionando BD: " . $mysqli->error);
    }

    // Configurar charset
    $mysqli->set_charset("utf8mb4");
    
    // Crear wrapper compatible con PDO
    $pdo = new PDOCompat($mysqli);
    
    // Crear tabla de usuarios
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin','seller','user') NOT NULL DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    
} catch (Exception $e) {
    http_response_code(500);
    die(json_encode(["error" => "Error de conexión: " . $e->getMessage()]));
}
?>
