// Funciones para cargar datos en las tablas admin

let allUsers = []; // Variable global para almacenar usuarios

// Notificaciones toast (reemplaza alerts)
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `px-4 py-3 rounded-lg shadow-lg text-white text-sm animate-fade-in ${
        type === 'success' ? 'bg-green-600' :
        type === 'error' ? 'bg-red-600' :
        'bg-amber-600'
    }`;

    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('animate-fade-in');
        toast.classList.add('animate-fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function loadUsers() {
    try {
        const response = await fetch('/backend/api/usuarios-get.php');
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            allUsers = result.data; // Almacenar usuarios globalmente
            const tbody = document.getElementById('users-tbody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            result.data.forEach((user, index) => {
                const row = document.createElement('tr');
                row.className = 'border-b border-gray-800';
                row.innerHTML = `
                    <td class="py-3 text-gray-400 text-sm">${String(user.id).padStart(3, '0')}</td>
                    <td class="py-3 text-white text-sm">${user.name}</td>
                    <td class="py-3 text-gray-400 text-sm">${user.email}</td>
                    <td class="py-3 text-gray-400 text-sm">${user.role || 'user'}</td>
                    <td class="py-3 text-gray-400 text-sm">${new Date(user.created_at).toLocaleDateString('es-ES')}</td>
                    <td class="py-3">
                        <div class="flex space-x-1">
                            <button type="button" class="edit-btn px-2 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 text-xs" data-user-id="${user.id}">Modificar</button>
                            <button type="button" class="delete-btn px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs" data-user-id="${user.id}">Eliminar</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            allUsers = []; // Limpiar si no hay datos
            const tbody = document.getElementById('users-tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-gray-400">No hay usuarios registrados.</td></tr>';
            }
        }
    } catch (error) {
        allUsers = []; // Limpiar en error
        const tbody = document.getElementById('users-tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-red-300">Error al cargar usuarios.</td></tr>';
        }
    }
}

async function loadInscriptions() {
    try {
        const response = await fetch('/backend/api/inscripciones-get.php');
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            const tbody = document.querySelector('table tbody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            result.data.forEach((inscription, index) => {
                const row = document.createElement('tr');
                row.className = 'border-b border-gray-800';
                const statusClass = inscription.status === 'pending' ? 'bg-yellow-900 text-yellow-300' : 
                                inscription.status === 'confirmed' ? 'bg-green-900 text-green-300' : 
                                'bg-red-900 text-red-300';
                const statusLabel = inscription.status === 'pending' ? 'Pendiente' : 
                                inscription.status === 'confirmed' ? 'Confirmado' : 'Completado';
                
                row.innerHTML = `
                    <td class="py-3 text-gray-400 text-sm">${String(inscription.id).padStart(3, '0')}</td>
                    <td class="py-3 text-white text-sm">${inscription.user_name}</td>
                    <td class="py-3 text-gray-400 text-sm">${inscription.course_title}</td>
                    <td class="py-3 text-gray-400 text-sm">${new Date(inscription.registration_date).toLocaleDateString('es-ES')}</td>
                    <td class="py-3">
                        <span class="px-2 py-1 ${statusClass} rounded-full text-xs">${statusLabel}</span>
                    </td>
                    <td class="py-3">
                        <div class="flex space-x-1">
                            <button class="px-2 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 text-xs">Modificar</button>
                            <button class="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs">Cancelar</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error cargando inscripciones:', error);
    }
}

let allCourses = [];

async function loadCourses() {
    try {
        const response = await fetch('/backend/api/cursos-get.php');
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            allCourses = result.data;
            const tbody = document.getElementById('courses-tbody');
            if (!tbody) return;

            tbody.innerHTML = '';
            result.data.forEach((course) => {
                const row = document.createElement('tr');
                row.className = 'border-b border-gray-800';
                row.innerHTML = `
                    <td class="py-3 text-gray-400 text-sm">${String(course.id).padStart(3, '0')}</td>
                    <td class="py-3">
                        ${course.image ? '<img src="' + course.image + '" class="w-16 h-16 object-cover rounded">' : '<div class="w-16 h-16 bg-gray-700 rounded flex items-center justify-center text-gray-500 text-xs">Sin img</div>'}
                    </td>
                    <td class="py-3 text-white text-sm">${course.title}</td>
                    <td class="py-3 text-gray-400 text-sm capitalize">${course.category || 'cursos'}</td>
                    <td class="py-3 text-amber-500 font-semibold text-sm">$${Number(course.price).toLocaleString('es-ES')}</td>
                    <td class="py-3">
                        <div class="flex space-x-1">
                            <button type="button" class="edit-course-btn px-2 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 text-xs" data-course-id="${course.id}">Modificar</button>
                            <button type="button" class="delete-course-btn px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs" data-course-id="${course.id}">Eliminar</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error cargando cursos:', error);
    }
}

// === CREAR CURSO ===
function setupCreateCourseForm() {
    const form = document.getElementById('create-service-form');
    if (!form || form._bound) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('course-title').value.trim();
        const description = document.getElementById('course-description').value.trim();
        const descriptionDetail = document.getElementById('course-description-detail').value.trim();
        const category = document.getElementById('course-category').value;
        const duration = document.getElementById('course-duration').value.trim();
        const price = document.getElementById('course-price').value;
        const imageInput = document.getElementById('course-image');

        if (!title || !price) {
            showToast('Completa título y precio', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('description_detail', descriptionDetail);
        formData.append('category', category);
        formData.append('duration', duration);
        formData.append('price', price);
        if (imageInput.files[0]) {
            formData.append('image', imageInput.files[0]);
        }

        try {
            const response = await fetch('/backend/api/courses.php', { method: 'POST', body: formData });
            const result = await response.json();

            if (result.success) {
                showToast('Curso creado exitosamente');
                form.reset();
                await loadCourses();
            } else {
                showToast(result.message || 'No se pudo crear', 'error');
            }
        } catch (error) {
            showToast('Error al procesar la solicitud', 'error');
        }
    });

    form._bound = true;
}

// === MODALES ===
function openEditCourseModal(course) {
    const modal = document.getElementById('edit-service-modal');
    if (!modal) return;
    document.getElementById('edit-service-id').value = course.id;
    document.getElementById('edit-service-title').value = course.title;
    document.getElementById('edit-service-description').value = course.description || '';
    document.getElementById('edit-service-description-detail').value = course.description_detail || '';
    document.getElementById('edit-service-category').value = course.category || 'cursos';
    document.getElementById('edit-service-duration').value = course.duration || '';
    document.getElementById('edit-service-price').value = course.price;

    // Guardar imagen actual en campo oculto
    let currentImageInput = document.getElementById('edit-service-current-image');
    if (!currentImageInput) {
        currentImageInput = document.createElement('input');
        currentImageInput.type = 'hidden';
        currentImageInput.id = 'edit-service-current-image';
        currentImageInput.name = 'image_url';
        modal.querySelector('form').appendChild(currentImageInput);
    }
    currentImageInput.value = course.image || '';

    // Mostrar preview de imagen actual
    const preview = document.getElementById('edit-service-image-preview');
    if (course.image && preview) {
        preview.innerHTML = '<img src="' + course.image + '" class="max-h-full max-w-full object-contain">';
    } else if (preview) {
        preview.innerHTML = '<span class="text-gray-500 text-xs">Sin imagen</span>';
    }

    modal.classList.remove('hidden');
}

function openDeleteCourseModal(course) {
    const modal = document.getElementById('delete-service-modal');
    if (!modal) return;
    document.getElementById('delete-service-id').value = course.id;
    document.getElementById('delete-service-title').textContent = course.title;
    modal.classList.remove('hidden');
}

function setupEditCourseModal() {
    const modal = document.getElementById('edit-service-modal');
    const form = document.getElementById('edit-service-form');
    const cancelBtn = document.getElementById('cancel-edit-service');
    if (!modal || !form || !cancelBtn || modal._bound) return;

    cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-service-id').value;
        const title = document.getElementById('edit-service-title').value.trim();
        const description = document.getElementById('edit-service-description').value.trim();
        const descriptionDetail = document.getElementById('edit-service-description-detail').value.trim();
        const category = document.getElementById('edit-service-category').value;
        const duration = document.getElementById('edit-service-duration').value.trim();
        const price = document.getElementById('edit-service-price').value;
        const imageInput = document.getElementById('edit-service-image');

        if (!title || !price) { showToast('Completa título y precio', 'error'); return; }

        const formData = new FormData();
        formData.append('id', id);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('description_detail', descriptionDetail);
        formData.append('category', category);
        formData.append('duration', duration);
        formData.append('price', price);

        // Conservar imagen actual si no se selecciona una nueva
        const currentImage = document.getElementById('edit-service-current-image');
        if (currentImage && currentImage.value) {
            formData.append('image_url', currentImage.value);
        }

        if (imageInput.files[0]) {
            formData.append('image', imageInput.files[0]);
        }

        try {
            const response = await fetch('/backend/api/courses.php', { method: 'POST', body: formData });
            const result = await response.json();
            if (result.success) {
                showToast('Curso actualizado');
                modal.classList.add('hidden');
                await loadCourses();
            } else {
                showToast(result.message || 'No se pudo actualizar', 'error');
            }
        } catch (error) {
            showToast('Error al procesar', 'error');
        }
    });

    modal._bound = true;
}

function setupDeleteCourseModal() {
    const modal = document.getElementById('delete-service-modal');
    const cancelBtn = document.getElementById('cancel-delete-service');
    const confirmBtn = document.getElementById('confirm-delete-service');
    if (!modal || !cancelBtn || !confirmBtn || modal._bound) return;

    cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

    confirmBtn.addEventListener('click', async () => {
        const id = document.getElementById('delete-service-id').value;
        try {
            const response = await fetch('/backend/api/courses.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const result = await response.json();
            if (result.success) {
                showToast('Curso eliminado');
                modal.classList.add('hidden');
                await loadCourses();
            } else {
                showToast(result.message || 'No se pudo eliminar', 'error');
            }
        } catch (error) {
            showToast('Error al procesar', 'error');
        }
    });

    modal._bound = true;
}

function setupCourseTableDelegation() {
    const tbody = document.getElementById('courses-tbody');
    if (!tbody || tbody._delegated) return;

    tbody.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('edit-course-btn')) {
            const id = target.getAttribute('data-course-id');
            const course = allCourses.find(c => String(c.id) === String(id));
            if (course) openEditCourseModal(course);
        } else if (target.classList.contains('delete-course-btn')) {
            const id = target.getAttribute('data-course-id');
            const course = allCourses.find(c => String(c.id) === String(id));
            if (course) openDeleteCourseModal(course);
        }
    });

    tbody._delegated = true;
}

async function loadSellers() {
    try {
        const response = await fetch('/backend/api/vendedores-get.php');
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            const tbody = document.querySelector('table tbody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            result.data.forEach((seller, index) => {
                const row = document.createElement('tr');
                row.className = 'border-b border-gray-800';
                row.innerHTML = `
                    <td class="py-3 text-gray-400 text-sm">${String(seller.id).padStart(3, '0')}</td>
                    <td class="py-3 text-white text-sm">${seller.name}</td>
                    <td class="py-3 text-gray-400 text-sm">${seller.email}</td>
                    <td class="py-3 text-gray-400 text-sm">${seller.phone || 'N/A'}</td>
                    <td class="py-3 text-gray-400 text-sm">${seller.commission_rate || '0'}%</td>
                    <td class="py-3">
                        <span class="px-2 py-1 bg-green-900 text-green-300 rounded-full text-xs">Activo</span>
                    </td>
                    <td class="py-3">
                        <div class="flex space-x-1">
                            <button class="px-2 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 text-xs">Modificar</button>
                            <button class="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs">Inactivar</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error cargando vendedores:', error);
    }
}

async function loadCommissions() {
    try {
        const response = await fetch('/backend/api/comisiones-get.php');
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            const tbody = document.querySelector('table tbody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            result.data.forEach((commission, index) => {
                const row = document.createElement('tr');
                row.className = 'border-t border-gray-700';
                row.innerHTML = `
                    <td class="p-4 text-gray-300">#V${String(commission.sale_id).padStart(3, '0')}</td>
                    <td class="p-4 text-gray-300">${new Date(commission.date).toLocaleDateString('es-ES')}</td>
                    <td class="p-4 text-white">${commission.client_name}</td>
                    <td class="p-4 text-gray-300">${commission.course_title}</td>
                    <td class="p-4 text-gray-300">$${Number(commission.sale_amount).toLocaleString('es-ES')}</td>
                    <td class="p-4 text-gray-300">${commission.seller_name === 'Pedro Martínez' ? '15%' : commission.seller_name === 'Laura Sánchez' ? '12%' : '10%'}</td>
                    <td class="p-4 text-green-400">$${Number(commission.commission_amount).toLocaleString('es-ES')}</td>
                    <td class="p-4">
                        <span class="px-2 py-1 bg-green-900 text-green-300 rounded-full text-xs">Pagada</span>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error cargando comisiones:', error);
    }
}

// Funciones para gestión de usuarios
function setupCreateUserForm() {
    const createForm = document.getElementById('create-user-form');
    const nameInput = document.getElementById('user-name');
    if (!createForm || createForm._bound) return;

    // Filtrar caracteres no alfabéticos en tiempo real
    if (nameInput) {
        nameInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
        });
    }

    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('user-name').value.trim();
        const email = document.getElementById('user-email').value.trim();
        const role = document.getElementById('user-role').value;
        const password = document.getElementById('user-password').value;

        if (!name || !email || !password) {
            showToast('Completa nombre, email y contraseña.', 'error');
            return;
        }

        // Validar que el nombre solo tenga letras
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name)) {
            showToast('El nombre solo puede contener letras y espacios.', 'error');
            return;
        }

        try {
            const response = await fetch('/backend/api/users.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'create_user',
                    name,
                    email,
                    role,
                    password,
                }),
            });

            const result = await response.json();

            if (result.success) {
                showToast('Usuario creado exitosamente');
                createForm.reset();
                await loadUsers();
            } else {
                showToast(result.message || 'No se pudo crear el usuario', 'error');
            }
        } catch (error) {
            showToast('Error al procesar la solicitud', 'error');
        }
    });

    createForm._bound = true;
}

function setupEditModal() {
    const editModal = document.getElementById('edit-user-modal');
    const editForm = document.getElementById('edit-user-form');
    const cancelEditBtn = document.getElementById('cancel-edit-user');
    const editNameInput = document.getElementById('edit-user-name');

    if (!editModal || !editForm || !cancelEditBtn || editModal._bound) return;

    // Filtrar caracteres no alfabéticos en tiempo real
    if (editNameInput) {
        editNameInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
        });
    }

    cancelEditBtn.addEventListener('click', () => {
        editModal.classList.add('hidden');
    });

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const userId = document.getElementById('edit-user-id').value;
        const name = document.getElementById('edit-user-name').value.trim();
        const email = document.getElementById('edit-user-email').value.trim();
        const role = document.getElementById('edit-user-role').value;

        if (!name || !email) {
            showToast('Completa nombre y email para actualizar el usuario.', 'error');
            return;
        }

        // Validar que el nombre solo tenga letras
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name)) {
            showToast('El nombre solo puede contener letras y espacios.', 'error');
            return;
        }

        try {
            const response = await fetch('/backend/api/users.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'update_user',
                    id: userId,
                    name,
                    email,
                    role,
                }),
            });

            const result = await response.json();
            if (result.success) {
                showToast('Usuario actualizado exitosamente');
                editModal.classList.add('hidden');
                await loadUsers();
            } else {
                showToast(result.message || 'No se pudo actualizar el usuario', 'error');
            }
        } catch (error) {
            showToast('Error al procesar la solicitud', 'error');
        }
    });

    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.classList.add('hidden');
        }
    });

    editModal._bound = true;
}

function setupDeleteModal() {
    const deleteModal = document.getElementById('delete-user-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-user');
    const confirmDeleteBtn = document.getElementById('confirm-delete-user');

    if (!deleteModal || !cancelDeleteBtn || !confirmDeleteBtn || deleteModal._bound) return;

    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.classList.add('hidden');
    });

    confirmDeleteBtn.addEventListener('click', async () => {
        const userId = document.getElementById('delete-user-id').value;
        if (!userId) return;

        try {
            const response = await fetch('/backend/api/users.php', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete_user',
                    id: userId,
                }),
            });

            const result = await response.json();
            if (result.success) {
                showToast('Usuario eliminado exitosamente');
                deleteModal.classList.add('hidden');
                await loadUsers();
            } else {
                showToast(result.message || 'No se pudo eliminar el usuario', 'error');
            }
        } catch (error) {
            showToast('Error al procesar la solicitud', 'error');
        }
    });

    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            deleteModal.classList.add('hidden');
        }
    });

    deleteModal._bound = true;
}

function openEditModal(user) {
    const editModal = document.getElementById('edit-user-modal');
    if (!editModal) return;

    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-user-name').value = user.name;
    document.getElementById('edit-user-email').value = user.email;
    document.getElementById('edit-user-role').value = user.role || 'user';
    editModal.classList.remove('hidden');
}

function openDeleteModal(user) {
    const deleteModal = document.getElementById('delete-user-modal');
    if (!deleteModal) return;

    document.getElementById('delete-user-id').value = user.id;
    document.getElementById('delete-user-name').textContent = user.name;
    deleteModal.classList.remove('hidden');
}

function setupUserTableDelegation() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody || tbody._delegated) return;

    tbody.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('edit-btn')) {
            const userId = target.getAttribute('data-user-id');
            const user = allUsers.find(u => String(u.id) === String(userId));
            if (user) openEditModal(user);
        } else if (target.classList.contains('delete-btn')) {
            const userId = target.getAttribute('data-user-id');
            const user = allUsers.find(u => String(u.id) === String(userId));
            if (user) openDeleteModal(user);
        }
    });

    tbody._delegated = true;
}


// ===== FUNCIONES PARA VENDEDORES (admin-vendedores) =====
let allSellers = [];

async function loadSellerList() {
    try {
        const response = await fetch('/backend/api/vendedores-get.php');
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            allSellers = result.data;
            const tbody = document.getElementById('sellers-tbody');
            if (!tbody) return;

            tbody.innerHTML = '';
            result.data.forEach((seller) => {
                const row = document.createElement('tr');
                row.className = 'border-b border-gray-800';
                row.innerHTML = `
                    <td class="py-3 text-gray-400 text-sm">${String(seller.id).padStart(3, '0')}</td>
                    <td class="py-3 text-white text-sm">${seller.name}</td>
                    <td class="py-3 text-gray-400 text-sm">${seller.email}</td>
                    <td class="py-3 text-gray-400 text-sm">${seller.phone || 'N/A'}</td>
                    <td class="py-3 text-gray-400 text-sm">${seller.commission_rate || '0'}%</td>
                    <td class="py-3">
                        <div class="flex space-x-1">
                            <button type="button" class="edit-seller-btn px-2 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 text-xs" data-seller-id="${seller.id}">Modificar</button>
                            <button type="button" class="delete-seller-btn px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs" data-seller-id="${seller.id}">Eliminar</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            allSellers = [];
            const tbody = document.getElementById('sellers-tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-gray-400">No hay vendedores registrados.</td></tr>';
            }
        }
    } catch (error) {
        const tbody = document.getElementById('sellers-tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-red-300">Error al cargar.</td></tr>';
        }
    }
}

// ===== FUNCIONES PARA INSCRIPCIONES (admin-inscripciones) =====
let allInscriptions = [];

async function loadInscriptionList() {
    try {
        const response = await fetch('/backend/api/inscripciones-get.php');
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            allInscriptions = result.data;
            const tbody = document.getElementById('inscriptions-tbody');
            if (!tbody) return;

            tbody.innerHTML = '';
            result.data.forEach((inscription) => {
                const statusClass = inscription.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                    inscription.status === 'confirmed' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300';
                const statusLabel = inscription.status === 'pending' ? 'Pendiente' :
                    inscription.status === 'confirmed' ? 'Confirmado' : 'Completado';

                const row = document.createElement('tr');
                row.className = 'border-b border-gray-800';
                row.innerHTML = `
                    <td class="py-3 text-gray-400 text-sm">${String(inscription.id).padStart(3, '0')}</td>
                    <td class="py-3 text-white text-sm">${inscription.user_name || inscription.client_name || 'N/A'}</td>
                    <td class="py-3 text-gray-400 text-sm">${inscription.course_title || 'N/A'}</td>
                    <td class="py-3 text-gray-400 text-sm">${new Date(inscription.registration_date).toLocaleDateString('es-ES')}</td>
                    <td class="py-3">
                        <span class="px-2 py-1 ${statusClass} rounded-full text-xs">${statusLabel}</span>
                    </td>
                    <td class="py-3">
                        <div class="flex space-x-1">
                            <button type="button" class="edit-inscription-btn px-2 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 text-xs" data-inscription-id="${inscription.id}">Modificar</button>
                            <button type="button" class="delete-inscription-btn px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs" data-inscription-id="${inscription.id}">Eliminar</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            allInscriptions = [];
            const tbody = document.getElementById('inscriptions-tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-gray-400">No hay inscripciones.</td></tr>';
            }
        }
    } catch (error) {
        const tbody = document.getElementById('inscriptions-tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-red-300">Error al cargar.</td></tr>';
        }
    }
}

// ===== FUNCIONES PARA VISITAS (admin-visitas) =====
let allVisitas = [];

async function loadVisitasList() {
    try {
        const response = await fetch('/backend/api/visitas-get.php');
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            allVisitas = result.data;
            const tbody = document.getElementById('visitas-tbody');
            if (!tbody) return;

            tbody.innerHTML = '';
            result.data.forEach((visita) => {
                const row = document.createElement('tr');
                row.className = 'border-b border-gray-800';
                row.innerHTML = `
                    <td class="py-3 text-gray-400 text-sm">${String(visita.id).padStart(3, '0')}</td>
                    <td class="py-3 text-white text-sm">${visita.client_name || visita.name || 'N/A'}</td>
                    <td class="py-3 text-gray-400 text-sm">${visita.phone || 'N/A'}</td>
                    <td class="py-3 text-gray-400 text-sm">${new Date(visita.date).toLocaleDateString('es-ES')}</td>
                    <td class="py-3 text-gray-400 text-sm">${visita.notes || '-'}</td>
                    <td class="py-3">
                        <div class="flex space-x-1">
                            <button type="button" class="delete-visita-btn px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs" data-visita-id="${visita.id}">Eliminar</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            allVisitas = [];
            const tbody = document.getElementById('visitas-tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-gray-400">No hay visitas.</td></tr>';
            }
        }
    } catch (error) {
        const tbody = document.getElementById('visitas-tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-red-300">Error al cargar.</td></tr>';
        }
    }
}

// ===== FUNCIONES PARA SALIDAS (admin-salidas) =====
let allSalidas = [];

async function loadSalidasList() {
    // Usar same endpoint as visits for now, or create separate
    const tbody = document.getElementById('salidas-tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-gray-400">Funcionalidad en desarrollo.</td></tr>';
    }
}

// ===== DOMContentLoaded - detectar página y cargar datos =====
document.addEventListener('DOMContentLoaded', function() {
    const page = window.location.pathname;

    if (page.includes('admin-usuarios')) {
        loadUsers();
        setupCreateUserForm();
        setupEditModal();
        setupDeleteModal();
        setupUserTableDelegation();
    } else if (page.includes('admin-servicios')) {
        loadCourses();
        setupCreateCourseForm();
        setupEditCourseModal();
        setupDeleteCourseModal();
        setupCourseTableDelegation();
    } else if (page.includes('admin-vendedores')) {
        loadSellerList();
    } else if (page.includes('admin-inscripciones')) {
        loadInscriptionList();
    } else if (page.includes('admin-visitas')) {
        loadVisitasList();
    } else if (page.includes('admin-salidas')) {
        loadSalidasList();
    } else if (page.includes('seller-comisiones')) {
        loadCommissions();
    }
});

// FIX: Forzar handler del API (script.js marca _bound y bloquea admin-tables.js)
(function(){
    var form = document.getElementById('create-user-form');
    if (!form) return;

    var apiHandler = async function(e) {
        e.preventDefault();

        var name = document.getElementById('user-name').value.trim();
        var email = document.getElementById('user-email').value.trim();
        var role = document.getElementById('user-role').value;
        var password = document.getElementById('user-password').value;

        if (!name || !email || !password) {
            showToast('Completa nombre, email y contraseña.', 'error');
            return;
        }

        try {
            var response = await fetch('/backend/api/users.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_user',
                    name: name, email: email, role: role, password: password
                }),
            });

            var result = await response.json();

            if (result.success) {
                showToast('Usuario creado exitosamente');
                form.reset();
                if (typeof loadUsers === 'function') loadUsers();
            } else {
                showToast(result.message || 'No se pudo crear', 'error');
            }
        } catch (error) {
            showToast('Error al procesar la solicitud', 'error');
        }
    };

    // Clonar para eliminar listeners de script.js
    var newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    newForm.addEventListener('submit', apiHandler);
})();
