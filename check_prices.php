<?php
require_once 'backend/config.php';

$stmt = $pdo->query("SELECT id, title, price, category FROM courses ORDER BY id");
$courses = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "=== Cursos en BD ===\n";
foreach ($courses as $c) {
    echo "ID: {$c['id']} | {$c['title']} | Price: {$c['price']} | Category: {$c['category']}\n";
}
?>