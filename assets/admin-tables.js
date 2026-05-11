// Funciones para cargar datos en las tablas admin

async function loadUsers() {
    try {
        const response = await fetch('/backend/api/usuarios-get.php');
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
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
                    <td class="py-3 text-gray-400 text-sm">${new Date(user.created_at).toLocaleDateString('es-ES')}</td>
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
        console.error('Error cargando usuarios:', error);
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

async function loadVisits() {
    try {
        const response = await fetch('/backend/api/visitas-get.php');
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            const tbody = document.querySelector('table tbody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            result.data.forEach((visit, index) => {
                const row = document.createElement('tr');
                row.className = 'border-b border-gray-800';
                row.innerHTML = `
                    <td class="py-3 text-gray-400 text-sm">${String(visit.id).padStart(3, '0')}</td>
                    <td class="py-3 text-white text-sm">${visit.client_name}</td>
                    <td class="py-3 text-gray-400 text-sm">${new Date(visit.date).toLocaleDateString('es-ES')}</td>
                    <td class="py-3 text-gray-400 text-sm">${visit.notes || 'Sin notas'}</td>
                    <td class="py-3">
                        <span class="px-2 py-1 bg-blue-900 text-blue-300 rounded-full text-xs">Registrada</span>
                    </td>
                    <td class="py-3">
                        <div class="flex space-x-1">
                            <button class="px-2 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 text-xs">Editar</button>
                            <button class="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs">Eliminar</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error cargando visitas:', error);
    }
}

// Ejecutar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', function() {
    const page = window.location.pathname;
    
    if (page.includes('admin-usuarios')) {
        loadUsers();
    } else if (page.includes('admin-inscripciones')) {
        loadInscriptions();
    } else if (page.includes('admin-servicios')) {
        loadCourses();
    } else if (page.includes('admin-vendedores')) {
        loadSellers();
    } else if (page.includes('admin-visitas')) {
        loadVisits();
    }
});
