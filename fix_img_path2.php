<?php
require_once 'backend/config.php';

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
$conn->query("UPDATE courses SET image = REPLACE(image, '../img/', '../../img/') WHERE image LIKE '../img/%'");

$result = $conn->query("SELECT id, title, image FROM courses");
while ($row = $result->fetch_assoc()) {
    echo "{$row['id']}: {$row['image']}\n";
}
$conn->close();
echo "Listo";
?>