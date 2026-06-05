<?php
require_once 'backend/config.php';

echo "Conectando a $db_name...<br>";

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
if ($conn->connect_error) {
    die("Error: " . $conn->connect_error);
}

// Corregir rutas de imagen
$conn->query("UPDATE courses SET image = REPLACE(image, 'img/', '../img/') WHERE image LIKE 'img/%'");

echo "Rutas actualizadas. Verificando:<br>";
$result = $conn->query("SELECT id, title, image FROM courses");
while ($row = $result->fetch_assoc()) {
    echo "ID {$row['id']}: {$row['title']}<br>";
    echo "&nbsp;&nbsp;Imagen: {$row['image']}<br>";
}

$conn->close();
echo "Listo!";
?>