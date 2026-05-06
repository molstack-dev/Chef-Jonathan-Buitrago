<?php
/**
 * Simple SQLite Database Viewer
 * Visualiza todos los datos de la base de datos
 */

require_once 'config.php';

$table = $_GET['table'] ?? '';
$tables = ['users', 'clients', 'sellers', 'courses', 'sales', 'commissions', 'visits', 'registrations'];

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visualizador de Base de Datos</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            background: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header h1 {
            color: #333;
            margin-bottom: 20px;
        }
        .tabs {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 10px;
        }
        .tab-btn {
            padding: 10px 15px;
            border: none;
            background: #f0f0f0;
            color: #333;
            cursor: pointer;
            border-radius: 5px;
            font-weight: 500;
            transition: all 0.3s;
        }
        .tab-btn:hover {
            background: #ddd;
        }
        .tab-btn.active {
            background: #667eea;
            color: white;
        }
        .content {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th {
            background: #667eea;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        tr:nth-child(even) {
            background: #f9f9f9;
        }
        tr:hover {
            background: #f0f0f0;
        }
        td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
            word-break: break-word;
            max-width: 300px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        .stat-card h3 {
            font-size: 28px;
            margin-bottom: 5px;
        }
        .stat-card p {
            font-size: 12px;
            opacity: 0.9;
        }
        .no-data {
            text-align: center;
            color: #999;
            padding: 40px;
        }
        .footer {
            text-align: center;
            color: white;
            margin-top: 20px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Visualizador de Base de Datos - Chef Jonathan</h1>
            <div class="tabs">
                <?php foreach ($tables as $t): ?>
                    <a href="?table=<?= $t ?>" style="text-decoration: none;">
                        <button class="tab-btn <?= ($table === $t) ? 'active' : '' ?>">
                            <?= ucfirst($t) ?>
                        </button>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>

        <div class="content">
            <?php
            if (empty($table) || !in_array($table, $tables)) {
                // Mostrar resumen de estadísticas
                echo '<h2>📈 Resumen de Base de Datos</h2>';
                echo '<div class="stats">';
                
                foreach ($tables as $t) {
                    try {
                        $stmt = $pdo->query("SELECT COUNT(*) as count FROM $t");
                        $result = $stmt->fetch(PDO::FETCH_ASSOC);
                        $count = $result['count'];
                        echo "<div class='stat-card'>
                            <h3>$count</h3>
                            <p>" . ucfirst($t) . "</p>
                        </div>";
                    } catch (Exception $e) {
                        echo "<div class='stat-card'><h3>0</h3><p>" . ucfirst($t) . "</p></div>";
                    }
                }
                echo '</div>';
            } else {
                // Mostrar tabla específica
                try {
                    echo '<h2>' . ucfirst($table) . '</h2>';
                    
                    // Contar registros
                    $countStmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
                    $count = $countStmt->fetch(PDO::FETCH_ASSOC)['count'];
                    echo "<p style='color: #666; margin: 10px 0;'>Total de registros: <strong>$count</strong></p>";
                    
                    // Obtener datos
                    $stmt = $pdo->query("SELECT * FROM $table LIMIT 100");
                    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    if (empty($data)) {
                        echo '<div class="no-data">No hay datos en esta tabla</div>';
                    } else {
                        echo '<table>';
                        // Headers
                        echo '<thead><tr>';
                        foreach (array_keys($data[0]) as $key) {
                            echo '<th>' . htmlspecialchars($key) . '</th>';
                        }
                        echo '</tr></thead>';
                        
                        // Datos
                        echo '<tbody>';
                        foreach ($data as $row) {
                            echo '<tr>';
                            foreach ($row as $cell) {
                                $display = strlen($cell) > 50 ? substr($cell, 0, 50) . '...' : $cell;
                                echo '<td title="' . htmlspecialchars($cell) . '">' . htmlspecialchars($display) . '</td>';
                            }
                            echo '</tr>';
                        }
                        echo '</tbody>';
                        echo '</table>';
                    }
                } catch (Exception $e) {
                    echo '<p style="color: red;">Error: ' . htmlspecialchars($e->getMessage()) . '</p>';
                }
            }
            ?>
        </div>

        <div class="footer">
            <p>SQLite Database Viewer | Chef Jonathan Buitrago</p>
        </div>
    </div>
</body>
</html>