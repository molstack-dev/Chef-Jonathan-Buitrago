// assets/historial.js

(function () {
  // Variables para la paginación global
  let currentPage = 1;
  const recordsPerPage = 10;
  let allHistoryData = []; // Almacenar todos los datos para paginación

  function safeGetCurrentUser() {
    // Este proyecto a veces define getCurrentUser() en assets/script.js.
    try {
      if (typeof getCurrentUser === 'function') return getCurrentUser();
    } catch (e) {}
    return null;
  }

  function showToast(message, type) {
    if (typeof window.showToast === 'function') return window.showToast(message, type);

    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.textContent = message;
    toast.className =
      'px-4 py-3 rounded-lg shadow-lg text-white text-sm animate-fade-in ' +
      (type === 'error' ? 'bg-red-600' : 'bg-green-600');
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('animate-fade-in');
      toast.classList.add('animate-fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  async function loadMyHistory() {
    // Nota: este historial NO debe mezclar refunds procesados en una sola fila,
    // pero mantenemos el flujo actual. Corregimos el botón del comprobante para usar refundsData cuando esté aprobado.

    const tbody = document.getElementById('history-tbody');
    if (!tbody) return;

    try {
      let email = null;
      const currentUser = safeGetCurrentUser();
      if (currentUser && currentUser.email) email = currentUser.email;
      if (!email) email = localStorage.getItem('advisory_email');

      const urlHistory = '/backend/api/my-history-get.php';
      const urlRefunds = '/backend/api/my-refunds-get.php';

      const [historyResp, refundsResp] = await Promise.all([
        fetch(urlHistory, { credentials: 'include' }),
        fetch(urlRefunds, { credentials: 'include' })
      ]);

      const [historyResult, refundsResult] = await Promise.all([
        historyResp.json(),
        refundsResp.json()
      ]);

      const historyData = (historyResult && historyResult.success && Array.isArray(historyResult.data)) ? historyResult.data : [];
      const refundsData = (refundsResult && refundsResult.success && Array.isArray(refundsResult.data)) ? refundsResult.data : [];

      // Creamos un mapa de reembolsos aprobados para asociarlos con los registros del historial
      const approvedRefundsMap = new Map();
      
      refundsData.forEach(r => {
        if (r.refund_status === 'approved') {
          // Creamos una clave para identificar el registro original
          // Usamos solo el tipo, título del servicio y precio para la coincidencia
          // ya que las fechas pueden variar entre las tablas
          const rType = (r.type || '').toString();
          const rService = (r.service_title || r.service_name || '').toString();
          const rPrice = (r.price ?? '').toString();
          const refundKey = `${rType}:${rService}:${rPrice}`;
          
          approvedRefundsMap.set(refundKey, r);
        }
      });

      // Construir un historial unificado (refunds pendientes)
      const unified = [];
      historyData.forEach(item => {
        // Creamos clave para el elemento actual
        const hType = (item.source || item.type || '').toString();
        const hService = (item.course_title || item.service_title || item.service_name || '').toString();
        const hPrice = (item.price ?? '').toString();
        const itemKey = `${hType}:${hService}:${hPrice}`;
        
        // Verificamos si hay un reembolso aprobado para este elemento
        const approvedRefund = approvedRefundsMap.get(itemKey);
        
        if (approvedRefund) {
          // Actualizamos el estado del elemento original para reflejar el reembolso aprobado
          item.status = 'refund_approved';
          item.payment_status = approvedRefund.refund_status;
          item.admin_receipt = approvedRefund.admin_receipt;
          item.refund_admin_receipt = approvedRefund.admin_receipt;
        }
        
        unified.push(item);
      });

      // Agregar también los reembolsos aprobados como entradas separadas
      // para que se muestren en el historial
      refundsData.forEach(r => {
        if (r.refund_status === 'approved') {
          // Verificar si ya existe en el historial para evitar duplicados
          const hType = (r.type || '').toString();
          const hService = (r.service_title || r.service_name || '').toString();
          const hPrice = (r.price ?? '').toString();
          const itemKey = `${hType}:${hService}:${hPrice}`;
          
          const existsInHistory = historyData.some(h => {
            const hType = (h.source || h.type || '').toString();
            const hService = (h.course_title || h.service_title || h.service_name || '').toString();
            const hPrice = (h.price ?? '').toString();
            const hItemKey = `${hType}:${hService}:${hPrice}`;
            return hItemKey === itemKey;
          });
          
          if (!existsInHistory) {
            // Agregar el reembolso aprobado como entrada separada
            unified.push({
              id: r.id,
              source: r.type,
              type: r.type,
              status: 'refund_approved',
              payment_status: r.refund_status,
              created_at: r.created_at,
              service_title: r.service_title,
              service_name: r.service_name,
              price: r.price,
              admin_receipt: r.admin_receipt,
              refund_admin_receipt: r.admin_receipt
            });
          }
        }
      });

      // Procesar reembolsos pendientes
      refundsData.forEach(r => {
        if (r.refund_status !== 'approved') { // Solo procesamos reembolsos pendientes aquí
          // En lugar de usar la lógica de deduplicación estricta, vamos a permitir 
          // que los reembolsos pendientes se muestren como entradas separadas
          // Solo evitamos duplicados exactos de reembolsos pendientes
          
          // Verificar si este reembolso pendiente ya está en la lista unified
          const existingRefundIndex = unified.findIndex(u => 
            u.source === r.type && 
            u.id === r.id && 
            u.status === 'refund_requested'
          );
          
          if (existingRefundIndex === -1) {
            unified.push({
                  // compatibilidad con tu render existente:
              id: r.id,
              source: r.type,
              type: r.type,
              status: 'refund_requested',
              payment_status: r.refund_status, // pending/approved
              created_at: r.created_at,
              service_title: r.service_title,
              service_name: r.service_name,
              price: r.price,
              // Asegurar que el campo admin_receipt llegue al renderer
              admin_receipt: r.admin_receipt,
              // y también mapearlo a una clave alternativa por compatibilidad
              refund_admin_receipt: r.admin_receipt
            });
          }
        }
      });

      // Almacenar todos los datos para paginación
      allHistoryData = unified;
      const totalPages = Math.ceil(allHistoryData.length / recordsPerPage);
      
      // Asegurarse de que la página actual esté dentro de los límites
      if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
      }
      if (currentPage < 1) {
        currentPage = 1;
      }
      
      // Calcular índices para la página actual
      const startIndex = (currentPage - 1) * recordsPerPage;
      const endIndex = Math.min(startIndex + recordsPerPage, allHistoryData.length);
      const history = allHistoryData.slice(startIndex, endIndex);

      if (allHistoryData.length > 0) {
        if (history.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-gray-400">No hay historial de solicitudes.</td></tr>';
          updatePaginationControls(totalPages, currentPage);
          return;
        }

        tbody.innerHTML = '';

        history.forEach(function (item) {
          const statusClass =
            item.status === 'confirmed'
              ? 'bg-blue-900 text-blue-300'
              : item.status === 'completed'
                ? 'bg-green-900 text-green-300'
                : item.status === 'refund_approved'
                  ? 'bg-green-900 text-green-300'
                  : item.status === 'refund_requested'
                    ? 'bg-yellow-900 text-yellow-300'
                    : 'bg-red-900 text-red-300';

          const statusLabel =
            item.status === 'confirmed'
              ? 'Aprobado'
              : item.status === 'completed'
                ? 'Completado'
                : item.status === 'refund_approved'
                  ? 'Reembolso Aprobado'
                  : item.status === 'refund_requested'
                    ? 'Pendiente'
                    : 'Cancelado';


          // Determine type and name
          let serviceTypeLabel = 'N/A';
          let serviceName = 'N/A';
          const source = item.source || 'advisory';

          // Ajuste: si viene desde tabla refunds, el source puede no ser 'registration/advisory'
          // Usamos service_title/service_name como fallback.
          if (source === 'registration') {
            serviceTypeLabel = 'Curso';
            serviceName = item.course_title || item.service_title || item.service_name || 'Curso';
          } else {

            if (item.service_type === 'asesoria') serviceTypeLabel = 'Asesoría';
            else if (item.service_type === 'curso') serviceTypeLabel = 'Curso';
            else if (item.service_type === 'evento') serviceTypeLabel = 'Evento';

            serviceName = item.advisory_service || item.event_name || 'N/A';
            serviceName = String(serviceName).replace(/_/g, ' ');
          }

          const priceStr = item.price && item.price > 0 ? '$' + Number(item.price).toLocaleString('es-CO') : 'N/A';
          const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('es-ES') : 'N/A';

          // Can refund?
          let canRefund = false;
          let refundBtn = '';

          // Si es un reembolso directo (de la tabla refunds), mostrar botón correspondiente
          if (item.status === 'refund_requested') {
            // Mostrar botón de estado de reembolso pendiente
            const isPending = true;
            const btnState = 'cancel'; // Permitir cancelar solicitud de reembolso
            const refundApproved = false; // No aprobado aún
            const btnText = 'Cancelar Reembolso';
            const btnClass = 'bg-gray-700 hover:bg-gray-600';

            refundBtn =
              '<button type="button" class="refund-toggle-btn px-3 py-1 text-white rounded text-xs transition-colors ' + btnClass + ' " ' +
              'data-refund-id="' + item.id + '" data-refund-type="' + (item.type || source) + '" data-state="' + btnState + '" onclick="window.handleRefundToggle(this)">' +
              btnText + '</button>';
              
            canRefund = true; // Indicar que ya hay un reembolso pendiente
          } else if (source === 'registration' || item.service_type === 'curso') {
            const createdAt = new Date(item.created_at);
            const daysSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSince <= 7 && item.status !== 'cancelled' && item.payment_status !== 'refund_requested') {
              canRefund = true;
            }
          }
          
          // Detectar reembolso pendiente para permitir cancelación
          // Algunos flows usan `payment_status='pending'` (refunds tabla) y otros `refund_requested`.
          const refundPending = item.payment_status === 'refund_requested' || item.payment_status === 'pending';

          
          if (source === 'registration' || item.service_type === 'curso') {
            // Si ya hay reembolso pending, mostramos botón de cancelar solicitud
            if (refundPending && item.status !== 'cancelled' && !canRefund) { // Evitar duplicados
              canRefund = true;
            }
          }


          if (canRefund && !refundBtn) { // Solo si no es un reembolso directo
            // Si el admin aprobó, el refund comprobante vive en refundsData solo para refund_status='approved'.
            // En el historial base (my-history-get) ese item suele venir sin admin_receipt.
            // Para evitar depender de merge/deduplicación, cuando está aprobado intentamos leer admin_receipt
            // y si no existe mostramos el modal con el fallback en el mismo objeto.

            // refundPending se basa en payment_status === 'refund_requested'
            const isPending = refundPending;

            const btnState = isPending ? 'cancel' : 'active';
            const refundApproved = (item.status === 'refund_approved' || item.payment_status === 'refunded' || item.refund_status === 'approved' || (item.refund_status && item.refund_status.includes('approved')));
            const btnText = refundApproved ? 'Comprobante Reembolso' : (isPending ? 'Cancelar Reembolso' : 'Solicitar Reembolso');


            // Si está aprobado: mostrar botón verde y abrir comprobante como en agendar.html
            const btnClass = refundApproved
              ? 'bg-green-600 hover:bg-green-700'
              : (isPending ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700');

            if (refundApproved) {
              // Botón verde: abrir modal de comprobante como en agendar.html
              // Nota: en tu merge el campo `admin_receipt` existe en algunos casos.
              // En otros casos el valor parece venir en `item.admin_receipt` pero se ignora por el render previo.
              const receipt = item.admin_receipt || item.refund_admin_receipt || item.admin_receipt_base64 || item.adminReceipt || null;

              // Construir src para <img> (soporta: data:image/...;base64, o base64 "pelado").
              let receiptSrc = receipt;
              if (receiptSrc && typeof receiptSrc === 'string') {
                receiptSrc = receiptSrc.trim();
                if (receiptSrc && !receiptSrc.startsWith('data:')) {
                  receiptSrc = 'data:image/jpeg;base64,' + receiptSrc;
                }
              }

              refundBtn =
                '<button type="button" class="refund-receipt-btn px-3 py-1 text-white rounded text-xs transition-colors ' + btnClass + '" ' +
                'data-receipt="' + (receiptSrc ? String(receiptSrc).replace(/"/g, '"') : '') + '" ' +
                'onclick="window.handleRefundReceiptClick(this)"' +
                '>Comprobante Reembolso</button>';


            } else {
              refundBtn =
                '<button type="button" class="refund-toggle-btn px-3 py-1 text-white rounded text-xs transition-colors ' + btnClass + ' " ' +
                'data-refund-id="' + item.id + '" data-refund-type="' + (source === 'registration' ? 'registration' : 'advisory') + '" data-state="' + btnState + '" onclick="window.handleRefundToggle(this)">' +
                btnText + '</button>';
            }

          }




          const row = document.createElement('tr');
          row.className = 'border-b border-gray-700';
          row.innerHTML =
            '<td class="py-3 px-6 text-gray-400 text-sm min-w-[120px]">' + dateStr + '</td>' +
            '<td class="py-3 px-6 text-gray-400 text-sm min-w-[100px]">' + serviceTypeLabel + '</td>' +
            '<td class="py-3 px-6 text-white text-sm min-w-[200px]">' + serviceName + '</td>' +
            '<td class="py-3 px-6 text-gray-400 text-sm min-w-[120px]">' + priceStr + '</td>' +
            '<td class="py-3 px-6 min-w-[120px]"><span class="px-2 py-1 ' + statusClass + ' rounded-full text-xs">' + statusLabel + '</span></td>' +
            '<td class="py-3 px-6 min-w-[150px]"><div class="flex space-x-2">' +
            refundBtn +
            '<button type="button" class="ver-detalles-historial-btn px-3 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700" ' +
            'data-id="' + item.id + '" data-source="' + source + '">Ver más</button>' +
            '</div></td>';


          tbody.appendChild(row);
        });

        // Details buttons
        tbody.querySelectorAll('.ver-detalles-historial-btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            const item = allHistoryData.find(h => String(h.id) === String(id)); // Buscar en todos los datos, no solo en la página actual
            if (!item) return;

            const details = [];
            if (item.advisory_mode) details.push('Modalidad: ' + item.advisory_mode);
            if (item.date) details.push('Fecha: ' + new Date(item.date).toLocaleDateString('es-ES'));
            if (item.time) details.push('Hora: ' + item.time);
            if (item.num_persons > 1) details.push('Personas: ' + item.num_personas);
            if (item.notes) details.push('Notas: ' + item.notes);
            if (item.price) details.push('Precio: $' + Number(item.price).toLocaleString('es-CO'));

            const contentDiv = document.getElementById('detalles-solicitud-content');
            const titleEl = document.getElementById('detalles-modal-title');
            if (titleEl) titleEl.textContent = 'Detalles de la Solicitud';

            if (contentDiv) {
              contentDiv.innerHTML = details
                .map(line => '<div class="py-2 border-b border-gray-700 last:border-0">' + line + '</div>')
                .join('');
            }

            const modal = document.getElementById('detalles-solicitud-modal');
            if (modal) modal.classList.remove('hidden');
          });
        });
        
        // Actualizar controles de paginación
        updatePaginationControls(totalPages, currentPage);
      } else {
        tbody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-gray-400">No hay historial de solicitudes.</td></tr>';
        updatePaginationControls(0, 0);
      }
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-red-300">Error al cargar historial.</td></tr>';
      updatePaginationControls(0, 0);
    }
  }

  // Función para actualizar los controles de paginación
  function updatePaginationControls(totalPages, currentPage) {
    const pageInfo = document.getElementById('history-pagination-info');
    const pageNumbers = document.getElementById('history-page-numbers');
    const prevButton = document.getElementById('history-prev-page');
    const nextButton = document.getElementById('history-next-page');
    
    if (!pageInfo || !pageNumbers || !prevButton || !nextButton) return;
    
    // Actualizar información de paginación
    if (totalPages > 0) {
      pageInfo.textContent = `Mostrando ${((currentPage - 1) * recordsPerPage) + 1}-${Math.min(currentPage * recordsPerPage, allHistoryData.length)} de ${allHistoryData.length} registros`;
    } else {
      pageInfo.textContent = 'No hay registros para mostrar';
    }
    
    // Actualizar botones de navegación
    prevButton.disabled = currentPage <= 1;
    nextButton.disabled = currentPage >= totalPages || totalPages === 0;
    
    // Generar números de página
    let pageLinks = '';
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      if (i === currentPage) {
        pageLinks += `<span class="mx-1 px-4 py-2 bg-purple-600 text-white rounded inline-flex items-center justify-center" style="min-height: 40px; min-width: 40px;">${i}</span>`;
      } else {
        pageLinks += `<button class="mx-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 inline-flex items-center justify-center" style="min-height: 40px; min-width: 40px;" onclick="changePage(${i})">${i}</button>`;
      }
    }
    
    pageNumbers.innerHTML = pageLinks;
  }
  
  // Función para cambiar de página
  function changePage(page) {
    currentPage = page;
    loadMyHistory();
  }
  
  // Función para ir a la página siguiente
  function nextPage() {
    const totalPages = Math.ceil(allHistoryData.length / recordsPerPage);
    if (currentPage < totalPages) {
      changePage(currentPage + 1);
    }
  }
  
  // Función para ir a la página anterior
  function prevPage() {
    if (currentPage > 1) {
      changePage(currentPage - 1);
    }
  }
  
  // Inicializar los controles de paginación cuando se cargue el DOM
  document.addEventListener('DOMContentLoaded', function () {
    // Agregar event listeners a los botones de paginación
    const prevButton = document.getElementById('history-prev-page');
    const nextButton = document.getElementById('history-next-page');
    
    if (prevButton) {
      prevButton.addEventListener('click', function() {
        prevPage();
      });
    }
    
    if (nextButton) {
      nextButton.addEventListener('click', function() {
        nextPage();
      });
    }
    
    // Cargar el historial (primera página)
    loadMyHistory();
  });

  function openRefundConfirmModal(refundId, refundType, mode = 'request') {
    const modal = document.getElementById('refund-confirm-modal');
    const msg = document.getElementById('refund-confirm-message');
    const confirmBtn = document.getElementById('refund-confirm-btn');
    const cancelBtn = document.getElementById('refund-confirm-cancel');
    const hiddenId = document.getElementById('refund-confirm-id');
    const hiddenType = document.getElementById('refund-confirm-type');
    const downloadBtn = document.getElementById('download-inscription-receipt-btn');

    if (!modal || !msg || !confirmBtn || !cancelBtn || !hiddenId || !hiddenType) return;

    // Asegurar que el botón de descarga esté oculto en este modal
    if (downloadBtn) {
      downloadBtn.classList.add('hidden');
      downloadBtn.disabled = true;
    }

    hiddenId.value = refundId;
    hiddenType.value = refundType;

    const isCancel = mode === 'cancel';
    msg.textContent = isCancel
      ? '¿Seguro que deseas cancelar la solicitud de reembolso para este curso?'
      : '¿Seguro que deseas solicitar un reembolso para este curso?';

    // IMPORTANTE: actualizar el texto del botón de confirmar para que cambie la interfaz
    confirmBtn.textContent = isCancel ? 'Confirmar Cancelación' : 'Confirmar';

    const doClose = () => modal.classList.add('hidden');
    cancelBtn.onclick = doClose;
    modal.onclick = (e) => {
      if (e.target === modal) doClose();
    };

    confirmBtn.onclick = async () => {
      doClose();
      if (isCancel) {
        await window.cancelRefundRequest(refundId, refundType);
      } else {
        await window.requestRefund(refundId, refundType, true);
      }
    };

    modal.classList.remove('hidden');
  }

  window.openRefundConfirmModal = openRefundConfirmModal;

  // Modal comprobante (para reembolsos aprobados)
  window.handleRefundReceiptClick = function(btn) {
    try {
      let receipt = btn.getAttribute('data-receipt');
      if (!receipt) {
        // fallback: puede venir en algún atributo alterno
        receipt = btn.getAttribute('data-refund-receipt') || null;
      }
      if (!receipt) {
        showToast('No hay comprobante disponible para esta solicitud.', 'error');
        return;
      }

      // Normalizar el src del comprobante
      let normalizedReceipt = receipt;
      if (normalizedReceipt && typeof normalizedReceipt === 'string') {
        normalizedReceipt = normalizedReceipt.trim();
        if (normalizedReceipt && !normalizedReceipt.startsWith('data:')) {
          const looksBase64 = /^[A-Za-z0-9+/\n\r=]+$/.test(normalizedReceipt);
          if (looksBase64) normalizedReceipt = 'data:image/jpeg;base64,' + normalizedReceipt;
        }
      }

      if (!normalizedReceipt) {
        showToast('No hay comprobante disponible para esta solicitud.', 'error');
        return;
      }

      const modal = document.getElementById('comprobante-reembolso-modal');
      const contentDiv = document.getElementById('comprobante-solicitud-content');
      const titleEl = document.getElementById('comprobante-modal-title');
      const downloadBtn = document.getElementById('download-inscription-receipt-btn');
      if (!modal || !contentDiv) return;

      if (titleEl) titleEl.textContent = 'Comprobante de Reembolso';

      // Guardar el src del comprobante para la descarga
      window.__inscription_receipt_src = normalizedReceipt;

      // Mostrar botón de descarga y habilitarlo
      if (downloadBtn) {
        downloadBtn.style.display = '';
        downloadBtn.classList.remove('hidden');
        downloadBtn.disabled = false;
      }

      // Contenedor mediano como en agendar.html
      contentDiv.innerHTML =
        '<div class="flex justify-center w-full pt-0 pb-1">' +
        '<img id="inscription-receipt-img" src="' + normalizedReceipt + '" alt="Comprobante" class="max-h-[45vh] w-auto max-w-[420px] object-contain rounded" />' +
        '</div>';

      modal.classList.remove('hidden');
    } catch (e) {
      // no romper
      showToast('Error al mostrar el comprobante.', 'error');
    }
  };

  window.handleRefundToggle = async function (btn) {
    const id = btn.getAttribute('data-refund-id');
    const type = btn.getAttribute('data-refund-type');
    const state = btn.getAttribute('data-state') || 'active';

    if (state === 'active') {
      // Solicitar => confirmar modal de solicitud
      await openRefundConfirmModal(id, type);
      return;
    }

    // Cancelar => confirmar con modal (modal de cancelación)
    await openRefundConfirmModal(id, type, 'cancel');
  };

  // Función para descargar comprobante
  window.downloadInscriptionReceipt = function () {
    try {
      const src = window.__inscription_receipt_src;
      if (!src) {
        const notify = window.showToast || window.alert;
        notify('No hay comprobante disponible para descargar.', 'error');
        return;
      }

      const a = document.createElement('a');
      a.href = src;
      a.download = 'comprobante_reembolso';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      const notify = window.showToast || window.alert;
      notify('Error al descargar el comprobante.', 'error');
    }
  };

  // Función para cerrar el modal de detalles
  window.closeDetallesModal = function() {
    document.getElementById('detalles-solicitud-modal')?.classList.add('hidden');
  };

  // Función para cerrar el modal de comprobante
  window.closeComprobanteModal = function() {
    document.getElementById('comprobante-reembolso-modal')?.classList.add('hidden');
  };

  window.requestRefund = async function (id, type, alreadyConfirmed = false) {
    if (!alreadyConfirmed) return openRefundConfirmModal(id, type);

    try {
      const response = await fetch('/backend/api/refund-request.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: id, type: type })
      });

      const result = await response.json();

      if (result.success) {
        showToast(result.message, 'success');
        loadMyHistory();
      } else {
        showToast(result.message || 'Error al solicitar reembolso', 'error');
      }
    } catch (e) {
      showToast('Error de conexión', 'error');
    }
  };

  window.cancelRefundRequest = async function (id, type) {
    try {
      const response = await fetch('/backend/api/refund-cancel.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: id, type: type })
      });

      const result = await response.json();
      if (result.success) {
        showToast(result.message, 'success');
        loadMyHistory();
      } else {
        showToast(result.message || 'Error al cancelar', 'error');
      }
    } catch (e) {
      showToast('Error de conexión', 'error');
    }
  };
})();