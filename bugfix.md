# Bugfix Requirements Document

## Introduction

Este documento describe los errores en la conexión entre el frontend y backend del sistema de gestión de cursos Chef Jonathan Buitrago. El sistema presenta múltiples fallos en la comunicación entre las páginas HTML/JavaScript y los endpoints PHP del backend, resultando en funcionalidades críticas que no operan correctamente: el catálogo de cursos no carga datos, el inicio de sesión no funciona, y el registro no redirige correctamente después de completarse.

**Impacto**: Los usuarios no pueden ver el catálogo de cursos, no pueden iniciar sesión en el sistema, y aunque el registro guarda datos, la experiencia del usuario se ve afectada por la falta de redirección apropiada.

**Contexto técnico**:
- Sistema XAMPP (Apache + MySQL) corriendo en `localhost/Chef-Jonathan-Buitrago/`
- Frontend: HTML/JavaScript vanilla con wrapper `apiFetch()` en `assets/config.js`
- Backend: PHP con PDO, endpoints en `backend/api/`
- Base de datos: MySQL (`chef_jonathan`)

## Bug Analysis

### Current Behavior (Defect)

#### 1. Fallo en Carga de Catálogo de Cursos

1.1 CUANDO el usuario accede a `catalogo.html` ENTONCES el sistema muestra el error "JSON.parse: unexpected character at line 2 column 1 of the JSON data" en la consola

1.2 CUANDO `catalog-courses.js` intenta cargar cursos ENTONCES la petición a `/backend/api/cursos-get.php` falla porque usa una ruta absoluta incorrecta que no incluye el directorio base del proyecto

1.3 CUANDO la petición HTTP falla o devuelve HTML/error en lugar de JSON ENTONCES la función `JSON.parse()` lanza una excepción y el catálogo queda en estado "Error loading courses"

1.4 CUANDO `catalog-courses.js` usa `fetch('/backend/api/cursos-get.php')` directamente ENTONCES no se utiliza el wrapper `apiFetch()` configurado en `config.js` que tiene la ruta base correcta

#### 2. Fallo en Inicio de Sesión

2.1 CUANDO el usuario completa el formulario de login en `registro.html` ENTONCES el sistema no procesa correctamente las credenciales

2.2 CUANDO el formulario de login se envía ENTONCES no redirige al dashboard o área de usuario después de autenticación exitosa

2.3 CUANDO ocurre un error en el login ENTONCES los mensajes de error no se muestran claramente al usuario

#### 3. Fallo en Redirección Post-Registro

3.1 CUANDO el usuario completa exitosamente el formulario de registro ENTONCES el sistema muestra mensaje de éxito pero NO redirige automáticamente a la página de login o dashboard

3.2 CUANDO el registro se completa ENTONCES el sistema puede mostrar tanto mensaje de error como de éxito simultáneamente, confundiendo al usuario

3.3 CUANDO el registro es exitoso ENTONCES el usuario se queda en `registro.html` sin indicación clara de qué hacer después

### Expected Behavior (Correct)

#### 1. Carga Correcta de Catálogo de Cursos

2.1 CUANDO el usuario accede a `catalogo.html` ENTONCES el sistema SHALL cargar y mostrar la lista completa de cursos desde la base de datos sin errores de parsing

2.2 CUANDO `catalog-courses.js` intenta cargar cursos ENTONCES SHALL utilizar el wrapper `apiFetch('cursos-get.php')` que construye automáticamente la ruta completa correcta (`/Chef-Jonathan-Buitrago/backend/api/cursos-get.php`)

2.3 CUANDO `cursos-get.php` responde ENTONCES SHALL devolver JSON válido con estructura `{success: true, data: [...]}` o `{success: false, message: "..."}` 

2.4 CUANDO los cursos se cargan exitosamente ENTONCES SHALL renderizar las tarjetas de curso con imagen, título, descripción, precio y botones funcionales

#### 2. Inicio de Sesión Funcional

2.5 CUANDO el usuario completa el formulario de login con credenciales válidas ENTONCES el sistema SHALL autenticar al usuario y redirigir al dashboard correspondiente según su rol

2.6 CUANDO el login es exitoso ENTONCES SHALL almacenar la sesión/token del usuario y redirigir a `views/dashboard.html` o `views/admin.html` según el rol

2.7 CUANDO las credenciales son inválidas ENTONCES SHALL mostrar un mensaje claro de error sin redirigir

2.8 CUANDO ocurre un error de conexión ENTONCES SHALL mostrar un mensaje indicando que no se pudo conectar con el servidor

#### 3. Redirección Post-Registro Correcta

2.9 CUANDO el usuario completa exitosamente el registro ENTONCES el sistema SHALL mostrar mensaje de éxito Y redirigir automáticamente a `registro.html` con el formulario de login visible después de 2-3 segundos

2.10 CUANDO el registro falla por datos duplicados o inválidos ENTONCES SHALL mostrar ÚNICAMENTE mensaje de error sin mensaje de éxito contradictorio

2.11 CUANDO el registro es exitoso ENTONCES SHALL mostrar un mensaje del tipo "Registro exitoso. Redirigiendo al inicio de sesión..." antes de redirigir

### Unchanged Behavior (Regression Prevention)

#### 1. Funcionalidad de Registro Existente

3.1 CUANDO el usuario se registra con datos válidos ENTONCES el sistema SHALL CONTINUE TO guardar el usuario en la tabla `users` de la base de datos correctamente

3.2 CUANDO el usuario proporciona datos de registro ENTONCES el sistema SHALL CONTINUE TO validar la fortaleza de contraseña (mínimo 8 caracteres, mayúscula, carácter especial)

3.3 CUANDO el registro detecta email duplicado ENTONCES el sistema SHALL CONTINUE TO rechazar el registro con mensaje "El usuario ya existe"

3.4 CUANDO se envían datos incompletos ENTONCES el sistema SHALL CONTINUE TO validar y mostrar mensaje "Datos incompletos" o "Todos los campos son requeridos"

#### 2. Validaciones y Seguridad del Backend

3.5 CUANDO se reciben peticiones HTTP ENTONCES el sistema SHALL CONTINUE TO verificar el método HTTP (POST, GET, etc.) y rechazar métodos no permitidos

3.6 CUANDO `backend/api/login.php` recibe credenciales ENTONCES SHALL CONTINUE TO usar `password_verify()` para validación segura

3.7 CUANDO `backend/api/register.php` crea usuarios ENTONCES SHALL CONTINUE TO usar `password_hash()` para almacenar contraseñas de forma segura

3.8 CUANDO se procesan peticiones del frontend ENTONCES el backend SHALL CONTINUE TO configurar headers CORS apropiados mediante `backend/cors.php`

#### 3. Configuración de API Base

3.9 CUANDO se carga `assets/config.js` ENTONCES SHALL CONTINUE TO definir `API_CONFIG.baseUrl` como `/Chef-Jonathan-Buitrago/backend/api`

3.10 CUANDO se llama `apiFetch(endpoint)` ENTONCES SHALL CONTINUE TO construir la URL completa concatenando `baseUrl + '/' + endpoint`

3.11 CUANDO otras páginas usan `apiFetch()` correctamente ENTONCES SHALL CONTINUE TO funcionar sin errores de ruta

#### 4. Renderizado de UI

3.12 CUANDO el usuario navega por las páginas HTML ENTONCES el sistema SHALL CONTINUE TO mostrar el header, footer y estilos CSS correctamente

3.13 CUANDO se muestran notificaciones con `showToast()` ENTONCES SHALL CONTINUE TO funcionar para mensajes de éxito, error y advertencia

3.14 CUANDO el catálogo tiene filtros (Todos, Cursos, Asesorías, Eventos) ENTONCES SHALL CONTINUE TO permitir filtrado por categoría

