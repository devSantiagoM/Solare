import { el, formatCurrency, formatDate, showToast } from './utils.js';

export async function init() {
    // Botón de actualizar dashboard
    const refreshDashboardBtn = el('#btn-refresh-dashboard');
    if (refreshDashboardBtn) {
        refreshDashboardBtn.addEventListener('click', () => {
            loadDashboard();
            showToast('Dashboard actualizado', 'success');
        });
    }
}

export async function loadDashboard() {
    try {
        // Contar usuarios
        const { count: usersCount } = await window.supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // Contar productos
        const { count: productsCount } = await window.supabase
            .from('products')
            .select('*', { count: 'exact', head: true });

        // Contar pedidos
        const { count: ordersCount } = await window.supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });

        // Calcular total de ventas
        const { data: orders } = await window.supabase
            .from('orders')
            .select('total_amount');

        const salesTotal = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

        // Actualizar UI
        const dashUsersEl = el('#dash-users-count');
        const dashProductsEl = el('#dash-products-count');
        const dashOrdersEl = el('#dash-orders-count');
        const dashSalesEl = el('#dash-sales-total');

        if (dashUsersEl) dashUsersEl.textContent = usersCount || 0;
        if (dashProductsEl) dashProductsEl.textContent = productsCount || 0;
        if (dashOrdersEl) dashOrdersEl.textContent = ordersCount || 0;
        if (dashSalesEl) dashSalesEl.textContent = formatCurrency(salesTotal);

        // Cargar pedidos recientes
        await loadRecentOrders();

        // Cargar productos con bajo stock
        await loadLowStockProducts();
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        showToast('Error al cargar el dashboard', 'error');
    }
}

async function loadRecentOrders() {
    const container = el('#dashboard-recent-orders');
    if (!container) return;

    try {
        const { data: orders, error } = await window.supabase
            .from('orders')
            .select('id, order_number, total_amount, created_at, order_statuses(name)')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        if (!orders || orders.length === 0) {
            container.innerHTML = '<p class="admin-empty-state">No hay pedidos recientes</p>';
            return;
        }

        container.innerHTML = orders.map(order => {
            const statusName = order.order_statuses?.name || 'Pendiente';
            return `
      <div class="admin-stat-item">
        <div>
          <div class="admin-stat-item-title">Pedido ${order.order_number || order.id}</div>
          <div class="admin-stat-item-meta">${formatDate(order.created_at)} • ${formatCurrency(order.total_amount)}</div>
        </div>
        <span class="admin-badge admin-badge-${statusName}">${statusName}</span>
      </div>
    `;
        }).join('');
    } catch (error) {
        console.error('Error cargando pedidos recientes:', error);
        container.innerHTML = '<p class="admin-loading">Error al cargar</p>';
    }
}

async function loadLowStockProducts() {
    const container = el('#dashboard-low-stock');
    if (!container) return;

    try {
        const { data: products, error } = await window.supabase
            .from('products')
            .select('id, name, inventory_quantity, low_stock_threshold')
            .lt('inventory_quantity', 10)
            .order('inventory_quantity', { ascending: true })
            .limit(5);

        if (error) throw error;

        if (!products || products.length === 0) {
            container.innerHTML = '<p class="admin-empty-state">Todos los productos tienen stock suficiente</p>';
            return;
        }

        container.innerHTML = products.map(product => `
      <div class="admin-stat-item">
        <div>
          <div class="admin-stat-item-title">${product.name}</div>
          <div class="admin-stat-item-meta">Stock: ${product.inventory_quantity || 0} unidades</div>
        </div>
      </div>
    `).join('');
    } catch (error) {
        console.error('Error cargando productos con bajo stock:', error);
        container.innerHTML = '<p class="admin-loading">Error al cargar</p>';
    }
}
