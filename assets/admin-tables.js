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

async function loadCourses() {
    try {
        const response = await fetch('/backend/api/cursos-get.php');
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            const tbody = document.querySelector('table tbody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            result.data.forEach((course, index) => {
                const row = document.createElement('tr');
                row.className = 'border-b border-gray-800';
                row.innerHTML = `
                    <td class="py-3 text-gray-400 text-sm">${String(course.id).padStart(3, '0')}</td>
                    <td class="py-3 text-white text-sm">${course.title}</td>
                    <td class="py-3 text-gray-400 text-sm">${course.category}</td>
                    <td class="py-3 text-gray-400 text-sm">$${Number(course.price).toLocaleString('es-ES')}</td>
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
        console.error('Error cargando cursos:', error);
    }
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

// Ejecutar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', function() {
    const page = window.location.pathname;

    if (page.includes('admin-usuarios')) {
        loadUsers();
        setupCreateUserForm();
        setupEditModal();
        setupDeleteModal();
        setupUserTableDelegation();
    } else if (page.includes('admin-inscripciones')) {
        loadInscriptions();
    } else if (page.includes('admin-servicios')) {
        loadCourses();
    } else if (page.includes('admin-vendedores')) {
        loadSellers();
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
