// Gestión de Certificados (admin-certificados)
(function() {
    'use strict';

    // Estado
    let allCertificates = [];
    let allUsers = [];
    let allInscriptions = [];
    let allAdvisories = [];

    // Usuarios seleccionados actualmente
    let selectedIssueUser = null;
    let selectedGroupUser = null;

    function getEl(id) { return document.getElementById(id); }

    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr);
        return d.toLocaleDateString('es-ES');
    }

    function showToast(message, type = 'success') {
        const container = getEl('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `px-4 py-3 rounded-lg shadow-lg text-white text-sm animate-fade-in ${
            type === 'success' ? 'bg-green-600' :
            type === 'error' ? 'bg-red-600' : 'bg-amber-600'
        }`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.remove('animate-fade-in');
            toast.classList.add('animate-fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function escHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/[&<>"']/g, function(m) {
            return { '&': '&amp;', '<': '<', '>': '>', '"': '"', "'": '&#39;' }[m];
        });
    }

    // === CARGA DE DATOS ===

    async function loadUsers() {
        try {
            const res = await fetch('/backend/api/usuarios-get.php', { credentials: 'include' });
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                allUsers = data.data;
            }
        } catch (e) {
            console.error('Error cargando usuarios:', e);
        }
    }

    async function loadInscriptions() {
        try {
            const res = await fetch('/backend/api/inscripciones-get.php', { credentials: 'include' });
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                allInscriptions = data.data;
            }
        } catch (e) {
            console.error('Error cargando inscripciones:', e);
        }
    }

    // Carga asesorías/eventos (aprobados) desde advisories
    async function loadAdvisories() {
        try {
            const res = await fetch('/backend/api/advisories-get.php', { credentials: 'include' });
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                allAdvisories = data.data;
            }
        } catch (e) {
            console.error('Error cargando asesorías/eventos:', e);
        }
    }

    async function loadCertificates() {
        const tbody = getEl('certificates-tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="9" class="py-6 text-center text-gray-400">Cargando certificados...</td></tr>';

        try {
            const userId = getEl('filter-user-id')?.value || '';
            const serviceType = getEl('filter-service-type')?.value || '';
            const params = new URLSearchParams({ all: '1' });
            if (userId) params.set('user_id', userId);
            if (serviceType) params.set('service_type', serviceType);

            const res = await fetch('/backend/api/certificados.php?' + params.toString(), { credentials: 'include' });
            const data = await res.json();

            if (data.success && Array.isArray(data.data)) {
                allCertificates = data.data;
                renderCertificates(data.data);
            } else {
                allCertificates = [];
                tbody.innerHTML = '<tr><td colspan="9" class="py-6 text-center text-gray-400">No hay certificados.</td></tr>';
            }
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="9" class="py-6 text-center text-red-300">Error al cargar certificados.</td></tr>';
        }
    }

    // === BUSCADOR DE USUARIOS (nombre/correo/documento) ===

    function userMatches(user, q) {
        const needle = q.trim().toLowerCase();
        if (!needle) return true;
        const haystack = [
            user.full_name, user.name, user.email,
            user.id_number, user.id_type,
            // combinaciones de nombre y doc
            (user.full_name || '') + ' ' + (user.id_number || ''),
            (user.name || '') + ' ' + (user.id_number || '')
        ].filter(Boolean).map(s => String(s).toLowerCase()).join(' ');
        return haystack.includes(needle);
    }

    // Buscador de usuario para emisión individual
    function setupUserSearch(inputId, resultsId, hiddenId, infoId, onSelect) {
        const input = getEl(inputId);
        const resultsEl = getEl(resultsId);
        const hidden = getEl(hiddenId);
        const infoEl = getEl(infoId);
        if (!input || !resultsEl) return;

        let debounceTimer = null;

        const renderResults = (query) => {
            const q = query.trim();
            if (!q) {
                resultsEl.classList.add('hidden');
                resultsEl.innerHTML = '';
                return;
            }

            const matches = allUsers.filter(u => userMatches(u, q)).slice(0, 10);

            if (matches.length === 0) {
                resultsEl.innerHTML = '<div class="px-3 py-2 text-gray-400">Sin resultados</div>';
            } else {
                resultsEl.innerHTML = matches.map(u => `
                    <div class="px-3 py-2 hover:bg-purple-700 cursor-pointer border-b border-gray-700 user-result"
                         data-user-id="${u.id}">
                        <div class="font-medium text-white">${escHtml(u.full_name || u.name)}</div>
                        <div class="text-xs text-gray-400">
                            ${escHtml(u.email || '')} ${u.id_number ? ' - ' + escHtml(u.id_type || 'CC') + ' ' + escHtml(u.id_number) : ''}
                        </div>
                    </div>
                `).join('');
            }

            resultsEl.classList.remove('hidden');

            // Borrar selección previa al escribir
            hidden.value = '';
            if (infoEl) infoEl.classList.add('hidden');
            if (onSelect) onSelect(null);

            resultsEl.querySelectorAll('.user-result').forEach(el => {
                el.addEventListener('click', () => {
                    const uid = el.getAttribute('data-user-id');
                    const user = allUsers.find(u => String(u.id) === String(uid));
                    if (!user) return;
                    input.value = user.full_name || user.name;
                    hidden.value = user.id;
                    resultsEl.classList.add('hidden');
                    resultsEl.innerHTML = '';
                    if (infoEl) {
                        infoEl.classList.remove('hidden');
                        infoEl.innerHTML = `
                            <strong>${escHtml(user.full_name || user.name)}</strong><br>
                            ${escHtml(user.email || '')}
                            ${user.id_number ? '<br>' + escHtml(user.id_type || 'CC') + ': ' + escHtml(user.id_number) : ''}
                        `;
                    }
                    if (onSelect) onSelect(user);
                });
            });
        };

        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => renderResults(input.value), 200);
        });

        input.addEventListener('focus', () => {
            if (input.value.trim()) renderResults(input.value);
        });

        document.addEventListener('click', (e) => {
            if (!resultsEl.contains(e.target) && e.target !== input && !input.contains(e.target)) {
                resultsEl.classList.add('hidden');
            }
        });
    }

    // === EVENTOS/ASESORÍAS APROBADOS DEL USUARIO ===

    function serviceLabel(ad) {
        if (ad.service_type === 'evento') {
            return (ad.event_name || ad.advisory_service || 'Evento').replace(/_/g, ' ');
        }
        if (ad.service_type === 'asesoria') {
            const tipo = ad.advisory_type === 'asesoria_Individual' ? 'Asesoría Individual' : 'Asesoría Grupo';
            const servicio = ad.advisory_service ? ad.advisory_service.replace(/_/g, ' ') : '';
            const modalidad = ad.advisory_mode ? ad.advisory_mode.replace(/_/g, ' ') : '';
            return [tipo, servicio, modalidad].filter(Boolean).join(' - ');
        }
        return (ad.advisory_service || ad.event_name || 'Servicio').replace(/_/g, ' ');
    }

    // Habilita el select de evento/asesoría con los servicios aprobados del usuario seleccionado
    // mode: 'individual' -> solo servicios con 1 participante (num_persons <= 1)
    //       'group'      -> solo servicios con 2 o más participantes (num_persons >= 2)
    function populateAdvisoriesForUser(user, selectEl, mode) {
        if (!selectEl) return;
        if (!user) {
            selectEl.innerHTML = '<option value="">Primero busca un usuario</option>';
            return;
        }

        const isGroupMode = mode === 'group';
        const userId = String(user.id);
        // Servicios aprobados (confirmed/completed) y pagados, del usuario (user_id o client_id o email)
        const approved = allAdvisories.filter(a =>
            (a.status === 'confirmed' || a.status === 'completed') &&
            a.payment_status === 'paid' &&
            a.service_type !== 'curso'
        );

        const userServices = approved.filter(a => {
            const numPersons = parseInt(a.num_persons, 10) || 1;
            // Individual: solo 1 participante / Grupal: 2 o más
            if (isGroupMode && numPersons < 2) return false;
            if (!isGroupMode && numPersons > 1) return false;

            const matchesUser =
                (a.user_id && String(a.user_id) === userId) ||
                (a.client_id && String(a.client_id) === userId) ||
                (a.email && user.email && String(a.email).toLowerCase() === String(user.email).toLowerCase()) ||
                (a.name && user.full_name && String(a.name).toLowerCase() === String(user.full_name).toLowerCase()) ||
                (a.name && user.name && String(a.name).toLowerCase() === String(user.name).toLowerCase());
            return matchesUser;
        });

        if (userServices.length === 0) {
            selectEl.innerHTML = isGroupMode
                ? '<option value="">No hay compras grupales (2 o más personas) aprobadas para este usuario</option>'
                : '<option value="">No hay eventos/asesorías individuales aprobados para este usuario</option>';
            return;
        }

        let html = '<option value="">Selecciona un evento/asesoría</option>';
        userServices.forEach(a => {
            const numPersons = parseInt(a.num_persons, 10) || 1;
            const label = serviceLabel(a) + ' - ' + formatDate(a.date) + (isGroupMode ? ' (' + numPersons + ' personas)' : '');
            html += `<option value="${a.id}" data-service-type="${a.service_type}">${escHtml(label)}</option>`;
        });
        selectEl.innerHTML = html;
    }

    // === EMITIR CERTIFICADO ===

    async function issueCertificate() {
        const userId = getEl('issue-user-id')?.value;
        const advisoryId = getEl('issue-advisory')?.value;
        const expiryDate = getEl('issue-expiry')?.value || null;
        const advisorySelect = getEl('issue-advisory');
        const recipientMode = getEl('issue-recipient-mode')?.value || 'self';
        const recipientName = getEl('issue-recipient-name')?.value.trim() || '';
        const recipientIdTypeSelect = getEl('issue-recipient-idtype');
        const recipientIdTypeOther = getEl('issue-recipient-idtype-other')?.value.trim() || '';
        const recipientIdType = recipientIdTypeSelect?.value === 'Otro' ? recipientIdTypeOther : (recipientIdTypeSelect?.value || '');
        const recipientIdNumber = getEl('issue-recipient-idnumber')?.value.trim() || '';

        if (!userId) {
            showToast('Busca y selecciona un usuario', 'error');
            return;
        }
        if (!advisoryId) {
            showToast('Selecciona un evento o asesoría', 'error');
            return;
        }

        const serviceType = advisorySelect?.options[advisorySelect.selectedIndex]?.getAttribute('data-service-type') || 'evento';

        const btn = getEl('issue-btn');
        if (btn) { btn.disabled = true; btn.textContent = 'Emitiendo...'; }

        try {
            const body = {
                user_id: parseInt(userId, 10),
                service_type: serviceType,
                advisory_id: parseInt(advisoryId, 10),
                expiry_date: expiryDate || null,
                recipient_mode: recipientMode,
                recipient_name: recipientMode === 'other' ? recipientName : '',
                recipient_id_type: recipientMode === 'other' ? recipientIdType : '',
                recipient_id_number: recipientMode === 'other' ? recipientIdNumber : ''
            };

            const res = await fetch('/backend/api/certificados.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (data.success) {
                showToast(data.message || 'Certificado emitido exitosamente');
                // Limpiar formulario
                getEl('issue-user-search').value = '';
                getEl('issue-user-id').value = '';
                getEl('issue-user-info').classList.add('hidden');
                getEl('issue-advisory').innerHTML = '<option value="">Primero busca un usuario</option>';
                getEl('issue-expiry').value = '';
                getEl('issue-recipient-mode').value = 'self';
                getEl('issue-recipient-name').value = '';
                getEl('issue-recipient-idtype').value = '';
                getEl('issue-recipient-idnumber').value = '';
                getEl('issue-recipient-idtype-other').value = '';
                getEl('issue-recipient-fields').classList.add('hidden');
                selectedIssueUser = null;
                try {
                    await loadCertificates();
                } catch (refreshError) {
                    console.error('No se pudo actualizar la lista de certificados:', refreshError);
                }
            } else {
                showToast(data.message || 'Error al emitir certificado', 'error');
            }
        } catch (e) {
            showToast('Error de conexión al emitir certificado', 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = 'Emitir Certificado'; }
        }
    }

    // === EMISIÓN GRUPAL ===

    function renderParticipantRow(container) {
        const num = container.children.length + 1;
        const row = document.createElement('div');
        row.className = 'participant-row bg-gray-800 p-3 rounded border border-gray-700 space-y-2';
        row.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="text-gray-300 text-xs font-semibold">Datos certificado ${num}</span>
                <button type="button" class="remove-participant-btn text-red-400 hover:text-red-300 text-xs">✕ Quitar</button>
            </div>
            <input type="text" class="p-name w-full p-2 bg-gray-700 rounded text-sm" onkeypress="return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/.test(event.key)" pattern="^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$" placeholder="Nombre ${num} *" required>
            <div class="flex gap-2">
                <select class="p-idtype flex-1 p-2 bg-gray-700 rounded text-sm">
                    <option value="">Tipo doc.</option>
                    <option value="Tarjeta de Identidad">Tarjeta de Identidad</option>
                    <option value="Cédula de Ciudadanía">Cédula de Ciudadanía</option>
                    <option value="Cédula de Extranjería">Cédula de Extranjería</option>
                    <option value="Permiso por Protección Temporal (PPT)">PPT</option>
                    <option value="Pasaporte">Pasaporte</option>
                    <option value="Otro">Otro</option>
                </select>
                <input type="text" class="p-idnumber p-2 bg-gray-700 rounded text-sm" oninput="this.value = this.value.replace(/[^0-9]/g, '')" placeholder="Documento ${num}">
            </div>
            <input type="text" class="p-idtype-other hidden w-full p-2 bg-gray-700 rounded text-sm" placeholder="Especifica tipo de documento">
        `;
        container.appendChild(row);
        const idTypeSelect = row.querySelector('.p-idtype');
        const idTypeOther = row.querySelector('.p-idtype-other');
        if (idTypeSelect && idTypeOther) {
            idTypeSelect.addEventListener('change', () => {
                idTypeOther.classList.toggle('hidden', idTypeSelect.value !== 'Otro');
            });
        }
        row.querySelector('.remove-participant-btn').addEventListener('click', () => row.remove());
    }

    function addParticipant() {
        const container = getEl('group-participants');
        if (!container) return;
        renderParticipantRow(container);
    }

    async function issueGroupCertificates() {
        const userId = getEl('group-user-id')?.value;
        const advisoryId = getEl('group-advisory')?.value;
        const expiryDate = getEl('group-expiry')?.value || null;
        const advisorySelect = getEl('group-advisory');
        const includeBuyer = getEl('group-include-buyer')?.checked || false;

        if (!userId) {
            showToast('Busca y selecciona al comprador', 'error');
            return;
        }
        if (!advisoryId) {
            showToast('Selecciona un evento o asesoría', 'error');
            return;
        }

        const serviceType = advisorySelect?.options[advisorySelect.selectedIndex]?.getAttribute('data-service-type') || 'evento';

        const rows = Array.from(document.querySelectorAll('.participant-row'));
        const participants = rows.map(r => {
            const idTypeSelect = r.querySelector('.p-idtype');
            const idTypeOther = r.querySelector('.p-idtype-other');
            const selectedIdType = idTypeSelect?.value || '';
            const id_type = selectedIdType === 'Otro'
                ? (idTypeOther?.value.trim() || '')
                : selectedIdType;
            return {
                name: r.querySelector('.p-name')?.value.trim() || '',
                id_type,
                id_number: r.querySelector('.p-idnumber')?.value.trim() || ''
            };
        }).filter(p => p.name);

        if (participants.length === 0) {
            showToast('Agrega al menos un participante con nombre', 'error');
            return;
        }

        const btn = getEl('group-issue-btn');
        if (btn) { btn.disabled = true; btn.textContent = 'Emitiendo...'; }

        try {
            const body = {
                user_id: parseInt(userId, 10),
                service_type: serviceType,
                advisory_id: parseInt(advisoryId, 10),
                expiry_date: expiryDate || null,
                participants,
                include_buyer: includeBuyer
            };

            const res = await fetch('/backend/api/certificados.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (data.success) {
                showToast(data.message || 'Certificados emitidos exitosamente');
                // Limpiar formulario
                getEl('group-user-search').value = '';
                getEl('group-user-id').value = '';
                getEl('group-user-info').classList.add('hidden');
                getEl('group-advisory').innerHTML = '<option value="">Primero busca al comprador</option>';
                getEl('group-expiry').value = '';
                getEl('group-participants').innerHTML = '';
                getEl('group-include-buyer').checked = false;
                selectedGroupUser = null;
                try {
                    await loadCertificates();
                } catch (refreshError) {
                    console.error('No se pudo actualizar la lista de certificados:', refreshError);
                }
            } else {
                showToast(data.message || 'Error al emitir certificados', 'error');
            }
        } catch (e) {
            showToast('Error de conexión al emitir certificados', 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = 'Emitir Certificados del Grupo'; }
        }
    }

    // === RENDER TABLA ===

    function serviceTitle(cert) {
        if (cert.service_title) return cert.service_title;
        if (cert.course_title) return cert.course_title;
        if (cert.event_name) return cert.event_name;
        if (cert.advisory_service) return cert.advisory_service;
        return 'N/A';
    }

    function serviceTypeLabel(type) {
        if (type === 'evento') return 'Evento';
        if (type === 'asesoria') return 'Asesoría';
        if (type === 'curso') return 'Curso';
        return type || 'N/A';
    }

    function getCertificateDuration(cert) {
        return cert.course_duration || cert.advisory_duration || null;
    }

    function renderCertificates(certs) {
        const tbody = getEl('certificates-tbody');
        if (!tbody) return;

        if (certs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="py-6 text-center text-gray-400">No hay certificados con los filtros seleccionados.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        certs.forEach(cert => {
            const statusClass = Number(cert.is_valid) === 1 ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300';
            const statusLabel = Number(cert.is_valid) === 1 ? 'Válido' : 'Revocado';
            const studentName = cert.holder_name || cert.user_full_name || cert.user_name || 'N/A';
            const docInfo = cert.holder_id_type && cert.holder_id_number ? `${cert.holder_id_type}: ${cert.holder_id_number}` : 'N/A';
            const buyerLabel = (Number(cert.is_group) === 1) ? `<span class="text-purple-400 text-xs ml-1">(Compra grupal)</span>` : '';
            const shownName = cert.holder_name ? `${studentName}${buyerLabel}` : studentName;

            const row = document.createElement('tr');
            row.className = 'border-b border-gray-800';
            row.innerHTML = `
                <td class="py-3 text-gray-400 text-sm">${String(cert.certificate_id).padStart(3, '0')}</td>
                <td class="py-3 text-white text-sm">${escHtml(shownName)}</td>
                <td class="py-3 text-gray-400 text-sm">${escHtml(docInfo)}</td>
                <td class="py-3 text-gray-400 text-sm">${escHtml(serviceTitle(cert))}</td>
                <td class="py-3">
                    <span class="px-2 py-1 rounded-full text-xs ${cert.service_type === 'curso' ? 'bg-blue-900 text-blue-300' : cert.service_type === 'evento' ? 'bg-amber-900 text-amber-300' : 'bg-purple-900 text-purple-300'}">
                        ${serviceTypeLabel(cert.service_type)}
                    </span>
                </td>
                <td class="py-3 text-amber-500 font-mono text-xs">${escHtml(cert.certificate_number || 'N/A')}</td>
                <td class="py-3 text-gray-400 text-sm">${formatDate(cert.issue_date)}</td>
                <td class="py-3">
                    <span class="px-2 py-1 ${statusClass} rounded-full text-xs">${statusLabel}</span>
                </td>
                <td class="py-3">
                    <div class="flex space-x-1">
                        <button type="button" class="download-cert-btn px-2 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 text-xs" data-id="${cert.certificate_id}">PDF</button>
                        ${Number(cert.is_valid) === 1 ? `
                            <button type="button" class="revoke-cert-btn px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs" data-id="${cert.certificate_id}">Revocar</button>
                        ` : `
                            <button type="button" class="reactivate-cert-btn px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs" data-id="${cert.certificate_id}">Reactivar</button>
                        `}
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // === PDF ===

    function loadJsPDF(callback) {
        if (window.jspdf) {
            callback(window.jspdf);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => callback(window.jspdf);
        script.onerror = () => {
            showToast('No se pudo cargar la librería PDF', 'error');
        };
        document.head.appendChild(script);
    }

    window.downloadAdminCertificatePDF = function(certId) {
        const cert = allCertificates.find(c => String(c.certificate_id) === String(certId));
        if (!cert) {
            showToast('Certificado no encontrado', 'error');
            return;
        }

        loadJsPDF(async ({ jsPDF }) => {
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

            // Fondo limpio y borde
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, 297, 210, 'F');
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.rect(10, 10, 277, 190);

            // Intentar cargar icono y firma desde rutas relativas
            function loadImageAsDataUrl(url) {
                return fetch(url, { cache: 'no-cache' })
                    .then(res => res.ok ? res.blob() : null)
                    .then(blob => blob ? new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    }) : null)
                    .catch(() => null);
            }

            const logoPath = new URL('../../img/icono_negro.png', window.location.href).href;
            const signaturePath = new URL('../../img/firma.png', window.location.href).href;
            const logoData = await loadImageAsDataUrl(logoPath);
            const signatureData = await loadImageAsDataUrl(signaturePath);

            if (logoData) {
                try { doc.addImage(logoData, 'PNG', 14, 14, 38, 26); } catch (e) {}
            }

            // Título
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(38);
            doc.setTextColor(40, 40, 40);
            doc.text('CERTIFICADO', 148.5, 56, { align: 'center' });

            doc.setFontSize(14);
            doc.setTextColor(90, 90, 90);
            doc.text('DE FINALIZACIÓN', 148.5, 68, { align: 'center' });

            // Texto principal
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(70, 70, 70);
            const statement = [
                'Por medio del presente se certifica que la persona',
            ];
            doc.text(statement, 148.5, 88, { align: 'center', maxWidth: 240 });

            // Nombre del titular
            const studentName = (cert.holder_name || cert.user_full_name || cert.user_name || '').toUpperCase();
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(24);
            doc.setTextColor(30, 30, 30);
            doc.text(studentName || 'TITULAR', 148.5, 102, { align: 'center' });

            // Documento
            const docType = cert.holder_id_type || cert.user_id_type || 'Documento';
            const docNumber = cert.holder_id_number || cert.user_id_number || 'N/A';
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(80, 80, 80);
            doc.text(`${docType} ${docNumber}`, 148.5, 110, { align: 'center' });

            // Nombre del servicio
            const renderedServiceTitle = serviceTitle(cert).replace(/_/g, ' ').toUpperCase();
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.setTextColor(80, 80, 80);
            doc.text(renderedServiceTitle, 148.5, 124, { align: 'center' });

            const duration = getCertificateDuration(cert);
            if (duration) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text(`Duración: ${duration}`, 148.5, 131, { align: 'center' });
            }

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(90, 90, 90);
            doc.text(`Ha completado satisfactoriamente el programa y ha demostrado dedicación, disciplina y excelencia en su formación.`, 148.5, 138, { align: 'center' });

            doc.text(`Fecha de finalización: ${formatDate(cert.completion_date || cert.issue_date)}`, 148.5, 146, { align: 'center' });

            doc.setFontSize(9);
            doc.setTextColor(120, 120, 120);
            doc.text(`Certificado N° ${cert.certificate_number || ''}`, 148.5, 154, { align: 'center' });

            const sigY = 168;
            const sigWidth = 100;
            const sigHeight = 36;
            const centroX = 150;
            if (signatureData) {
                try {
                    doc.addImage(signatureData, 'PNG', 100, sigY - 16, sigWidth, sigHeight);
                } catch (e) {
                    doc.setFontSize(10);
                    doc.text('____________________________________', centroX, sigY + 4, { align: 'center' });
                }
            } else {
                doc.setFontSize(10);
                doc.text('____________________________________', centroX, sigY + 4, { align: 'center' });
            }
            doc.setLineWidth(0.5);
            doc.setDrawColor(150, 150, 150);
            doc.line(centroX - 50, 171, centroX + 50, 171);
            doc.setFontSize(11);
            doc.setTextColor(40, 40, 40);
            doc.text('Chef Jonathan Buitrago', centroX, sigY + 10, { align: 'center' });
            doc.setFontSize(9);
            doc.setTextColor(110, 110, 110);
            doc.setFont('helvetica', 'bold');
            doc.text('Director Académico', centroX, sigY + 16, { align: 'center' });

            doc.setFontSize(8);
            doc.setTextColor(130, 130, 130);
            doc.text('Chef Jonathan Buitrago - Cursos y Asesorías de Pastelería', 148.5, 196, { align: 'center' });

            const studentPart = (cert.holder_name || cert.user_full_name || cert.user_name || 'estudiante').replace(/\s+/g, ' ').replace(/[^a-zA-Z0-9 _-]/g, '').trim();
            const servicePart = serviceTitle(cert).replace(/\s+/g, ' ').replace(/[^a-zA-Z0-9 _-]/g, '').trim();
            const fileName = `Certificado ${studentPart} ${servicePart}.pdf`;
            doc.save(fileName);
        });
    };

    // === REVOCAR / REACTIVAR ===

    async function updateCertificateStatus(id, is_valid) {
        try {
            const res = await fetch('/backend/api/certificados.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ id, is_valid })
            });
            const data = await res.json();
            if (data.success) {
                showToast(data.message || 'Certificado actualizado');
                await loadCertificates();
            } else {
                showToast(data.message || 'Error al actualizar', 'error');
            }
        } catch (e) {
            showToast('Error de conexión', 'error');
        }
    }

    // === FILTRO DEL LISTADO ===

    function setupFilterSearch() {
        const input = getEl('filter-user-search');
        const hidden = getEl('filter-user-id');
        if (!input || !hidden) return;

        input.addEventListener('input', () => {
            const q = input.value.trim();
            hidden.value = '';
            if (q.length < 2) {
                loadCertificates();
                return;
            }
            const matches = allUsers.filter(u => userMatches(u, q));
            if (matches.length === 1) {
                hidden.value = matches[0].id;
            }
            loadCertificates();
        });
    }

    // === EVENTOS ===

    function setupEvents() {
        const emitBtn = getEl('issue-btn');
        if (emitBtn) emitBtn.addEventListener('click', issueCertificate);

        // Buscadores de usuario
        // Emisión individual: solo servicios con 1 participante
        setupUserSearch('issue-user-search', 'issue-user-results', 'issue-user-id', 'issue-user-info', (user) => {
            selectedIssueUser = user;
            populateAdvisoriesForUser(user, getEl('issue-advisory'), 'individual');
        });

        // Emisión grupal: solo servicios con 2 o más participantes
        setupUserSearch('group-user-search', 'group-user-results', 'group-user-id', 'group-user-info', (user) => {
            selectedGroupUser = user;
            populateAdvisoriesForUser(user, getEl('group-advisory'), 'group');
        });

        // Emisión grupal
        const addPartBtn = getEl('add-participant-btn');
        if (addPartBtn) addPartBtn.addEventListener('click', addParticipant);

        const groupIssueBtn = getEl('group-issue-btn');
        if (groupIssueBtn) groupIssueBtn.addEventListener('click', issueGroupCertificates);

        const recipientModeEl = getEl('issue-recipient-mode');
        const recipientFieldsEl = getEl('issue-recipient-fields');
        const recipientIdTypeEl = getEl('issue-recipient-idtype');
        const recipientIdTypeOtherEl = getEl('issue-recipient-idtype-other');
        if (recipientModeEl && recipientFieldsEl) {
            recipientModeEl.addEventListener('change', () => {
                recipientFieldsEl.classList.toggle('hidden', recipientModeEl.value !== 'other');
            });
        }
        if (recipientIdTypeEl && recipientIdTypeOtherEl) {
            recipientIdTypeEl.addEventListener('change', () => {
                recipientIdTypeOtherEl.classList.toggle('hidden', recipientIdTypeEl.value !== 'Otro');
            });
        }

        // Filtros del listado
        setupFilterSearch();

        const filterServiceType = getEl('filter-service-type');
        if (filterServiceType) filterServiceType.addEventListener('change', loadCertificates);

        const tbody = getEl('certificates-tbody');
        if (tbody) {
            tbody.addEventListener('click', (e) => {
                const target = e.target;
                if (target.classList.contains('download-cert-btn')) {
                    downloadAdminCertificatePDF(target.getAttribute('data-id'));
                } else if (target.classList.contains('revoke-cert-btn')) {
                    const id = target.getAttribute('data-id');
                    if (confirm('¿Seguro que deseas revocar este certificado?')) {
                        updateCertificateStatus(id, 0);
                    }
                } else if (target.classList.contains('reactivate-cert-btn')) {
                    const id = target.getAttribute('data-id');
                    updateCertificateStatus(id, 1);
                }
            });
        }
    }

    // === INIT ===

document.addEventListener('DOMContentLoaded', async function() {
        setupEvents();
        // Mostrar una fila de certificado por defecto en la emisión grupal
        const gpContainer = getEl('group-participants');
        if (gpContainer && gpContainer.children.length === 0) {
            renderParticipantRow(gpContainer);
        }
        await Promise.all([loadUsers(), loadInscriptions(), loadAdvisories()]);
        await loadCertificates();
    });
})();

