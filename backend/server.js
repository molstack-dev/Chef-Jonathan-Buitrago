const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const port = 3000;

// Middleware para parsear el body de las peticiones
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '..')));
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));
app.use('/img', express.static(path.join(__dirname, '..', 'img')));
app.use('/views', express.static(path.join(__dirname, '..', 'views')));

// Función para leer la base de datos
async function readDB() {
  const data = await fs.readFile(path.join(__dirname, 'db.json'), 'utf8');
  return JSON.parse(data);
}

// Función para escribir en la base de datos
async function writeDB(data) {
  await fs.writeFile(path.join(__dirname, 'db.json'), JSON.stringify(data, null, 2));
}

// Sirve el archivo index.html en la ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Endpoint para el registro de usuarios
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log('Datos de registro recibidos:', req.body);
    
    // Leer base de datos
    const db = await readDB();
    
    // Verificar si el usuario ya existe
    const existingUser = db.users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }
    
    // Crear nuevo usuario
    const newUser = {
      id: db.users.length + 1,
      name,
      email,
      password, // Nota: En producción, se debe encriptar la contraseña
      role: 'user',
      createdAt: new Date().toISOString()
    };
    
    db.users.push(newUser);
    await writeDB(db);
    
    res.status(201).json({ 
      message: 'Usuario registrado exitosamente',
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Endpoint para inicio de sesión
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Leer base de datos
    const db = await readDB();
    
    // Buscar usuario
    const user = db.users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Endpoint para obtener todos los usuarios (solo para administradores)
app.get('/api/users', async (req, res) => {
  try {
    const db = await readDB();
    // No enviar contraseñas en la respuesta
    const users = db.users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    res.status(200).json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Endpoint para servir páginas según rol del usuario
app.get('/api/dashboard/:role', (req, res) => {
  const { role } = req.params;
  const validRoles = ['admin', 'seller', 'user'];
  
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Rol inválido' });
  }
  
  res.sendFile(path.join(__dirname, '..', 'views', role, `${role}.html`));
});

// Endpoint para obtener información de cursos
app.get('/api/courses', async (req, res) => {
  try {
    const db = await readDB();
    res.status(200).json(db.courses);
  } catch (error) {
    console.error('Error al obtener cursos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Endpoint para crear curso (solo para administradores)
app.post('/api/courses', async (req, res) => {
  try {
    const courseData = req.body;
    
    const db = await readDB();
    
    const newCourse = {
      id: db.courses.length + 1,
      ...courseData,
      createdAt: new Date().toISOString()
    };
    
    db.courses.push(newCourse);
    await writeDB(db);
    
    res.status(201).json({ 
      message: 'Curso creado exitosamente',
      course: newCourse
    });
  } catch (error) {
    console.error('Error al crear curso:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});