// Funciones globales - disponibles inmediatamente
window.showToast = function(message, type = 'success') {
    var container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-24 right-4 z-50 flex flex-col gap-2';
        document.body.appendChild(container);
    }
    var toast = document.createElement('div');
    toast.className = 'px-4 py-3 rounded-lg shadow-lg text-white text-sm ' + (type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-amber-600');
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
};

window.loadMyAdvisories = async function() {
    var tbody = document.getElementById('solicitudes-tbody');
    if (!tbody) return;

    try {
        var email = null;
        if (typeof getCurrentUser === 'function') {
            var currentUser = getCurrentUser();
            if (currentUser && currentUser.email) {
                email = currentUser.email;
            }
        }
        if (!email) {
            email = localStorage.getItem('advisory_email');
        }

        var url = '/backend/api/my-advisories-get.php';
        if (email) {
            url += '?email=' + encodeURIComponent(email);
        }

        var response = await fetch(url, { credentials: 'include' });
        var result = await response.json();

        if (result.success && result.data.length > 0) {
            // Solo mostrar solicitudes pendientes
            var pending = result.data.filter(item => item.status === 'pending');

            if (pending.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-gray-400">No tienes solicitudes pendientes.</td></tr>';
                return;
            }

            tbody.innerHTML = '';
            pending.forEach(function(item) {
                var statusClass = item.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                    item.status === 'confirmed' ? 'bg-green-900 text-green-300' :
                    item.status === 'completed' ? 'bg-blue-900 text-blue-300' : 'bg-red-900 text-red-300';
                var statusLabel = item.status === 'pending' ? 'Pendiente' :
                    item.status === 'confirmed' ? 'Confirmado' :
                    item.status === 'completed' ? 'Completado' : 'Cancelado';

                // Formatear tipo de servicio
                var serviceTypeLabel = 'N/A';
                if (item.service_type === 'asesoria') {
                    serviceTypeLabel = item.advisory_type === 'asesoria_personal' ? 'Asesoría Personal' : 'Asesoría Negocio';
                } else if (item.service_type === 'curso') {
                    serviceTypeLabel = 'Curso';
                } else if (item.service_type === 'evento') {
                    serviceTypeLabel = 'Evento';
                }

                // Formatear nombre del servicio
                var serviceName = item.advisory_service || item.event_name || 'N/A';
                serviceName = serviceName.replace(/_/g, ' ');

                // Construir detalles completos
                var detalles = [];
                if (item.service_type === 'evento' && item.event_name) {
                    detalles.push('Evento: ' + item.event_name);
                } else if (item.advisory_service) {
                    detalles.push('Servicio: ' + item.advisory_service.replace(/_/g, ' '));
                }
                if (item.advisory_mode) detalles.push('Modalidad: ' + item.advisory_mode);
                if (item.price && item.price > 0) detalles.push('Precio: $' + Number(item.price).toLocaleString('es-CO'));
                if (item.date) detalles.push('Fecha: ' + new Date(item.date).toLocaleDateString('es-ES'));
                if (item.time) detalles.push('Hora: ' + item.time);
                if (item.num_persons > 1) detalles.push('Personas: ' + item.num_persons);
                if (item.notes) detalles.push('Notas: ' + item.notes);
                var detallesCompletos = detalles.join('\n');

                var row = document.createElement('tr');
                var actionsHtml = '';
                if (item.status === 'pending') {
                    actionsHtml = '<button type="button" class="modificar-btn px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700" data-id="' + item.id + '" data-item=\'' + JSON.stringify(item).replace(/'/g, "&#39;") + '\'>Modificar</button>' +
                        '<button type="button" class="eliminar-btn px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700" data-id="' + item.id + '">Eliminar</button>';
                }
                var receiptBtn = item.payment_receipt ?
                    '<button type="button" class="ver-comprobante-btn px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700" data-receipt="' + item.payment_receipt + '">Ver Comprobante</button>' :
                    '<span class="text-gray-500 text-xs">Sin comprobante</span>';

                var emailAttr = item.email ? item.email.replace(/'/g, "&#39;") : '';

                row.className = 'border-b border-gray-700';
                row.innerHTML = '<td class="h-auto text-gray-400 text-sm">' + serviceTypeLabel + '</td>' +
                    '<td class="py-3 text-gray-400 text-sm">' + serviceName + '</td>' +
                    '<td class="py-3"><button type="button" class="ver-detalles-btn px-3 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700" data-detalles="' + encodeURIComponent(detallesCompletos) + '">Ver más</button></td>' +
                    '<td class="py-3"><span class="px-2 py-1 ' + statusClass + ' rounded-full text-xs">' + statusLabel + '</span></td>' +
                    '<td class="py-3">' + receiptBtn + '</td>' +
                    '<td class="py-3 flex gap-2">' + actionsHtml + '</td>';
                if (emailAttr) {
                    row.querySelector('.eliminar-btn')?.setAttribute('data-email', emailAttr);
                }
                tbody.appendChild(row);
            });

            // Agregar evento a los botones "Ver más"
            tbody.querySelectorAll('.ver-detalles-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var detalles = decodeURIComponent(this.getAttribute('data-detalles'));
                    var contentDiv = document.getElementById('detalles-solicitud-content');
                    var titleEl = document.getElementById('detalles-modal-title');
                    if (titleEl) titleEl.textContent = 'Detalles de la Solicitud';
                    if (contentDiv) {
                        var lines = detalles.split('\n');
                        contentDiv.innerHTML = lines.map(function(line) {
                            return '<div class="py-2 border-b border-gray-700 last:border-0">' + line + '</div>';
                        }).join('');
                    }
                    var modal = document.getElementById('detalles-solicitud-modal');
                    if (modal) modal.classList.remove('hidden');
                });
            });

            // Agregar evento a los botones "Ver Comprobante"
            tbody.querySelectorAll('.ver-comprobante-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var receipt = this.getAttribute('data-receipt');
                    var contentDiv = document.getElementById('detalles-solicitud-content');
                    var titleEl = document.getElementById('detalles-modal-title');
                    if (titleEl) titleEl.textContent = 'Comprobante de Pago';
                    if (contentDiv && receipt) {
                        contentDiv.innerHTML = '<img src="' + receipt + '" alt="Comprobante" class="max-h-[75vh] max-w-full w-auto object-contain rounded block mx-auto">';
                    }
                    var modal = document.getElementById('detalles-solicitud-modal');
                    if (modal) modal.classList.remove('hidden');
                });
            });

            // Agregar evento a los botones "Eliminar"
            tbody.querySelectorAll('.eliminar-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var id = this.getAttribute('data-id');
                    var email = this.getAttribute('data-email');
                    showDeleteConfirmation(id, email);
                });
            });

            // Agregar evento a los botones "Modificar"
            tbody.querySelectorAll('.modificar-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var itemData = JSON.parse(this.getAttribute('data-item').replace(/&#39;/g, "'"));
                    modificarSolicitud(itemData);
                });
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-gray-400">No tienes solicitudes registradas.</td></tr>';
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-red-300">Error al cargar.</td></tr>';
    }
};

window.showCourseDetails = function(title, detail) {
    var modal = document.getElementById('courseDetailsModal');
    var titleEl = document.getElementById('courseTitle');
    var contentEl = document.getElementById('courseDetailsContent');
    if (!modal || !titleEl || !contentEl) return;
    titleEl.textContent = title;
    contentEl.innerHTML = '<p class="text-gray-300">' + (detail || 'Sin detalles disponibles.') + '</p>';
    modal.classList.remove('hidden');
};

window.closeCourseDetails = function() {
    var modal = document.getElementById('courseDetailsModal');
    if (modal) modal.classList.add('hidden');
};

window.closeDetallesModal = function() {
    var modal = document.getElementById('detalles-solicitud-modal');
    if (modal) modal.classList.add('hidden');
};

window.showDeleteConfirmation = function(id, email) {
    var modal = document.getElementById('delete-confirm-modal');
    if (!modal) return;
    modal.querySelector('#delete-confirm-email').value = '';
    modal.querySelector('#delete-confirm-instruction').textContent = email ? 'Escribe el correo ' + email + ' para confirmar la eliminación.' : 'Escribe el correo del usuario para confirmar la eliminación.';
    modal.dataset.deleteId = id;
    modal.dataset.deleteEmail = email || '';
    modal.classList.remove('hidden');
};

window.closeDeleteConfirmation = function() {
    var modal = document.getElementById('delete-confirm-modal');
    if (modal) modal.classList.add('hidden');
};

window.confirmDelete = function() {
    var modal = document.getElementById('delete-confirm-modal');
    if (!modal) return;
    var input = modal.querySelector('#delete-confirm-email');
    var expected = modal.dataset.deleteEmail || '';
    if (input.value.trim().toLowerCase() !== expected.toLowerCase()) {
        showToast('El correo no coincide. Escribe el correo exacto para continuar.', 'error');
        return;
    }
    var id = modal.dataset.deleteId;
    closeDeleteConfirmation();
    eliminarSolicitud(id);
};

// Función para eliminar una solicitud
async function eliminarSolicitud(id) {
    var email = localStorage.getItem('advisory_email') || '';
    try {
        var response = await fetch('/backend/api/advisory-delete.php', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, email: email })
        });
        var result = await response.json();
        if (result.success) {
            showToast('Solicitud eliminada correctamente', 'success');
            loadMyAdvisories();
        } else {
            showToast(result.message || 'Error al eliminar', 'error');
        }
    } catch (e) {
        showToast('Error al eliminar la solicitud', 'error');
    }
}

// Función para modificar una solicitud
window.modificarSolicitud = async function(item) {
    var modal = document.getElementById('detalles-solicitud-modal');
    if (modal) modal.classList.add('hidden');

    var editModal = document.getElementById('edit-solicitud-modal');
    if (!editModal) {
        var modalHtml = document.createElement('div');
        modalHtml.id = 'edit-solicitud-modal';
        modalHtml.className = 'hidden fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50';
        modalHtml.innerHTML = `
            <div class="bg-gray-800 p-6 rounded-xl max-w-lg mx-4 shadow-2xl border border-gray-700 w-full">
                <h3 class="text-xl font-semibold text-white mb-4 border-b border-gray-600 pb-3">Modificar Solicitud</h3>
                <div id="edit-solicitud-content" class="text-gray-300 space-y-4"></div>
                <div class="flex justify-end space-x-4 mt-6">
                    <button type="button" onclick="closeEditSolicitudModal()" class="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">Cancelar</button>
                    <button type="button" onclick="saveEditSolicitud()" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Guardar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalHtml);
        editModal = modalHtml;
    }

    window.currentEditSolicitud = item;
    var content = document.getElementById('edit-solicitud-content');
    var serviceType = item.service_type || 'asesoria';

    var horasOptions = `
        <option value="09:00" ${item.time === '09:00' ? 'selected' : ''}>09:00 AM</option>
        <option value="10:00" ${item.time === '10:00' ? 'selected' : ''}>10:00 AM</option>
        <option value="11:00" ${item.time === '11:00' ? 'selected' : ''}>11:00 AM</option>
        <option value="12:00" ${item.time === '12:00' ? 'selected' : ''}>12:00 PM</option>
        <option value="13:00" ${item.time === '13:00' ? 'selected' : ''}>01:00 PM</option>
        <option value="14:00" ${item.time === '14:00' ? 'selected' : ''}>02:00 PM</option>
        <option value="15:00" ${item.time === '15:00' ? 'selected' : ''}>03:00 PM</option>
        <option value="16:00" ${item.time === '16:00' ? 'selected' : ''}>04:00 PM</option>
        <option value="17:00" ${item.time === '17:00' ? 'selected' : ''}>05:00 PM</option>
        <option value="18:00" ${item.time === '18:00' ? 'selected' : ''}>06:00 PM</option>
    `;

    var coursesOptions = '';
    try {
        var coursesResp = await fetch('/backend/api/cursos-get.php');
        var coursesResult = await coursesResp.json();
        if (coursesResult.success && coursesResult.data) {
            coursesResult.data.forEach(function(course) {
                if (course.category === 'curso' || course.category === 'cursos') {
                    var selected = (item.advisory_service === course.title) ? 'selected' : '';
                    coursesOptions += '<option value="' + course.title + '" ' + selected + '>' + course.title + '</option>';
                }
            });
        }
    } catch (e) {
        coursesOptions = '<option value="' + (item.advisory_service || '') + '">' + (item.advisory_service || 'Sin curso') + '</option>';
    }

    var receiptStatus = item.payment_status || 'pending';
    var hasReceipt = item.payment_receipt && item.payment_receipt.length > 0;
    var receiptBadge = hasReceipt ? (receiptStatus === 'paid' ? '<span class="px-2 py-1 bg-green-600 text-white rounded text-xs">Comprobante cargado</span>' :
                        receiptStatus === 'rejected' ? '<span class="px-2 py-1 bg-red-600 text-white rounded text-xs">Rechazado</span>' :
                        '<span class="px-2 py-1 bg-yellow-600 text-white rounded text-xs">Comprobante cargado - Pendiente</span>') :
                        '<span class="px-2 py-1 bg-gray-600 text-white rounded text-xs">Sin comprobante</span>';

    var fieldsHtml = '';

    if (serviceType === 'asesoria') {
        fieldsHtml = `
            <div>
                <label class="block text-gray-400 text-sm mb-1">Fecha Deseada *</label>
                <input type="date" id="edit-date" value="${item.date || ''}" class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600" required>
            </div>
            <div>
                <label class="block text-gray-400 text-sm mb-1">Hora Preferida *</label>
                <select id="edit-time" class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600" required>
                    <option value="">Seleccionar hora</option>
                    ${horasOptions}
                </select>
            </div>
            <div>
                <label class="block text-gray-400 text-sm mb-1">Teléfono *</label>
                <input type="tel" id="edit-phone" value="${item.phone || ''}" class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600" placeholder="300 123 4567" required>
            </div>
            <div>
                <label class="block text-gray-400 text-sm mb-1">Comprobante de Pago</label>
                <div class="flex items-center gap-2 mb-2">${receiptBadge}</div>
                <input type="file" id="edit-receipt" accept="image/*" class="w-full text-gray-300 text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-white file:bg-amber-600 hover:file:bg-amber-700">
                <p class="text-gray-500 text-xs mt-1">Adjunta captura de pantalla de la transacción</p>
            </div>
        `;
    } else if (serviceType === 'curso') {
        fieldsHtml = `
            <div>
                <label class="block text-gray-400 text-sm mb-1">Teléfono *</label>
                <input type="tel" id="edit-phone" value="${item.phone || ''}" class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600" placeholder="300 123 4567" required>
            </div>
            <div>
                <label class="block text-gray-400 text-sm mb-1">Comprobante de Pago</label>
                <div class="flex items-center gap-2 mb-2">${receiptBadge}</div>
                <input type="file" id="edit-receipt" accept="image/*" class="w-full text-gray-300 text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-white file:bg-amber-600 hover:file:bg-amber-700">
                <p class="text-gray-500 text-xs mt-1">Adjunta captura de pantalla de la transacción</p>
            </div>
        `;
    } else if (serviceType === 'evento') {
        fieldsHtml = `
            <div>
                <label class="block text-gray-400 text-sm mb-1">Número de Personas *</label>
                <input type="number" id="edit-num-persons" value="${item.num_persons || 1}" min="1" max="50" class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600" required>
            </div>
            <div>
                <label class="block text-gray-400 text-sm mb-1">Teléfono *</label>
                <input type="tel" id="edit-phone" value="${item.phone || ''}" class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600" placeholder="300 123 4567" required>
            </div>
            <div>
                <label class="block text-gray-400 text-sm mb-1">Comprobante de Pago</label>
                <div class="flex items-center gap-2 mb-2">${receiptBadge}</div>
                <input type="file" id="edit-receipt" accept="image/*" class="w-full text-gray-300 text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-white file:bg-amber-600 hover:file:bg-amber-700">
                <p class="text-gray-500 text-xs mt-1">Adjunta captura de pantalla de la transacción</p>
            </div>
        `;
    }

    content.innerHTML = `
        <div class="space-y-3">
            ${fieldsHtml}
            <div>
                <label class="block text-gray-400 text-sm mb-1">Notas</label>
                <textarea id="edit-notes" rows="3" class="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600">${item.notes || ''}</textarea>
            </div>
        </div>
    `;

    editModal.classList.remove('hidden');
};

window.closeEditSolicitudModal = function() {
    var modal = document.getElementById('edit-solicitud-modal');
    if (modal) modal.classList.add('hidden');
    window.currentEditSolicitud = null;
};

window.saveEditSolicitud = async function() {
    var item = window.currentEditSolicitud;
    if (!item) return;

    var serviceType = item.service_type || 'asesoria';
    var errors = [];

    // Validación según tipo de servicio
    if (serviceType === 'asesoria') {
        var date = document.getElementById('edit-date').value;
        var time = document.getElementById('edit-time').value;
        var phone = document.getElementById('edit-phone').value;
        if (!date) errors.push('La fecha es requerida');
        if (!time) errors.push('La hora es requerida');
        if (!phone) errors.push('El teléfono es requerido');
    } else if (serviceType === 'evento') {
        var numPersons = document.getElementById('edit-num-persons').value;
        var phone = document.getElementById('edit-phone').value;
        if (!numPersons || numPersons < 1) errors.push('El número de personas es requerido');
        if (!phone) errors.push('El teléfono es requerido');
    } else if (serviceType === 'curso') {
        var phone = document.getElementById('edit-phone').value;
        if (!phone) errors.push('El teléfono es requerido');
    }

    if (errors.length > 0) {
        showToast(errors.join('\n'), 'error');
        return;
    }

    var updateData = { id: item.id };

    if (serviceType === 'asesoria') {
        updateData.date = document.getElementById('edit-date').value;
        updateData.time = document.getElementById('edit-time').value;
        updateData.phone = document.getElementById('edit-phone').value;
    } else if (serviceType === 'evento') {
        updateData.num_persons = parseInt(document.getElementById('edit-num-persons').value) || 1;
        updateData.phone = document.getElementById('edit-phone').value;
    } else if (serviceType === 'curso') {
        updateData.phone = document.getElementById('edit-phone').value;
    }

    updateData.notes = document.getElementById('edit-notes').value;

    try {
        var response = await fetch('/backend/api/advisory-update.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        var result = await response.json();

        // Si hay comprobante de pago, subirlo
        var receiptInput = document.getElementById('edit-receipt');
        if (receiptInput && receiptInput.files.length > 0) {
            var file = receiptInput.files[0];
            var reader = new FileReader();
            reader.onload = async function(e) {
                var base64 = e.target.result;
                try {
                    var receiptResponse = await fetch('/backend/api/advisory-receipt.php', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: item.id,
                            payment_receipt: base64
                        })
                    });
                    var receiptResult = await receiptResponse.json();
                    if (receiptResult.success) {
                        showToast('Solicitud y comprobante actualizados', 'success');
                    }
                } catch (err) {
                    showToast('Error al subir comprobante', 'error');
                }
            };
            reader.readAsDataURL(file);
        }

        if (result.success) {
            showToast('Solicitud actualizada correctamente', 'success');
            closeEditSolicitudModal();
            loadMyAdvisories();
        } else {
            showToast(result.message || 'Error al actualizar', 'error');
        }
    } catch (e) {
        showToast('Error al guardar los cambios', 'error');
    }
};

// Cerrar modal de detalles al hacer clic fuera
document.addEventListener('click', function(e) {
    var modal = document.getElementById('detalles-solicitud-modal');
    if (modal && !modal.classList.contains('hidden') && e.target === modal) {
        modal.classList.add('hidden');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle for all pages
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    // Formulario de edición de perfil
    const editProfileBtn = document.getElementById('edit-profile');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const actionButtons = document.getElementById('action-buttons');
    const profileForm = document.getElementById('profile-form');

    if (editProfileBtn && profileForm) {
        const profileInputs = profileForm.querySelectorAll('input');
        
        editProfileBtn.addEventListener('click', () => {
            profileInputs.forEach(input => input.disabled = false);
            actionButtons.classList.remove('hidden');
            editProfileBtn.classList.add('hidden');
        });
        
        cancelEditBtn.addEventListener('click', () => {
            profileInputs.forEach(input => input.disabled = true);
            actionButtons.classList.add('hidden');
            editProfileBtn.classList.remove('hidden');
            profileForm.reset();
        });
        
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Profile changes saved');
            profileInputs.forEach(input => input.disabled = true);
            actionButtons.classList.add('hidden');
            editProfileBtn.classList.remove('hidden');
        });
    }
    
    // Formulario de cambio de contraseña
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Password change requested');
            passwordForm.reset();
        });
    }

    // Formulario de asesoría
    const advisoryForm = document.getElementById('advisory-form');
    const successMessage = document.getElementById('success-message');

    if (advisoryForm && successMessage) {
        advisoryForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (window.agendarJsLoaded) {
                return;
            }

            // Determinar el tipo de servicio según la categoría seleccionada
            let service = '';
            const serviceTypeBtns = document.querySelectorAll('.service-type-btn');
            let selectedType = 'asesoria';

            console.log('Formulario submit - botones encontrados:', serviceTypeBtns.length);

            serviceTypeBtns.forEach(btn => {
                if (btn.classList.contains('bg-purple-600')) {
                    selectedType = btn.getAttribute('data-type');
                }
            });

            // Obtener el valor del subtype según la categoría
            let numPersons = 1;
            let advisoryType = null;
            let advisoryService = null;
            let advisoryMode = null;
            let eventName = null;

            if (selectedType === 'asesoria') {
                advisoryType = document.getElementById('advisory-subtype')?.value;
                advisoryService = document.getElementById('advisory-service')?.value;
                advisoryMode = document.getElementById('advisory-mode')?.value;
                const fecha = document.getElementById('advisory-date')?.value;
                const hora = document.getElementById('advisory-time')?.value;

                // Validar número de personas si es negocio
                if (advisoryType === 'asesoria_negocio') {
                    numPersons = parseInt(document.getElementById('advisory-asesoria-persons')?.value) || 0;
                    if (numPersons < 1) {
                        showToast('Ingresa el número de personas para la asesoría de negocio', 'error');
                        return;
                    }
                }

                if (!advisoryType || !advisoryService || !advisoryMode || !fecha || !hora) {
                    showToast('Completa todos los campos de asesoría (incluyendo fecha y hora)', 'error');
                    return;
                }
                service = 'Asesoría ' + (advisoryType === 'asesoria_personal' ? 'Personal' : 'Negocio');
            } else if (selectedType === 'curso') {
                advisoryService = document.getElementById('advisory-course')?.value;
                if (!advisoryService) {
                    showToast('Selecciona un curso', 'error');
                    return;
                }
                service = 'Curso';
                numPersons = 1;
            } else if (selectedType === 'evento') {
                const personas = document.getElementById('advisory-event-persons')?.value;
                const eventSelect = document.getElementById('advisory-event');
                advisoryService = eventSelect?.value || '';
                eventName = eventSelect?.options[eventSelect.selectedIndex]?.textContent || '';

                if (!personas || personas < 1) {
                    showToast('Ingresa el número de personas', 'error');
                    return;
                }
                if (!advisoryService) {
                    showToast('Selecciona un evento', 'error');
                    return;
                }
                service = 'Evento';
                numPersons = parseInt(personas);
            }

            const date = document.getElementById('advisory-date')?.value;
            const time = document.getElementById('advisory-time')?.value;
            const notes = document.getElementById('advisory-details')?.value;

            // Obtener teléfono según el tipo de servicio
            let phone = '';
            if (selectedType === 'asesoria') {
                phone = document.getElementById('advisory-phone')?.value || '';
            } else if (selectedType === 'curso') {
                phone = document.getElementById('advisory-course-phone')?.value || '';
            } else if (selectedType === 'evento') {
                phone = document.getElementById('advisory-event-phone')?.value || '';
            }

            // Validar que el teléfono no esté vacío
            if (!phone.trim()) {
                showToast('Ingresa tu número de teléfono', 'error');
                return;
            }

            const user = getCurrentUser();

            // Obtener precio del select correspondiente
            let servicePrice = 0;
            if (selectedType === 'asesoria') {
                const sel = document.getElementById('advisory-service');
                servicePrice = sel?.options[sel.selectedIndex]?.dataset?.price || 0;
            } else if (selectedType === 'curso') {
                const sel = document.getElementById('advisory-course');
                servicePrice = sel?.options[sel.selectedIndex]?.dataset?.price || 0;
            } else if (selectedType === 'evento') {
                const sel = document.getElementById('advisory-event');
                servicePrice = sel?.options[sel.selectedIndex]?.dataset?.price || 0;
            }

            // Validar que el checkbox de términos esté marcado
            const termsCheckbox = document.getElementById('terms-checkbox');
            if (!termsCheckbox || !termsCheckbox.checked) {
                showToast('Debes aceptar los términos y condiciones', 'error');
                return;
            }

            try {
                // Guardar los datos del formulario para enviarlos después con el comprobante
                window.pendingFormData = {
                    name: user?.name || 'Usuario',
                    email: user?.email || '',
                    phone: phone,
                    service: service,
                    price: servicePrice,
                    date: date || '',
                    time: time || '',
                    notes: notes || '',
                    serviceType: selectedType,
                    numPersons: numPersons,
                    advisoryType: advisoryType,
                    advisoryService: advisoryService,
                    advisoryMode: advisoryMode,
                    eventName: eventName
                };

                // Mostrar modal de pago Nequi sin enviar datos aún
                const priceStr = '$' + Number(servicePrice).toLocaleString('es-CO');
                if (typeof openPaymentModal === 'function') {
                    openPaymentModal({
                        reference: selectedType === 'asesoria' ? 'ASES-' + Date.now() :
                                   selectedType === 'evento' ? 'EVT-' + Date.now() : 'PAGO-' + Date.now(),
                        price: priceStr,
                        service: service
                    });
                }
            } catch (error) {
                showToast('Error al procesar la solicitud', 'error');
            }
        });
    }

    // Reservation form functionality
    const reservationType = document.getElementById('reservation-type');
    const courseSelection = document.getElementById('course-selection');
    const advisorySelection = document.getElementById('advisory-selection');
    const eventSelection = document.getElementById('event-selection');

    if (reservationType) {
        reservationType.addEventListener('change', function() {
            if (this.value === 'curso') {
                courseSelection.style.display = 'block';
                advisorySelection.style.display = 'none';
                eventSelection.style.display = 'none';
            } else if (this.value === 'asesoria') {
                courseSelection.style.display = 'none';
                advisorySelection.style.display = 'block';
                eventSelection.style.display = 'none';
            } else if (this.value === 'evento') {
                courseSelection.style.display = 'none';
                advisorySelection.style.display = 'none';
                eventSelection.style.display = 'block';
            } else {
                courseSelection.style.display = 'none';
                advisorySelection.style.display = 'none';
                eventSelection.style.display = 'none';
            }
        });
    }

    const idTypeSelect = document.getElementById('reservation-idtype');
    const otherIdTypeContainer = document.getElementById('other-idtype-container');

    if (idTypeSelect) {
        idTypeSelect.addEventListener('change', function() {
            if (this.value === 'otro') {
                otherIdTypeContainer.style.display = 'block';
                document.getElementById('other-idtype').setAttribute('required', 'required');
            } else {
                otherIdTypeContainer.style.display = 'none';
                document.getElementById('other-idtype').removeAttribute('required');
            }
        });
    }
    
    const reservationForm = document.getElementById('reservation-form');
    if (reservationForm) {
        reservationForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const type = document.getElementById('reservation-type').value;
            const date = document.getElementById('reservation-date').value;
            const message = document.getElementById('reservation-message').value;
            const messageDisplay = document.getElementById('reservation-message-display');

            if (!type || !date) {
                showToast('Por favor, completa todos los campos requeridos.', 'error');
                return;
            }

            // Simulación de envío de reserva
            console.log('Reserva enviada:', { type, date, message });
            messageDisplay.classList.remove('hidden');
            setTimeout(() => {
                messageDisplay.classList.add('hidden');
                event.target.reset();
                if(courseSelection) courseSelection.style.display = 'none';
                if(advisorySelection) advisorySelection.style.display = 'none';
            }, 3000);
        });
    }

    // Scroll reveal animation
    function reveal() {
        const reveals = document.querySelectorAll('.reveal');
        for (let i = 0; i < reveals.length; i++) {
            const windowHeight = window.innerHeight;
            const elementTop = reveals[i].getBoundingClientRect().top;
            const elementVisible = 150;
            if (elementTop < windowHeight - elementVisible) {
                reveals[i].classList.add('active');
            } else {
                reveals[i].classList.remove('active');
            }
        }
    }

    window.addEventListener('scroll', reveal);
    reveal(); // Initial check

    // Manejar envío del formulario de registro
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const security_question = document.getElementById('register-security-question').value;
            const security_answer = document.getElementById('register-security-answer').value;
            const register_phoneEl = document.getElementById('register-phone');
            let phone = '';
            if (register_phoneEl && register_phoneEl.value) {
                phone = register_phoneEl.value;
            } else {
                // Extraer el teléfono desde el placeholder si el input fue deshabilitado y no tiene value
                const ph = register_phoneEl ? (register_phoneEl.getAttribute('placeholder') || '') : '';
                // buscar el primer grupo de 10-15 dígitos
                const m = ph.match(/\d{7,15}/);
                phone = m ? m[0] : '';
            }

            
            const notify_email = document.getElementById('register-notify-email').checked;
            const notify_whatsapp = document.getElementById('register-notify-whatsapp').checked;


            try {
const response = await fetch('/backend/api/register.php', {


                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, email, password, phone, security_question, security_answer, notify_email, notify_whatsapp })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showAlert('Registro exitoso. Por favor inicia sesión.', 'success');
                    // Limpiar formulario
                    registerForm.reset();
                    // Redirigir al login después de 2 segundos
                    setTimeout(() => {
                        document.querySelector('#login-form').scrollIntoView({ behavior: 'smooth' });
                    }, 2000);
                } else {
                    showAlert(data.message || 'Error en el registro', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showAlert('Error de conexión con el servidor', 'error');
            }
        });
    }
    
    // Manejar envío del formulario de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
try {
const response = await fetch('/backend/api/login.php', {

                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showAlert(`Bienvenido ${data.user.name}`, 'success');
                    // Guardar usuario en localStorage
                    setCurrentUser(data.user);
                    
                    // Redirigir según rol después de 1 segundo
                    setTimeout(() => {
                        // Si venimos a registro por intención de catálogo, volvemos al catálogo.
                        try {
                            var after = sessionStorage.getItem('redirectAfterLogin');
                            sessionStorage.removeItem('redirectAfterLogin');
                            if (after === 'catalogo') {
                                window.location.href = 'catalogo.html';
                                return;
                            }
                        } catch (e) {}
                        redirectToDashboard();
                    }, 1000);
                } else {
                    showAlert(data.message || 'Error al iniciar sesión', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showAlert('Error de conexión con el servidor', 'error');
            }
        });
    }
    
    // Mostrar nombre de usuario en el dashboard si está logueado
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        const user = getCurrentUser();
        if (user) {
            userNameElement.textContent = user.name;
        } else {
            // Si no hay usuario, redirigir al login
            window.location.href = '../registro.html';
        }
    }
    
    // Manejar botón de logout
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

   
    // Funcionalidad de FAQ
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const icon = this.querySelector('svg');
            
            // Toggle visibility of answer
            answer.classList.toggle('hidden');
            
            // Rotate icon
            icon.classList.toggle('rotate-180');
        });
    });

    // Funcionalidad del modal de detalles del curso
    window.showCourseDetails = function(courseName, descriptionDetail) {
        // Mostrar el modal
        document.getElementById('courseTitle').textContent = courseName;
        document.getElementById('courseDetailsContent').textContent = descriptionDetail || "Descripción detallada no disponible.";
        document.getElementById('courseDetailsModal').classList.remove('hidden');
    };
    
    window.closeCourseDetails = function() {
        document.getElementById('courseDetailsModal').classList.add('hidden');
    };

    // Cerrar el modal al hacer clic fuera del contenido
    const courseDetailsModal = document.getElementById('courseDetailsModal');
    if (courseDetailsModal) {
        courseDetailsModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeCourseDetails();
            }
        });
    }
    
    // Efecto de scroll solo para el header
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

});

// Función para alternar menú móvil
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

// Función para mostrar alertas (usa toasts para consistencia)
function showAlert(message, type = 'success') {
    showToast(message, type);
}

// Función para obtener datos del usuario desde localStorage
function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

// Función para guardar datos del usuario en localStorage
function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('currentUser');
    // Detectar si estamos en subdirectorio (admin/user)
    const isSubdir = window.location.pathname.includes('/views/');
    window.location.href = isSubdir ? '../../index.html' : './index.html';
}

// Función para redirigir según rol del usuario
function redirectToDashboard() {

    // Si existe el modal de inscripción en esta página, exponer funciones globales.
    // (Usadas por views/catalogo.html y assets/catalog-courses.js)
    window.showInscriptionModal = function(courseName, coursePrice) {
        var user = getCurrentUser();
        if (!user) {
            // Guardar intención y redirigir al login/registro
            try { sessionStorage.setItem('redirectAfterLogin', 'catalogo'); } catch (e) {}
            window.location.href = 'views/registro.html';
            return;
        }
        var modal = document.getElementById('inscriptionModal');
        var nameEl = document.getElementById('inscriptionCourseName');
        var priceEl = document.getElementById('inscriptionCoursePrice');
        var whatsappEl = document.getElementById('whatsappInscription');
        if (!modal || !nameEl || !priceEl || !whatsappEl) return;

        nameEl.textContent = courseName;
        priceEl.textContent = coursePrice;

        var message = `Hola Chef Jonathan, quiero inscribirme en el curso: ${courseName} (${coursePrice}). Adjunto comprobante de pago.`;
        whatsappEl.href = `https://wa.me/573229452346?text=${encodeURIComponent(message)}`;

        modal.classList.remove('hidden');
    };

    window.closeInscriptionModal = function() {
        var modal = document.getElementById('inscriptionModal');
        if (modal) modal.classList.add('hidden');
    };

    const user = getCurrentUser();
    if (user) {
        switch(user.role) {
            case 'admin':
                window.location.href = 'admin/admin.html';
                break;
            case 'user':
                window.location.href = 'user/user.html';
                break;
            default:
                window.location.href = '../index.html';
        }
    }
}

// Función para toggle de FAQ
function toggleFAQ(button) {
    const answer = button.nextElementSibling;
    const icon = button.querySelector('svg');
    const isHidden = answer.classList.contains('hidden');

    // Close all other answers
    const allAnswers = document.querySelectorAll('.faq-answer');
    const allIcons = document.querySelectorAll('.faq-question svg');

    allAnswers.forEach(ans => {
        if (ans !== answer) {
            ans.classList.add('hidden');
        }
    });

    allIcons.forEach(ic => {
        if (ic !== icon) {
            ic.classList.remove('rotate-180');
        }
    });

    // Toggle the clicked answer
    if (isHidden) {
        answer.classList.remove('hidden');
        icon.classList.add('rotate-180');
    } else {
        answer.classList.add('hidden');
        icon.classList.remove('rotate-180');
    }
}

// --- Dynamic table renderers for clients, sales and users ---
(function(){
    const STORAGE_KEY = 'chef_localDB_v1';

    function loadLocalDB(){
        try{
            const raw = localStorage.getItem(STORAGE_KEY);
            if(!raw) return { users: [], clients: [], sales: [], visits: [], services: [], inscriptions: [] };
            return JSON.parse(raw);
        }catch(e){
            console.error('Error parseando localDB:', e);
            return { users: [], clients: [], sales: [], visits: [], services: [], inscriptions: [] };
        }
    }

    function formatDate(iso){
        if(!iso) return '';
        try{ const d = new Date(iso); return d.toLocaleString(); }catch(e){ return iso; }
    }

    function renderUsers(){
        const tbody = document.getElementById('users-tbody');
        if(!tbody) return;
        const db = loadLocalDB();
        tbody.innerHTML = '';
        db.users.slice().reverse().forEach(u => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-800';
            tr.innerHTML = `
                <td class="py-3 text-gray-400 text-sm">${u.id || ''}</td>
                <td class="py-3 text-white text-sm">${escapeHtml(u.name || '')}</td>
                <td class="py-3 text-gray-400 text-sm">${escapeHtml(u.email || '')}</td>
                <td class="py-3 text-gray-400 text-sm">${formatDate(u.createdAt)}</td>
                <td class="py-3"><span class="px-2 py-1 bg-green-900 text-green-300 rounded-full text-xs">Activo</span></td>
                <td class="py-3">
                    <div class="flex space-x-1">
                        <button data-id="${u.id}" class="btn-edit-user px-2 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 text-xs">Editar</button>
                        <button data-id="${u.id}" class="btn-delete-user px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs">Eliminar</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderClients(){
        const tbody = document.getElementById('clients-tbody');
        if(!tbody) return;
        const db = loadLocalDB();
        tbody.innerHTML = '';
        db.clients.slice().reverse().forEach(c => {
            const tr = document.createElement('tr');
            tr.className = 'border-t border-gray-700';
            const interestsArr = Array.isArray(c.interests) ? c.interests : (c.interests ? String(c.interests).split(',') : []);
            const chips = interestsArr.map(i => `<span class="px-2 py-1 bg-purple-900 text-purple-300 rounded-full text-xs">${escapeHtml(i)}</span>`).join(' ');
            tr.innerHTML = `
                <td class="p-4 text-gray-300">${c.id || ''}</td>
                <td class="p-4 text-white">${escapeHtml(c.name || '')}</td>
                <td class="p-4 text-gray-300">${escapeHtml(c.email || '')}</td>
                <td class="p-4 text-gray-300">${escapeHtml(c.phone || '')}</td>
                <td class="p-4 text-gray-300">${escapeHtml(c.city || '')}</td>
                <td class="p-4"><div class="flex flex-wrap gap-2">${chips}</div></td>
                <td class="p-4"><div class="flex space-x-2"><button data-id="${c.id}" class="btn-view-client text-amber-500 hover:text-amber-400">Ver</button><button data-id="${c.id}" class="btn-edit-client text-purple-500 hover:text-purple-400">Editar</button><button data-id="${c.id}" class="btn-delete-client text-red-500 hover:text-red-400">Eliminar</button></div></td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderSales(){
        const tbody = document.getElementById('sales-tbody');
        if(!tbody) return;
        const db = loadLocalDB();
        tbody.innerHTML = '';
        db.sales.slice().reverse().forEach(s => {
            const tr = document.createElement('tr');
            tr.className = 'border-t border-gray-700';
            tr.innerHTML = `
                <td class="p-4 text-gray-300">${s.id || ''}</td>
                <td class="p-4 text-gray-300">${formatDate(s.createdAt)}</td>
                <td class="p-4 text-white">${escapeHtml(s.client || '')}</td>
                <td class="p-4 text-gray-300">${escapeHtml(s.service || '')}</td>
                <td class="p-4 text-green-500">${s.amount ? ('$' + Number(s.amount).toLocaleString('es-CO')) : ''}</td>
                <td class="p-4"><span class="px-2 py-1 bg-green-900 text-green-300 rounded-full text-sm">Completada</span></td>
                <td class="p-4"><div class="flex space-x-2"><button data-id="${s.id}" class="btn-view-sale text-amber-500 hover:text-amber-400">Ver</button><button data-id="${s.id}" class="btn-edit-sale text-purple-500 hover:text-purple-400">Editar</button><button data-id="${s.id}" class="btn-delete-sale text-red-500 hover:text-red-400">Eliminar</button></div></td>
            `;
            tbody.appendChild(tr);
        });
    }

    function escapeHtml(str){
        if(!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Polling localStorage for changes and re-render tables when needed
    let lastSnapshot = '';
    function pollAndRender(){
        // Skip polling on admin pages to avoid conflicts with admin-tables.js
        if (window.location.pathname.includes('/admin/')) return;
        
        const raw = localStorage.getItem(STORAGE_KEY) || '';
        if(raw !== lastSnapshot){
            lastSnapshot = raw;
            try{ renderUsers(); }catch(e){}
            try{ renderClients(); }catch(e){}
            try{ renderSales(); }catch(e){}
        }
    }

    // Start polling every 1s
    setInterval(pollAndRender, 1000);
    // Initial render
    pollAndRender();

})();
// --- Immediate save helpers and form handlers (attach safely) ---
(function(){
    const STORAGE_KEY = 'chef_localDB_v1';

    function loadLocalDB(){
        try{ const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : { users: [], clients: [], sales: [], visits: [], services: [], inscriptions: [] }; }catch(e){ return { users: [], clients: [], sales: [], visits: [], services: [], inscriptions: [] }; }
    }

    function saveLocalDB(db){
        try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); }catch(e){ console.error('Error saving localDB', e); }
    }

    function ensureCollections(db){
        db.users = Array.isArray(db.users) ? db.users : [];
        db.clients = Array.isArray(db.clients) ? db.clients : [];
        db.sales = Array.isArray(db.sales) ? db.sales : [];
        db.visits = Array.isArray(db.visits) ? db.visits : [];
        db.services = Array.isArray(db.services) ? db.services : [];
        db.inscriptions = Array.isArray(db.inscriptions) ? db.inscriptions : [];
    }

    function formatCurrency(value){
        if(value === undefined || value === null || value === '') return '';
        const num = Number(value);
        if(isNaN(num)) return escapeHtml(String(value));
        return '$' + num.toLocaleString('es-CO');
    }

    function attachFormHandlers(){
        // Create user
        const userForm = document.getElementById('create-user-form');
        if(userForm && !userForm._bound){
            userForm.addEventListener('submit', function(e){
                e.preventDefault();
                const name = document.getElementById('user-name') ? document.getElementById('user-name').value.trim() : '';
                const email = document.getElementById('user-email') ? document.getElementById('user-email').value.trim() : '';
                const password = document.getElementById('user-password') ? document.getElementById('user-password').value : '';
                const db = loadLocalDB(); ensureCollections(db);
                const obj = { id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, name, email, password, createdAt: new Date().toISOString() };
                db.users = db.users || [];
                db.users.push(obj);
                saveLocalDB(db);
                console.log('Formulario (create-user-form) guardado en colección: users', obj);
                try{ if(typeof renderUsers === 'function') renderUsers(); }catch(e){}
                userForm.reset();
            });
            userForm._bound = true;
        }

        // New client
        const clientForm = document.getElementById('new-client-form');
        if(clientForm && !clientForm._bound){
            clientForm.addEventListener('submit', function(e){
                e.preventDefault();
                const name = document.getElementById('client-name') ? document.getElementById('client-name').value.trim() : '';
                const email = document.getElementById('client-email') ? document.getElementById('client-email').value.trim() : '';
                const phone = document.getElementById('client-phone') ? document.getElementById('client-phone').value.trim() : '';
                const city = document.getElementById('client-city') ? document.getElementById('client-city').value.trim() : '';
                const notes = document.getElementById('client-notes') ? document.getElementById('client-notes').value.trim() : '';
                // interests checkboxes
                const interestEls = document.querySelectorAll('input[name="interests"]');
                const interests = [];
                interestEls.forEach(i => { if(i.checked) interests.push(i.value); });

                const db = loadLocalDB(); ensureCollections(db);
                const obj = { id: Date.now(), name, email, phone, city, interests, notes, createdAt: new Date().toISOString() };
                db.clients = db.clients || [];
                db.clients.push(obj);
                saveLocalDB(db);
                console.log('Formulario (new-client-form) guardado en colección: clients', obj);
                try{ if(typeof renderClients === 'function') renderClients(); }catch(e){}
                clientForm.reset();
            });
            clientForm._bound = true;
        }

        // New sale
        const saleForm = document.getElementById('new-sale-form');
        if(saleForm && !saleForm._bound){
            saleForm.addEventListener('submit', function(e){
                e.preventDefault();
                const client = document.getElementById('sale-client') ? document.getElementById('sale-client').value.trim() : '';
                const service = document.getElementById('sale-service') ? document.getElementById('sale-service').value : '';
                const amount = document.getElementById('sale-amount') ? document.getElementById('sale-amount').value : '';
                const paymentMethod = document.getElementById('sale-payment') ? document.getElementById('sale-payment').value : '';
                const notes = document.getElementById('sale-notes') ? document.getElementById('sale-notes').value.trim() : '';

                const db = loadLocalDB(); ensureCollections(db);
                const obj = { id: Date.now(), client, service, amount, paymentMethod, notes, createdAt: new Date().toISOString() };
                db.sales = db.sales || [];
                db.sales.push(obj);
                saveLocalDB(db);
                console.log('Formulario (new-sale-form) guardado en colección: sales', obj);
                try{ if(typeof renderSales === 'function') renderSales(); }catch(e){}
                saleForm.reset();
            });
            saleForm._bound = true;
        }
    }

    // --- Validation helpers ---
    function isEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'')); }
    function isPhone(v){ return /^[0-9+\s-]{7,20}$/.test(String(v||'')); }
    function isNumeric(v){ return !isNaN(Number(v)) && v !== ''; }

    // --- Edit/Delete event delegation ---
    document.addEventListener('click', function(e){
        const t = e.target;

        // Users
        if(t.matches('.btn-edit-user')){
            const id = t.getAttribute('data-id');
            const db = loadLocalDB(); if(!db) return;
            const idx = (db.users||[]).findIndex(x => String(x.id) === String(id));
            if(idx === -1) return showToast('Usuario no encontrado', 'error');
            const user = db.users[idx];
            const name = prompt('Nombre:', user.name || '');
            if(name === null) return;
            const email = prompt('Email:', user.email || '');
            if(email === null) return;
            if(!name.trim()){ return showToast('El nombre es requerido', 'error'); }
            if(!isEmail(email)){ return showToast('Email no válido', 'error'); }
            user.name = name.trim(); user.email = email.trim(); user.updatedAt = new Date().toISOString();
            db.users[idx] = user; saveLocalDB(db); try{ renderUsers(); }catch(e){}
            return;
        }
        if(t.matches('.btn-delete-user')){
            const id = t.getAttribute('data-id');
            if(!confirm('Eliminar usuario?')) return;
            const db = loadLocalDB(); db.users = (db.users||[]).filter(x => String(x.id) !== String(id)); saveLocalDB(db); try{ renderUsers(); }catch(e){}
            return;
        }

        // Clients
        if(t.matches('.btn-edit-client')){
            const id = t.getAttribute('data-id');
            const db = loadLocalDB();
            const idx = (db.clients||[]).findIndex(x => String(x.id) === String(id));
            if(idx===-1) return showToast('Cliente no encontrado', 'error');

            const client = db.clients[idx];
            const name = prompt('Nombre:', client.name||'');
            if(name===null) return;
            if(!name.trim()) return showToast('Nombre requerido', 'error');

            const email = prompt('Email:', client.email||'');
            if(email===null) return;
            if(email && !isEmail(email)) return showToast('Email no válido', 'error');

            const phone = prompt('Teléfono:', client.phone||'');
            if(phone===null) return;
            if(phone && !isPhone(phone)) return showToast('Teléfono no válido', 'error');

            client.name = name.trim();
            client.email = email.trim();
            client.phone = phone.trim();
            client.updatedAt = new Date().toISOString();
            db.clients[idx]=client;
            saveLocalDB(db);
            try{ renderClients(); }catch(e){}
            return;
        }
        if(t.matches('.btn-delete-client')){
            const id = t.getAttribute('data-id');
            if(!confirm('Eliminar cliente?')) return;
            const db = loadLocalDB();
            db.clients = (db.clients||[]).filter(x => String(x.id)!==String(id));
            saveLocalDB(db);
            try{ renderClients(); }catch(e){}
            return;
        }

        // Sales
        if(t.matches('.btn-edit-sale')){
            const id = t.getAttribute('data-id');
            const db = loadLocalDB();
            const idx = (db.sales||[]).findIndex(x => String(x.id) === String(id));
            if(idx===-1) return showToast('Venta no encontrada', 'error');

            const sale = db.sales[idx];
            const client = prompt('Cliente:', sale.client||'');
            if(client===null) return;
            if(!client.trim()) return showToast('Cliente requerido', 'error');

            const service = prompt('Servicio:', sale.service||'');
            if(service===null) return;
            const amount = prompt('Monto:', sale.amount||'');
            if(amount===null) return;
            if(amount && !isNumeric(amount)) return showToast('Monto inválido', 'error');

            sale.client = client.trim();
            sale.service = service.trim();
            sale.amount = amount;
            sale.updatedAt = new Date().toISOString();
            db.sales[idx]=sale;
            saveLocalDB(db);
            try{ renderSales(); }catch(e){}
            return;
        }
        if(t.matches('.btn-delete-sale')){
            const id = t.getAttribute('data-id');
            if(!confirm('Eliminar venta?')) return;
            const db = loadLocalDB();
            db.sales = (db.sales||[]).filter(x => String(x.id)!==String(id));
            saveLocalDB(db);
            try{ renderSales(); }catch(e){}
            return;
        }
    });

    // Attach now and also on DOMContentLoaded to be safe
    try{ attachFormHandlers(); }catch(e){}
document.addEventListener && document.addEventListener('DOMContentLoaded', attachFormHandlers);

    // Set greeting name placeholders (admin/user pages)
    (function setGreetingNames(){
        try {
            var user = getCurrentUser();
            var name = (user && user.name) ? user.name : 'Usuario';

            var map = [
                { id: 'user-greeting-name' },
                { id: 'admin-greeting-name' }
            ];

            map.forEach(function(item){
                var el = document.getElementById(item.id);
                if (el) el.textContent = name;
            });
        } catch (e) {
            // no-op
        }
    })();

    // Enhance render functions to use formatting helpers if available

    // (They live in the other IIFE scope; we rely on those names existing)

})();