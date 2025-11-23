import { el } from './utils.js';

export async function init() {
    // No specific event listeners for settings in init yet
}

export async function loadSettings() {
    // Cargar estados de pedidos
    await loadOrderStatuses();
}

async function loadOrderStatuses() {
    const container = el('#order-statuses-list');
    if (!container) return;

    try {
        // Nota: Esta tabla puede no existir, se puede crear o usar una configuración
        container.innerHTML = '<p class="admin-loading">Cargando estados...</p>';

        // Por ahora, mostrar estados predefinidos
        const defaultStatuses = [
            { name: 'Pendiente', value: 'pending', color: '#f59e0b' },
            { name: 'Procesando', value: 'processing', color: '#3b82f6' },
            { name: 'Enviado', value: 'shipped', color: '#8b5cf6' },
            { name: 'Entregado', value: 'delivered', color: '#10b981' },
            { name: 'Cancelado', value: 'cancelled', color: '#ef4444' },
        ];

        container.innerHTML = defaultStatuses.map(status => `
      <div class="admin-order-status-item">
        <div>
          <strong>${status.name}</strong>
          <div style="font-size: 0.8rem; color: var(--admin-muted);">${status.value}</div>
        </div>
        <div style="width: 24px; height: 24px; border-radius: 50%; background: ${status.color}; border: 2px solid var(--admin-border);"></div>
      </div>
    `).join('');
    } catch (error) {
        console.error('Error cargando estados:', error);
        container.innerHTML = '<p class="admin-loading">Error al cargar estados</p>';
    }
}
