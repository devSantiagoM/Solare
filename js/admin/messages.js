import { el, formatDate, showToast } from './utils.js';

export async function init() {
  // No specific event listeners for messages in init yet
}

export async function loadMessages() {
  const tbody = el('#messages-table-body');
  const countEl = el('#messages-count');
  if (!tbody) return;

  try {
    tbody.innerHTML = '<tr><td colspan="7" class="admin-table-empty"><p>Cargando mensajes...</p></td></tr>';

    const { data: messages, error } = await window.supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!messages || messages.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="admin-table-empty"><p>No hay mensajes</p></td></tr>';
      if (countEl) countEl.textContent = '0 mensajes';
      return;
    }

    tbody.innerHTML = messages.map(message => {
      const statusClass = getMessageStatusClass(message.status);
      return `
        <tr>
          <td>${formatDate(message.created_at)}</td>
          <td>
            <div>${message.name || 'Anónimo'}</div>
            <small style="color: var(--admin-muted);">${message.email || ''}</small>
          </td>
          <td>${message.subject || 'Sin asunto'}</td>
          <td>${message.category || 'General'}</td>
          <td><span class="admin-badge ${statusClass}">${message.status || 'new'}</span></td>
          <td>${message.priority || 'Normal'}</td>
          <td class="admin-th-actions">
            <div class="admin-table-actions">
              <button class="admin-action-btn admin-action-btn-edit" onclick="admin.viewMessage('${message.id}')" title="Ver detalle">
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

    if (countEl) countEl.textContent = `${messages.length} mensaje${messages.length !== 1 ? 's' : ''}`;
  } catch (error) {
    console.error('Error cargando mensajes:', error);
    tbody.innerHTML = '<tr><td colspan="7" class="admin-table-empty"><p>Error al cargar mensajes</p></td></tr>';
    showToast('Error al cargar mensajes', 'error');
  }
}

function getMessageStatusClass(status) {
  const statusMap = {
    'new': 'admin-badge-pending',
    'in_progress': 'admin-badge-processing',
    'resolved': 'admin-badge-delivered',
    'closed': 'admin-badge-inactive',
  };
  return statusMap[status] || 'admin-badge-pending';
}

// Global actions
export async function viewMessage(id) {
  // Implementar vista de mensaje
  showToast('Funcionalidad en desarrollo', 'info');
}
