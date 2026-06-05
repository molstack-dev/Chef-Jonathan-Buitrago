<?php
header('Content-Type: text/html; charset=utf-8');

// Sanitizar y validar el rol solicitado
$role = $_GET['role'] ?? '';
$validRoles = ['admin', 'user'];

if (empty($role) || !in_array($role, $validRoles)) {
    http_response_code(400);
    die('Rol inválido. Roles permitidos: ' . implode(', ', $validRoles));
}

// Construir la ruta de forma segura
$basePath = __DIR__;
$pagePath = realpath($basePath . "/../views/$role/{$role}.html");

// Verificar que la ruta esté dentro del directorio permitido
$allowedDir = realpath($basePath . '/../views');
if ($pagePath === false || strpos($pagePath, $allowedDir) !== 0) {
    http_response_code(403);
    die('Acceso denegado: ruta no permitida');
}

if (!file_exists($pagePath)) {
    http_response_code(404);
    die('Página no encontrada: ' . htmlspecialchars($role));
}

// Incluir la página de forma segura
include $pagePath;
?>