// Gestión completa de admin-inscripciones
(function() {
    let currentFilterType = 'all';
    let currentFilterStatus = 'all';

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
        const details = [];
        if (item.advisory_mode) details.push('Modalidad: ' + item.advisory_mode);
        if (item.date) details.push('Fecha: ' + new Date(item.date).toLocaleDateString('es-ES'));
        if (item.time) details.push('Hora: ' + item.time);
        if (item.num_persons && item.num_persons > 1) details.push('Personas: ' + item.num_persons);
        if (item.notes) details.push('Notas: ' + item.notes);
        return details;
    }

    function buildFullDetailsStr(item) {
        const lines = [];
        const detailsArr = getServiceDetails(item);
        detailsArr.forEach(l => lines.push(l));
        if (item.email) lines.push('Email: ' + item.email);
        if (item.phone) lines.push('Teléfono: ' + item.phone);
        return lines.length ? lines.join('\n') : 'Sin datos adicionales';
    }

    // Normalización parecida a la del historial del usuario:
    // - si llega base64 "puro" (sin data:), lo convertimos.
    // - si llega URL o data:, lo usamos tal cual.
    function normalizeReceiptSrc(receiptRaw) {
        let receipt = receiptRaw;
        if (receipt && typeof receipt === 'string') {
            receipt = receipt.trim();
            if (receipt && !receipt.startsWith('data:')) {
                const looksBase64 = /^[A-Za-z0-9+/\n\r=]+$/.test(receipt);
                if (looksBase64) receipt = 'data:image/jpeg;base64,' + receipt;
            }
        }
        return receipt || null;
    }

    window.downloadAdminReceipt = function() {
        try {
            const src = window.__admin_receipt_src;
            if (!src) {
                showToast('No hay comprobante disponible para descargar.', 'error');
                return;
            }
            const a = document.createElement('a');
            a.href = src;
            a.download = 'comprobante_pago';
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (e) {
            showToast('Error al descargar el comprobante.', 'error');
        }
    };

    window.closeReceiptModal = function() {
        document.getElementById('receipt-modal')?.classList.add('hidden');
    };

    window.closeDetailsModal = function() {
        document.getElementById('details-modal')?.classList.add('hidden');
    };

    async function loadAdvisories() {
        const tbody = document.getElementById('advisories-tbody');
        if (!tbody) return;

        try {
            const response = await fetch('/backend/api/advisories-get.php', { credentials: 'include' });
            const result = await response.json();

            if (result.success && Array.isArray(result.data) && result.data.length > 0) {
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
                    const statusClass = 'bg-yellow-900 text-yellow-300';
                    const statusLabel = 'Pendiente';
                    const priceStr = item.price && item.price > 0 ? '$' + Number(item.price).toLocaleString('es-CO') : 'N/A';

                    let serviceName = item.advisory_service || item.event_name || 'N/A';
                    serviceName = String(serviceName).replace(/_/g, ' ');

                    const typeLabel = getServiceTypeLabel(item);
                    const detailsStr = buildFullDetailsStr(item);

                    const receiptBtn = item.payment_receipt ?
                        '<button type="button" class="view-receipt-btn px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs" data-receipt="' + item.payment_receipt + '">Ver Comprobante</button>' :
                        '<span class="text-gray-500 text-xs">Sin comprobante</span>';

                    const row = document.createElement('tr');
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
                tbody.innerHTML = '<tr><td colspan="10" class="py-6 text-center text-gray-400">No hay solicitudes pendientes.</td></tr>';
            }
        } catch (error) {
            tbody.innerHTML = '<tr><td colspan="10" class="py-6 text-center text-red-300">Error al cargar solicitudes.</td></tr>';
        }
    }

    async function loadAdvisoryHistory() {
        const tbody = document.getElementById('inscriptions-tbody');
        if (!tbody) return;

        try {
            const response = await fetch('/backend/api/advisories-get.php', { credentials: 'include' });
            const result = await response.json();

            if (result.success && Array.isArray(result.data) && result.data.length > 0) {
                const history = result.data.filter(item => item.status === 'confirmed' || item.status === 'completed' || item.status === 'cancelled');

                if (history.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" class="py-6 text-center text-gray-400">No hay historial de solicitudes.</td></tr>';
                    return;
                }

                tbody.innerHTML = '';
                history.forEach(function(item) {
                    const statusClass = item.status === 'confirmed' ? 'bg-blue-900 text-blue-300' :
                        item.status === 'completed' ? 'bg-green-900 text-green-300' :
                            'bg-red-900 text-red-300';

                    const statusLabel = item.status === 'confirmed' ? 'Aprobado' :
                        item.status === 'completed' ? 'Completado' : 'Cancelado';

                    const priceStr = item.price && item.price > 0 ? '$' + Number(item.price).toLocaleString('es-CO') : 'N/A';

                    let serviceName = item.advisory_service || item.event_name || 'N/A';
                    serviceName = String(serviceName).replace(/_/g, ' ');

                    const typeLabel = getServiceTypeLabel(item);
                    const detailsStr = buildFullDetailsStr(item);

                    const row = document.createElement('tr');
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
                            <div class="flex flex-col space-y-1">
                                <button type="button" class="view-receipt-btn px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs" data-receipt="${item.payment_receipt || ''}">Ver Comprobante</button>
                                <button type="button" class="view-details-btn px-2 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 text-xs" data-details="${encodeURIComponent(detailsStr)}">Ver detalles</button>
                                <button type="button" class="delete-advisory-btn px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 text-xs" data-id="${item.id}">Eliminar</button>
                            </div>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="7" class="py-6 text-center text-gray-400">No hay historial de solicitudes.</td></tr>';
            }
        } catch (error) {
            tbody.innerHTML = '<tr><td colspan="7" class="py-6 text-center text-red-300">Error al cargar historial.</td></tr>';
        }
    }

    async function loadInscriptions() {
        const tbody = document.getElementById('inscriptions-tbody');
        if (!tbody) return;


        try {
            const response = await fetch('/backend/api/inscripciones-get.php', { credentials: 'include' });
            const result = await response.json();

            if (result.success && result.data && result.data.length > 0) {
                tbody.innerHTML = '';

                result.data.forEach(function(item) {
                    const statusClass = item.payment_status === 'paid' ? 'bg-green-900 text-green-300' :
                        item.payment_status === 'rejected' ? 'bg-red-900 text-red-300' :
                            'bg-yellow-900 text-yellow-300';

                    const statusLabel = item.payment_status === 'paid' ? 'Pagado' :
                        item.payment_status === 'rejected' ? 'Rechazado' : 'Pendiente';

                    const priceStr = item.course_price ? '$' + Number(item.course_price).toLocaleString('es-CO') : 'N/A';
                    const courseName = item.course_name || item.course_title || 'N/A';

                    const receiptBtn = item.payment_receipt ?
                        '<button type="button" class="view-inscription-receipt-btn px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs" data-receipt="' + item.payment_receipt + '">Ver Comprobante</button>' :
                        '<span class="px-2 py-1 ' + statusClass + ' rounded-full text-xs">' + statusLabel + '</span>';

                    const row = document.createElement('tr');
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
                tbody.innerHTML = '<tr><td colspan="7" class="py-6 text-center text-gray-400">No hay inscripciones.</td></tr>';
            }
        } catch (error) {
            tbody.innerHTML = '<tr><td colspan="7" class="py-6 text-center text-red-300">Error al cargar inscripciones.</td></tr>';
        }
    }

    function setupEventListeners() {
        const deleteConfirmModal = document.getElementById('delete-confirm-admin-modal');
        const deleteConfirmBtn = document.getElementById('delete-confirm-admin-confirm');
        const deleteCancelBtn = document.getElementById('delete-confirm-admin-cancel');

        if (deleteConfirmModal && deleteConfirmBtn && deleteCancelBtn) {
            deleteCancelBtn.addEventListener('click', () => {
                deleteConfirmModal.classList.add('hidden');
                window.__deleteAdvisoryId = null;
                window.__deleteAdvisoryType = null;
            });

            deleteConfirmBtn.addEventListener('click', async () => {
                const id = window.__deleteAdvisoryId;
                const type = window.__deleteAdvisoryType || 'advisory';

                if (!id) {
                    deleteConfirmModal.classList.add('hidden');
                    return;
                }

                try {
                    if (type === 'inscription') {
                        const response = await fetch('/backend/api/inscripciones.php', {
                            method: 'DELETE',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id })
                        });
                        const result = await response.json();
                        if (result.success) {
                            showToast('Inscripción eliminada');
                            loadInscriptions();
                            loadAdvisoryHistory();
                        } else {
                            showToast(result.message || 'Error', 'error');
                        }
                    } else {
                        const response = await fetch('/backend/api/advisory-delete.php', {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id })
                        });
                        const result = await response.json();
                        if (result.success) {
                            showToast('Solicitud eliminada');
                            loadAdvisories();
                            loadAdvisoryHistory();
                        } else {
                            showToast(result.message || 'Error', 'error');
                        }
                    }
                } catch (err) {
                    showToast('Error al eliminar', 'error');
                } finally {
                    deleteConfirmModal.classList.add('hidden');
                    window.__deleteAdvisoryId = null;
                    window.__deleteAdvisoryType = null;
                }
            });
        }

        document.getElementById('filter-type')?.addEventListener('change', function() {
            currentFilterType = this.value;
            loadAdvisories();
        });
        document.getElementById('filter-status')?.addEventListener('change', function() {
            currentFilterStatus = this.value;
            loadAdvisories();
        });

        // Pending (Solicitudes)
        document.getElementById('advisories-tbody')?.addEventListener('click', async function(e) {
            if (e.target.classList.contains('view-receipt-btn')) {
                const receipt = normalizeReceiptSrc(e.target.getAttribute('data-receipt'));

                const modal = document.getElementById('receipt-modal');
                const content = document.getElementById('receipt-modal-content');
                const title = document.getElementById('receipt-modal-title');
                const downloadBtn = document.getElementById('download-receipt-btn');
                if (!modal || !content || !title || !downloadBtn) return;

                window.__admin_receipt_src = receipt;
                if (title) title.textContent = 'Comprobante de Pago';

                // Si venías de “Ver más”, asegúrate de que el botón de descarga quede en estado visible/habilitado
                downloadBtn.style.display = '';
                downloadBtn.classList.remove('hidden');
                downloadBtn.disabled = false;

                if (receipt) {
                    content.innerHTML =
                        '<div class="flex justify-center w-full pt-0 pb-1">' +
                        '<img id="admin-receipt-img" src="' +
                        receipt +
                        '" alt="Comprobante" class="max-h-[45vh] w-auto max-w-[420px] object-contain rounded" />' +
                        '</div>';
                    downloadBtn.classList.remove('hidden');
                    downloadBtn.disabled = false;
                } else {
                    content.innerHTML = '<div class="text-gray-300 text-sm">Sin comprobante</div>';
                    downloadBtn.classList.add('hidden');
                    downloadBtn.disabled = true;
                }

                modal.classList.remove('hidden');
                return;
            }

            // Ver más (texto, SIN descargar)
            if (e.target.classList.contains('view-details-btn')) {
                const details = decodeURIComponent(e.target.getAttribute('data-details') || '');
                const lines = details.split('\n').filter(Boolean);

                const el = document.getElementById('details-modal-content');
                const modal = document.getElementById('details-modal');
                if (!el || !modal) return;

                // cerrar comprobante por seguridad
                document.getElementById('receipt-modal')?.classList.add('hidden');

                // “Ver más” debe mostrar SOLO texto (ocultar cualquier botón de descarga)\r\n                const downloadBtn = document.getElementById('download-receipt-btn');\r\n                if (downloadBtn) {\r\n                    downloadBtn.classList.add('hidden');\r\n                    downloadBtn.disabled = true;\r\n                    downloadBtn.style.display = 'none';\r\n                    downloadBtn.setAttribute('aria-hidden', 'true');\r\n                }


                el.innerHTML = lines.map(function(line) {
                    return '<div class="py-1 border-b border-gray-700">' + line + '</div>';
                }).join('');
                modal.classList.remove('hidden');
                return;
            }

            if (e.target.classList.contains('approve-payment-btn') || e.target.classList.contains('reject-payment-btn')) {
                const id = e.target.getAttribute('data-id');
                if (!id) return;
                const paymentStatus = e.target.classList.contains('approve-payment-btn') ? 'paid' : 'rejected';

                try {
                    const response = await fetch('/backend/api/advisory-payment.php', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: Number(id), payment_status: paymentStatus })
                    });
                    const result = await response.json();
                    if (result.success) {
                        showToast(paymentStatus === 'paid' ? 'Solicitud aprobada' : 'Solicitud rechazada');
                        loadAdvisories();
                        loadAdvisoryHistory();
                    } else {
                        showToast(result.message || 'Error al actualizar solicitud', 'error');
                    }
                } catch (err) {
                    showToast('Error al actualizar solicitud', 'error');
                }
                return;
            }

            if (e.target.classList.contains('delete-advisory-btn')) {
                const id = e.target.getAttribute('data-id');
                if (!id) return;
                window.__deleteAdvisoryId = id;
                window.__deleteAdvisoryType = 'advisory';
                document.getElementById('delete-confirm-admin-modal')?.classList.remove('hidden');
                return;
            }
        });

        // Historial (advisories confirmed/completed/cancelled) + inscripciones
        document.getElementById('inscriptions-tbody')?.addEventListener('click', async function(e) {
            // Ver Comprobante (imagen + botón descarga)
            if (e.target.classList.contains('view-receipt-btn') || e.target.classList.contains('view-inscription-receipt-btn')) {
                const receipt = normalizeReceiptSrc(e.target.getAttribute('data-receipt'));

                const modal = document.getElementById('receipt-modal');
                const content = document.getElementById('receipt-modal-content');
                const title = document.getElementById('receipt-modal-title');
                const downloadBtn = document.getElementById('download-receipt-btn');
                if (!modal || !content || !title || !downloadBtn) return;

                window.__admin_receipt_src = receipt;
                if (title) title.textContent = 'Comprobante de Pago';

                if (receipt) {
                    // Igualar a historial.html: padding/altura y clases
                    content.innerHTML =
                        '<div class="flex justify-center w-full pt-0 pb-1">' +
                        '<img id="admin-receipt-img" src="' +
                        receipt +
                        '" alt="Comprobante" class="max-h-[45vh] w-auto max-w-[420px] object-contain rounded" />' +
                        '</div>';

                    downloadBtn.classList.remove('hidden');
                    downloadBtn.disabled = false;
                } else {
                    content.innerHTML = '<div class="text-gray-300 text-sm">Sin comprobante</div>';
                    downloadBtn.classList.add('hidden');
                    downloadBtn.disabled = true;
                }


                modal.classList.remove('hidden');
                return;
            }

            // Ver detalles / Ver más: SOLO TEXTO (SIN descargar)
            if (e.target.classList.contains('view-details-btn')) {
                const details = decodeURIComponent(e.target.getAttribute('data-details') || '');
                const lines = details.split('\n').filter(Boolean);

                const el = document.getElementById('details-modal-content');
                const modal = document.getElementById('details-modal');
                if (!el || !modal) return;

                // asegurar que comprobante no quede abierto
                document.getElementById('receipt-modal')?.classList.add('hidden');

                el.innerHTML = lines.map(function(line) {
                    return '<div class="py-1 border-b border-gray-700">' + line + '</div>';
                }).join('');
                modal.classList.remove('hidden');
                return;
            }

            if (e.target.classList.contains('delete-advisory-btn')) {
                const id = e.target.getAttribute('data-id');
                if (!id) return;
                window.__deleteAdvisoryId = id;
                window.__deleteAdvisoryType = 'advisory';
                document.getElementById('delete-confirm-admin-modal')?.classList.remove('hidden');
                return;
            }
        });

        document.getElementById('receipt-modal')?.addEventListener('click', function(e) {
            if (e.target === this) closeReceiptModal();
        });
        document.getElementById('details-modal')?.addEventListener('click', function(e) {
            if (e.target === this) closeDetailsModal();
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        loadAdvisories();
        loadAdvisoryHistory();
        setupEventListeners();
    });
})();

