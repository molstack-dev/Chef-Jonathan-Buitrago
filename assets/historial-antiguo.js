// assets/historial.js

(function () {
  function safeGetCurrentUser() {
    // Your existing app sometimes defines getCurrentUser() in assets/script.js.
    // If not present, return null.
    try {
      if (typeof getCurrentUser === 'function') return getCurrentUser();
    } catch (e) {}
    return null;
  }

  function showToast(message, type) {
    // Prefer global showToast if it exists.
    if (typeof window.showToast === 'function') return window.showToast(message, type);

    // Fallback (minimal)
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.className = 'px-4 py-3 rounded-lg shadow-lg text-white text-sm animate-fade-in ' +
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

      // Construir un historial unificado (refunds pendientes)
      const unified = [];
      historyData.forEach(item => unified.push(item));

      // Deduplicación (robusta): evita agregar el mismo refund dos veces.
      // existingKeys se construye SOLO con la info que my-history-get expone (no tiene refundable_id).
      // Usamos combinación de tipo/servicio/fecha/monto para aproximar.
      const existingKeys = new Set(
        historyData.map(h => {
          const hType = (h.type || h.source || '').toString();
          const hService = (h.service_title || h.service_name || '').toString();
          const hDate = (h.created_at || '').toString();
          const hPrice = (h.price ?? '').toString();
          return `${hType}:${hService}:${hDate}:${hPrice}`;
        })
      );

      refundsData.forEach(r => {
        console.log('[historial] refund row keys', { keys: r ? Object.keys(r) : [], admin_receipt: r ? r.admin_receipt : undefined, r });
        const rType = (r.type || '').toString();
        const rService = (r.service_title || r.service_name || '').toString();
        const rDate = (r.created_at || '').toString();
        const rPrice = (r.price ?? '').toString();
        const refundKey = `${rType}:${rService}:${rDate}:${rPrice}`;
        if (existingKeys.has(refundKey)) return;

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

      });

      if (unified.length > 0) {
        const history = unified;


        if (history.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-gray-400">No hay historial de solicitudes.</td></tr>';
          return;
        }

        tbody.innerHTML = '';

        history.forEach(function (item) {
          const statusClass =
            item.status === 'confirmed'
              ? 'bg-blue-900 text-blue-300'
              : item.status === 'completed'
                ? 'bg-green-900 text-green-300'
                : item.status === 'refund_requested'
                  ? 'bg-yellow-900 text-yellow-300'
                  : 'bg-red-900 text-red-300';

          const statusLabel =
            item.status === 'confirmed'
              ? 'Aprobado'
              : item.status === 'completed'
                ? 'Completado'
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

          if (source === 'registration' || item.service_type === 'curso') {
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
      if (refundPending && item.status !== 'cancelled') {
              canRefund = true;
            }
          }


          if (canRefund) {
            // Si el admin aprobó, el refund comprobante vive en refundsData solo para refund_status='approved'.
            // En el historial base (my-history-get) ese item suele venir sin admin_receipt.
            // Para evitar depender de merge/deduplicación, cuando está aprobado intentamos leer admin_receipt
            // y si no existe mostramos el modal con el fallback en el mismo objeto.

            // refundPending se basa en payment_status === 'refund_requested'
            const isPending = refundPending;

            const btnState = isPending ? 'cancel' : 'active';
            const refundApproved = (item.payment_status === 'refunded' || item.refund_status === 'approved');
            console.log('[historial] refundApproved?', { approved: refundApproved, payment_status: item.payment_status, refund_status: item.refund_status, item });
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
              console.log('[historial] receipt for refund', { id: item.id, receipt, itemAdminReceipt: item.admin_receipt, payment_status: item.payment_status });

              // Construir src para <img> (soporta: data:image/...;base64, o base64 “pelado”).
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




          // Debug: verificar que el payment_status llega al frontend
          // (si no quieres verlo, se puede quitar después)
          console.log('[historial] item', {
            id: item.id,
            source: source,
            status: item.status,
            payment_status: item.payment_status,
            created_at: item.created_at
          });

          const row = document.createElement('tr');
          row.className = 'border-b border-gray-700';
          row.innerHTML =
            '<td class="py-3 text-gray-400 text-sm">' + dateStr + '</td>' +
            '<td class="py-3 text-gray-400 text-sm">' + serviceTypeLabel + '</td>' +
            '<td class="py-3 text-white text-sm">' + serviceName + '</td>' +
            '<td class="py-3 text-gray-400 text-sm">' + priceStr + '</td>' +
            '<td class="py-3"><span class="px-2 py-1 ' + statusClass + ' rounded-full text-xs">' + statusLabel + '</span></td>' +
            '<td class="py-3"><div class="flex space-x-2">' +
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
            const item = history.find(h => String(h.id) === String(id));
            if (!item) return;

            const details = [];
            if (item.advisory_mode) details.push('Modalidad: ' + item.advisory_mode);
            if (item.date) details.push('Fecha: ' + new Date(item.date).toLocaleDateString('es-ES'));
            if (item.time) details.push('Hora: ' + item.time);
            if (item.num_persons > 1) details.push('Personas: ' + item.num_persons);
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
      } else {
        tbody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-gray-400">No hay historial de solicitudes.</td></tr>';
      }
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-red-300">Error al cargar historial.</td></tr>';
    }
  }

  function openRefundConfirmModal(refundId, refundType, mode = 'request') {
    const modal = document.getElementById('refund-confirm-modal');
    const msg = document.getElementById('refund-confirm-message');
    const confirmBtn = document.getElementById('refund-confirm-btn');
    const cancelBtn = document.getElementById('refund-confirm-cancel');
    const hiddenId = document.getElementById('refund-confirm-id');
    const hiddenType = document.getElementById('refund-confirm-type');

    if (!modal || !msg || !confirmBtn || !cancelBtn || !hiddenId || !hiddenType) return;

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

  window.handleRefundToggle = async function (btn) {
    const id = btn.getAttribute('data-refund-id');
    const type = btn.getAttribute('data-refund-type');
    const state = btn.getAttribute('data-state') || 'active';
  };

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



      const modal = document.getElementById('detalles-solicitud-modal');
      const contentDiv = document.getElementById('detalles-solicitud-content');
      const titleEl = document.getElementById('detalles-modal-title');
      if (!modal || !contentDiv) return;

      if (titleEl) titleEl.textContent = 'Comprobante de Reembolso';

      // Contenedor mediano como en agendar.html
      contentDiv.innerHTML =
        '<div class="flex justify-center">' +
        '<img src="' + receipt + '" alt="Comprobante" class="max-h-[60vh] w-auto max-w-[520px] object-contain rounded" />' +
        '</div>';

      modal.classList.remove('hidden');
    } catch (e) {
      // no romper
    }
  };

  window.handleRefundToggle = async function (btn) {
    const id = btn.getAttribute('data-refund-id');
    const type = btn.getAttribute('data-refund-type');
    const state = btn.getAttribute('data-state') || 'active';


    if (state === 'active') {
      // Solicitar => confirmar modal de solicitud
      await openRefundConfirmModal(id, type, 'request');
      return;
    }

    // Cancelar => confirmar con modal (modal de cancelación)
    await openRefundConfirmModal(id, type, 'cancel');
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


  document.addEventListener('DOMContentLoaded', function () {
    loadMyHistory();
  });
})();

