<?php
// Test script to verify document type validation
$validIdTypes = ['Tarjeta de Identidad', 'Cédula de Ciudadanía', 'Cédula de Extranjería', 'Permiso por Protección Temporal (PPT)', 'Pasaporte', 'Otro'];

$testValues = [
    'Tarjeta de Identidad',
    'Cédula de Ciudadanía', 
    'Cédula de Extranjería',
    'Permiso por Protección Temporal (PPT)',
    'Pasaporte',
    'Otro',
    'Invalid Type',
    ''
];

echo "Testing document type validation:\n";
foreach ($testValues as $value) {
    $isValid = in_array($value, $validIdTypes, true);
    echo "Value: '$value' -> " . ($isValid ? 'VALID' : 'INVALID') . "\n";
}
?>