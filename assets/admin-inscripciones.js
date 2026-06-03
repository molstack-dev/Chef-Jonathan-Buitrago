// Gestión completa de admin-inscripciones
(function() {
    let currentFilterType = 'all';
    let currentFilterStatus = 'all';
    let allAdvisories = [];
    let allInscriptions = [];

    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `px-4 py-3 rounded-lg shadow-lg text-white text-sm animate-fade-in ${
            type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-amber-600'
        }`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.remove('animate-fade-in');
            toast.classList.add('animate-fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function getServiceTypeLabel(item) {
        if (item.service_type === 'asesoria') return 'Asesoría';
        if (item.service_type === 'curso') return 'Curso';
        if (item.service_type === 'evento') return 'Evento';
        return item.service_type || 'N/A';
    }

    function getServiceDetails(item) {
        var details = [];
        if (item.advisory_mode) details.push('Modalidad: ' + item.advisory_mode);
        if (item.date) details.push('Fecha: ' + new Date(item.date).toLocaleDateString('es-ES'));
        if (item.time) details.push('Hora: ' + item.time);
        if (item.num_persons && item.num_persons > 1) details.push('Personas: ' + item.num_persons);
        if (item.notes) details.push('Notas: ' + item.notes);
        return details;
    }

    async function loadAdvisories() {
        try {
            const response = await fetch('/backend/api/advisories-get.php', { credentials: 'include' });
            const result = await response.json();
            const tbody = document.getElementById('advisories-tbody');
            if (!tbody) return;

            if (result.success && result.data.length > 0) {
                allAdvisories = result.data;

                // Solo mostrar pendientes
                let pending = result.data.filter(item => item.status === 'pending');

                if (currentFilterType !== 'all') {
                    pending = pending.filter(item => item.service_type === currentFilterType);
                }

                if (pending.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="10" class="py-6 text-center text-gray-400">No hay solicitudes pendientes.</td></tr>';
                    return;
                }

                tbody.innerHTML = '';
                pending.forEach(function(item) {
                    var statusClass = 'bg-yellow-900 text-yellow-300';
                    var statusLabel = 'Pendiente';

                    var priceStr = item.price && item.price > 0 ? '$' + Number(item.price).toLocaleString('es-CO') : 'N/A';

                    var serviceName = item.advisory_service || item.event_name || 'N/A';
                    serviceName = serviceName.replace(/_/g, ' ');

                    var detailsArr = getServiceDetails(item);
                    var detailsStr = detailsArr.join('\n');

                    var typeLabel = getServiceTypeLabel(item);

                    var receiptBtn = item.payment_receipt ?
                        '<button type="button" class="view-receipt-btn px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs" data-receipt="' + item.payment_receipt + '">Ver Comprobante</button>' :
                        '<span class="text-gray-500 text-xs">Sin comprobante</span>';

                    var row = document.createElement('tr');
                    row.className = 'border-b border-gray-800';
                    row.innerHTML = `
                        <td class="py-3 text-gray-400 text-sm">${String(item.id).padStart(3, '0')}</td>
                        <td class="py-3 text-white text-sm">${item.user_name || item.client_name || 'N/A'}</td>
                        <td class="py-3 text-gray-400 text-sm">${item.email || 'N/A'}</td>
                        <td class="py-3 text-gray-400 text-sm">${item.phone || 'N/A'}</td>
                        <td class="py-3 text-gray-400 text-sm">${typeLabel}</td>
                        <td class="py-3 text-gray-400 text-sm">${serviceName}</td>
                        <td class="py-3">
                            <button type="button" class="view-details-btn px-2 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 text-xs" data-details="${encodeURIComponent(detailsStr)}">Ver más</button>
                        </td>
                        <td class="py-3 text-gray-400 text-sm">${priceStr}</td>
                        <td class="py-3">
                            <span class="px-2 py-1 ${statusClass} rounded-full text-xs">${statusLabel}</span>
                        </td>
                        <td class="py-3">
                            <div class="flex flex-col space-y-1">
                                ${receiptBtn}
                                <button type="button" class="approve-payment-btn px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs" data-id="${item.id}">Aprobar</button>
                                <button type="button" class="reject-payment-btn px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs" data-id="${item.id}">Rechazar</button>
                                <button type="button" class="delete-advisory-btn px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 text-xs" data-id="${item.id}">Eliminar</button>
                            </div>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                allAdvisories = [];
                tbody.innerHTML = '<tr><td colspan="10" class="py-6 text-center text-gray-400">No hay solicitudes pendientes.</td></tr>';
            }
        } catch (error) {
            const tbody = document.getElementById('advisories-tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="10" class="py-6 text-center text-red-300">Error al cargar solicitudes.</td></tr>';
            }
        }
    }

    async function loadAdvisoryHistory() {
        try {
            const response = await fetch('/backend/api/advisories-get.php', { credentials: 'include' });
            const result = await response.json();
            const tbody = document.getElementById('inscriptions-tbody');
            if (!tbody) return;

            if (result.success && result.data.length > 0) {
                // Solo mostrar completados y cancelados (confirmed = aprobado, completed = cours completed)
                let history = result.data.filter(item => item.status === 'confirmed' || item.status === 'completed' || item.status === 'cancelled');

                if (history.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" class="py-6 text-center text-gray-400">No hay historial de solicitudes.</td></tr>';
                    return;
                }

                tbody.innerHTML = '';
                history.forEach(function(item) {
                    var statusClass = item.status === 'confirmed' ? 'bg-blue-900 text-blue-300' : item.status === 'completed' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300';
                    var statusLabel = item.status === 'confirmed' ? 'Aprobado' : item.status === 'completed' ? 'Completado' : 'Cancelado';

                    var priceStr = item.price && item.price > 0 ? '$' + Number(item.price).toLocaleString('es-CO') : 'N/A';

                    var serviceName = item.advisory_service || item.event_name || 'N/A';
                    serviceName = serviceName.replace(/_/g, ' ');

                    var typeLabel = getServiceTypeLabel(item);

                    var row = document.createElement('tr');
                    row.className = 'border-b border-gray-800';
                    row.innerHTML = `
                        <td class="py-3 text-gray-400 text-sm">${String(item.id).padStart(3, '0')}</td>
                        <td class="py-3 text-white text-sm">${item.user_name || item.client_name || 'N/A'}</td>
                        <td class="py-3 text-gray-400 text-sm">${typeLabel}</td>
                        <td class="py-3 text-gray-400 text-sm">${serviceName}</td>
                        <td class="py-3 text-gray-400 text-sm">${priceStr}</td>
                        <td class="py-3">
                            <span class="px-2 py-1 ${statusClass} rounded-full text-xs">${statusLabel}</span>
                        </td>
                        <td class="py-3">
                            <button type="button" class="delete-advisory-btn px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 text-xs" data-id="${item.id}">Eliminar</button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="7" class="py-6 text-center text-gray-400">No hay historial de solicitudes.</td></tr>';
            }
        } catch (error) {
            const tbody = document.getElementById('inscriptions-tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="7" class="py-6 text-center text-red-300">Error al cargar historial.</td></tr>';
            }
        }
    }

    async function loadInscriptions() {
        try {
            const response = await fetch('/backend/api/inscripciones-get.php', { credentials: 'include' });
            const result = await response.json();
            const tbody = document.getElementById('inscriptions-tbody');
            if (!tbody) return;

            if (result.success && result.data && result.data.length > 0) {
                allInscriptions = result.data;
                tbody.innerHTML = '';
                result.data.forEach(function(item) {
                    var statusClass = item.payment_status === 'paid' ? 'bg-green-900 text-green-300' :
                        item.payment_status === 'rejected' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300';
                    var statusLabel = item.payment_status === 'paid' ? 'Pagado' :
                        item.payment_status === 'rejected' ? 'Rechazado' : 'Pendiente';

                    var priceStr = item.course_price ? '$' + Number(item.course_price).toLocaleString('es-CO') : 'N/A';
                    var courseName = item.course_name || item.course_title || 'N/A';
                    var receiptBtn = item.payment_receipt ?
                        '<button type="button" class="view-inscription-receipt-btn px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs" data-receipt="' + item.payment_receipt + '">Ver Comprobante</button>' :
                        '<span class="px-2 py-1 ' + statusClass + ' rounded-full text-xs">' + statusLabel + '</span>';

                    var row = document.createElement('tr');
                    row.className = 'border-b border-gray-800';
                    row.innerHTML = `
                        <td class="py-3 text-gray-400 text-sm">${String(item.id).padStart(3, '0')}</td>
                        <td class="py-3 text-white text-sm">${item.user_name || item.name || 'N/A'}</td>
                        <td class="py-3 text-gray-400 text-sm">${courseName}</td>
                        <td class="py-3 text-gray-400 text-sm">${priceStr}</td>
                        <td class="py-3">${receiptBtn}</td>
                        <td class="py-3 text-gray-400 text-sm">${item.registration_date ? new Date(item.registration_date).toLocaleDateString('es-ES') : 'N/A'}</td>
                        <td class="py-3">
                            <button type="button" class="delete-inscription-btn px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs" data-id="${item.id}">Eliminar</button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                allInscriptions = [];
                tbody.innerHTML = '<tr><td colspan="7" class="py-6 text-center text-gray-400">No hay inscripciones.</td></tr>';
            }
        } catch (error) {
            const tbody = document.getElementById('inscriptions-tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="7" class="py-6 text-center text-red-300">Error al cargar inscripciones.</td></tr>';
            }
        }
    }

    window.closeReceiptModal = function() {
        document.getElementById('receipt-modal').classList.add('hidden');
    };

    window.closeDetailsModal = function() {
        document.getElementById('details-modal').classList.add('hidden');
    };

    function setupEventListeners() {
        // Filtros
        document.getElementById('filter-type').addEventListener('change', function() {
            currentFilterType = this.value;
            loadAdvisories();
        });
        document.getElementById('filter-status').addEventListener('change', function() {
            currentFilterStatus = this.value;
            loadAdvisories();
        });

        // Tabla advisories
        document.getElementById('advisories-tbody').addEventListener('click', async function(e) {
            // Ver comprobante
            if (e.target.classList.contains('view-receipt-btn')) {
                const receipt = e.target.getAttribute('data-receipt');
                if (receipt) {
                    document.getElementById('receipt-modal-content').innerHTML = '<img src="' + receipt + '" alt="Comprobante" class="max-h-[75vh] max-w-full w-auto object-contain rounded block mx-auto">';
                    document.getElementById('receipt-modal').classList.remove('hidden');
                }
            }

            // Ver detalles
            if (e.target.classList.contains('view-details-btn')) {
                const details = decodeURIComponent(e.target.getAttribute('data-details'));
                const lines = details.split('\n');
                document.getElementById('details-modal-content').innerHTML = lines.map(function(line) {
                    return '<div class="py-1 border-b border-gray-700">' + line + '</div>';
                }).join('');
                document.getElementById('details-modal').classList.remove('hidden');
            }

            // Aprobar pago
            if (e.target.classList.contains('approve-payment-btn')) {
                const id = e.target.getAttribute('data-id');
                try {
                    const response = await fetch('/backend/api/advisory-payment.php', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: id, payment_status: 'paid' })
                    });
                    const result = await response.json();
                    if (result.success) {
                        showToast('Pago aprobado');
                        loadAdvisories();
                        loadAdvisoryHistory();
                    } else {
                        showToast(result.message || 'Error', 'error');
                    }
                } catch (err) {
                    showToast('Error al aprobar pago', 'error');
                }
            }

            // Rechazar pago
            if (e.target.classList.contains('reject-payment-btn')) {
                const id = e.target.getAttribute('data-id');
                try {
                    const response = await fetch('/backend/api/advisory-payment.php', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: id, payment_status: 'rejected' })
                    });
                    const result = await response.json();
                    if (result.success) {
                        showToast('Pago rechazado');
                        loadAdvisories();
                        loadAdvisoryHistory();
                    } else {
                        showToast(result.message || 'Error', 'error');
                    }
                } catch (err) {
                    showToast('Error al rechazar pago', 'error');
                }
            }

            // Eliminar solicitud
            if (e.target.classList.contains('delete-advisory-btn')) {
                const id = e.target.getAttribute('data-id');
                if (confirm('¿Eliminar esta solicitud?')) {
                    try {
                        const response = await fetch('/backend/api/advisory-delete.php', {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: id })
                        });
                        const result = await response.json();
                        if (result.success) {
                            showToast('Solicitud eliminada');
                            loadAdvisories();
                            loadAdvisoryHistory();
                        } else {
                            showToast(result.message || 'Error', 'error');
                        }
                    } catch (err) {
                        showToast('Error al eliminar', 'error');
                    }
                }
            }
        });

        // Cambiar estado desde select
        document.getElementById('advisories-tbody').addEventListener('change', async function(e) {
            if (e.target.classList.contains('change-status-select')) {
                const id = e.target.getAttribute('data-id');
                const status = e.target.value;
                try {
                    const response = await fetch('/backend/api/advisory-update.php', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: id, status: status })
                    });
                    const result = await response.json();
                    if (result.success) {
                        showToast('Estado actualizado');
                        loadAdvisories();
                    } else {
                        showToast(result.message || 'Error', 'error');
                    }
                } catch (err) {
                    showToast('Error al actualizar estado', 'error');
                }
            }
        });

        // Tabla inscripciones
        document.getElementById('inscriptions-tbody').addEventListener('click', async function(e) {
            if (e.target.classList.contains('view-inscription-receipt-btn')) {
                const receipt = e.target.getAttribute('data-receipt');
                if (receipt) {
                    document.getElementById('receipt-modal-content').innerHTML = '<img src="' + receipt + '" alt="Comprobante" class="max-h-[75vh] max-w-full w-auto object-contain rounded block mx-auto">';
                    document.getElementById('receipt-modal').classList.remove('hidden');
                }
            }
            if (e.target.classList.contains('delete-inscription-btn')) {
                const id = e.target.getAttribute('data-id');
                if (confirm('¿Eliminar esta inscripción?')) {
                    try {
                        const response = await fetch('/backend/api/inscripciones.php', {
                            method: 'DELETE',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: id })
                        });
                        const result = await response.json();
                        if (result.success) {
                            showToast('Inscripción eliminada');
                            loadInscriptions();
                        } else {
                            showToast(result.message || 'Error', 'error');
                        }
                    } catch (err) {
                        showToast('Error al eliminar', 'error');
                    }
                }
            }
        });

        // Cerrar modals al hacer clic fuera
        document.getElementById('receipt-modal').addEventListener('click', function(e) {
            if (e.target === this) closeReceiptModal();
        });
        document.getElementById('details-modal').addEventListener('click', function(e) {
            if (e.target === this) closeDetailsModal();
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        loadAdvisories();
        loadAdvisoryHistory();
        setupEventListeners();
    });
})();
