<?php
require 'backend/config.php';
$tables = ['users', 'courses', 'sellers', 'visits', 'registrations', 'sales', 'commissions', 'clients'];

foreach ($tables as $table) {
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        echo "Tabla $table: $count registros\n";
    } catch (Exception $e) {
        echo "Tabla $table: Error - " . $e->getMessage() . "\n";
    }
}
?>