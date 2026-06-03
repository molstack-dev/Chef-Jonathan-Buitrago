# Configuración de Sendmail en XAMPP

## Problema
Por defecto, la función `mail()` de PHP en XAMPP no funciona porque no hay un servidor SMTP configurado.

## Solución 1: Sendmail (Recomendado para emails locales)

### Paso 1: Descargar Sendmail
1. Descarga Sendmail desde: https://www.glob.com.au/sendmail/
2. Descomprime el archivo en `C:\xampp\sendmail`

### Paso 2: Configurar sendmail.ini
Edita `C:\xampp\sendmail\sendmail.ini`:

```ini
[sendmail]
; Agrega tu servidor SMTP
smtp_server=smtp.gmail.com
smtp_port=587
smtp_ssl=starttls

; Tus credenciales (usa password de aplicación)
auth_username=tu-email@gmail.com
auth_password=tu-password-de-app

; From
from_email=tu-email@gmail.com
from_name=Chef Jonathan Buitrago

; Debug (0 = producción, 1 = desarrollo)
debug_output=1
```

### Paso 3: Configurar php.ini
Edita `C:\xampp\php\php.ini`:

```ini
[mail function]
SMTP=localhost
smtp_port=25
sendmail_from=noreply@chefjonathan.com
sendmail_path="C:\xampp\sendmail\sendmail.exe -t"
```

### Paso 4: Reiniciar Apache
Desde XAMPP Control Panel, detén y reinicia Apache.

---

## Solución 2: PHPMailer (Recomendado para producción)

PHPMailer es más robusto y funciona con Gmail, Outlook, etc.

### Instalación
1. Descarga PHPMailer desde: https://github.com/PHPMailer/PHPMailer
2. Copia los archivos a `backend/phpmailer/`:
   - `PHPMailer.php`
   - `SMTP.php`
   - `Exception.php`

### Uso con Gmail
```php
require_once '../phpmailer/PHPMailer.php';
require_once '../phpmailer/SMTP.php';
require_once '../phpmailer/Exception.php';

$mail = new PHPMailer\PHPMailer\PHPMailer(true);
$mail->isSMTP();
$mail->Host = 'smtp.gmail.com';
$mail->SMTPAuth = true;
$mail->Username = 'tu-email@gmail.com';
$mail->Password = 'tu-password-de-app'; // Password de aplicación
$mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
$mail->Port = 587;
$mail->setFrom('noreply@chefjonathan.com', 'Chef Jonathan Buitrago');
$mail->addAddress($email);
$mail->isHTML(true);
$mail->Subject = $subject;
$mail->Body = $message;
$mail->send();
```

### Crear Password de Aplicación en Gmail
1. Ve a: https://myaccount.google.com/security
2. Busca "Contraseñas de aplicaciones" (en Segundad)
3. Crea una nueva contraseña de aplicación
4. Usa esa contraseña en el código

---

## Solución 3: Mailtrap (Para desarrollo sin emails reales)

### Registro
1. Regístrate gratis en: https://mailtrap.io
2. Crea un nuevo proyecto "Chef Jonathan"

### Configuración
```php
$mail->isSMTP();
$mail->Host = 'smtp.mailtrap.io';
$mail->SMTPAuth = true;
$mail->Username = 'tu-usuario-mailtrap';
$mail->Password = 'tu-password-mailtrap';
$mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
$mail->Port = 587;
```

Todos los emails enviados aparecerán en tu bandeja de Mailtrap.

---

## Verificar configuración

Ejecuta `check_data.php` para verificar que el sistema de email funciona:
```
http://localhost/Chef-Jonathan-Buitrago/check_data.php
```