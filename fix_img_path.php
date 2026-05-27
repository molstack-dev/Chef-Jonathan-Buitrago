<?php
require_once 'backend/config.php';

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
if ($conn->connect_error) {
    die("Error: " . $conn->connect_error);
}

$conn->query("UPDATE courses SET image = CONCAT('../', image) WHERE image LIKE 'img/%'");

echo "Rutas corregidas a '../img/...'\n";
$result = $conn->query("SELECT id, title, image FROM courses");
while ($row = $result->fetch_assoc()) {
    echo "ID {$row['id']}: {$row['image']}\n";
}

$conn->close();
?>