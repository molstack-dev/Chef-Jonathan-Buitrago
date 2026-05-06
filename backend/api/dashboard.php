<?php
$role = $_GET['role'] ?? '';

$validRoles = ['admin', 'seller', 'user'];

if (!in_array($role, $validRoles)) {
    http_response_code(400);
    echo 'Rol inválido';
    exit;
}

$pagePath = "../views/{$role}/{$role}.html";

if (!file_exists($pagePath)) {
    http_response_code(404);
    echo 'Página no encontrada';
    exit;
}

include $pagePath;
?>