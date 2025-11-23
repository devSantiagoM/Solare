import { el, formatCurrency, formatDate, showToast } from './utils.js';

export async function init() {
    // No specific event listeners for orders in init yet
}

export async function loadOrders() {
    const tbody = el('#orders-table-body');
    const countEl = el('#orders-count');
    if (!tbody) return;

    try {
        tbody.innerHTML = '<tr><td colspan="6" class="admin-table-empty"><p>Cargando pedidos...</p></td></tr>';

        const { data: orders, error } = await window.supabase
            .from('orders')
            .select(`
        *,
        profiles(id, first_name, last_name, email)
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="admin-table-empty"><p>No hay pedidos</p></td></tr>';
            if (countEl) countEl.textContent = '0 pedidos';
            return;
        }

        tbody.innerHTML = orders.map(order => {
            const customerName = order.profiles
                ? `${order.profiles.first_name || ''} ${order.profiles.last_name || ''}`.trim() || order.profiles.email
                : 'Cliente desconocido';
            const statusClass = getOrderStatusClass(order.status);
            const statusText = order.status || 'Pendiente';

            return `
        <tr>
          <td><strong>${order.order_number || order.id}</strong></td>
          <td>${customerName}</td>
          <td>${formatDate(order.created_at)}</td>
          <td><span class="admin-badge ${statusClass}">${statusText}</span></td>
          <td class="admin-th-right">${formatCurrency(order.total || 0)}</td>
          <td class="admin-th-actions">
            <div class="admin-table-actions">
              <button class="admin-action-btn admin-action-btn-edit" onclick="admin.viewOrder('${order.id}')" title="Ver detalle">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
        }).join('');

        if (countEl) countEl.textContent = `${orders.length} pedido${orders.length !== 1 ? 's' : ''}`;
    } catch (error) {
        console.error('Error cargando pedidos:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="admin-table-empty"><p>Error al cargar pedidos</p></td></tr>';
        showToast('Error al cargar pedidos', 'error');
    }
}

function getOrderStatusClass(status) {
    const statusMap = {
        'pending': 'admin-badge-pending',
        'processing': 'admin-badge-processing',
        'shipped': 'admin-badge-shipped',
        'delivered': 'admin-badge-delivered',
        'cancelled': 'admin-badge-cancelled',
    };
    return statusMap[status] || 'admin-badge-pending';
}

// Global actions
export async function viewOrder(id) {
    // Implementar vista de detalle de pedido
    showToast('Funcionalidad en desarrollo', 'info');
}
