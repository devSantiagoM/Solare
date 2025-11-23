import { el, showToast } from './utils.js';

export async function init() {
    const filterStatus = el('#reviews-filter-status');
    if (filterStatus) {
        filterStatus.addEventListener('change', loadReviews);
    }
}

export async function loadReviews() {
    const tbody = el('#reviews-table-body');
    const countEl = el('#reviews-count');
    const filterStatus = el('#reviews-filter-status');
    if (!tbody) return;

    try {
        tbody.innerHTML = '<tr><td colspan="6" class="admin-table-empty"><p>Cargando reseñas...</p></td></tr>';

        let query = window.supabase
            .from('product_reviews')
            .select(`
        *,
        products(name),
        profiles(first_name, last_name, email)
      `)
            .order('created_at', { ascending: false });

        if (filterStatus && filterStatus.value) {
            if (filterStatus.value === 'approved') query = query.eq('is_approved', true);
            if (filterStatus.value === 'pending') query = query.eq('is_approved', false);
        }

        const { data: reviews, error } = await query;

        if (error) throw error;

        if (!reviews || reviews.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="admin-table-empty"><p>No hay reseñas</p></td></tr>';
            if (countEl) countEl.textContent = '0 reseñas';
            return;
        }

        tbody.innerHTML = reviews.map(review => {
            const productName = review.products?.name || 'Producto eliminado';
            const userName = review.profiles
                ? `${review.profiles.first_name || ''} ${review.profiles.last_name || ''}`.trim() || review.profiles.email
                : 'Anónimo';

            const statusBadge = review.is_approved
                ? '<span class="admin-badge admin-badge-active">Aprobada</span>'
                : '<span class="admin-badge admin-badge-pending">Pendiente</span>';

            return `
        <tr>
          <td>${productName}</td>
          <td>${userName}</td>
          <td>${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</td>
          <td><div class="admin-text-truncate" title="${review.comment}">${review.comment || ''}</div></td>
          <td>${statusBadge}</td>
          <td class="admin-th-actions">
            <div class="admin-table-actions">
              ${!review.is_approved ? `
                <button class="admin-action-btn admin-action-btn-success" onclick="admin.approveReview('${review.id}')" title="Aprobar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </button>
              ` : `
                <button class="admin-action-btn admin-action-btn-warning" onclick="admin.rejectReview('${review.id}')" title="Rechazar (Ocultar)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              `}
              <button class="admin-action-btn admin-action-btn-delete" onclick="admin.deleteReview('${review.id}')" title="Eliminar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
        }).join('');

        if (countEl) countEl.textContent = `${reviews.length} reseña${reviews.length !== 1 ? 's' : ''}`;
    } catch (error) {
        console.error('Error cargando reseñas:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="admin-table-empty"><p>Error al cargar reseñas</p></td></tr>';
    }
}

// Global actions
export async function approveReview(id) {
    try {
        const { error } = await window.supabase.from('product_reviews').update({ is_approved: true }).eq('id', id);
        if (error) throw error;
        showToast('Reseña aprobada', 'success');
        await loadReviews();
    } catch (e) {
        console.error(e);
        showToast('Error al aprobar reseña', 'error');
    }
}

export async function rejectReview(id) {
    try {
        const { error } = await window.supabase.from('product_reviews').update({ is_approved: false }).eq('id', id);
        if (error) throw error;
        showToast('Reseña rechazada (oculta)', 'info');
        await loadReviews();
    } catch (e) {
        console.error(e);
        showToast('Error al rechazar reseña', 'error');
    }
}

export async function deleteReview(id) {
    if (!confirm('¿Estás seguro de eliminar esta reseña permanentemente?')) return;
    try {
        const { error } = await window.supabase.from('product_reviews').delete().eq('id', id);
        if (error) throw error;
        showToast('Reseña eliminada', 'success');
        await loadReviews();
    } catch (e) {
        console.error(e);
        showToast('Error al eliminar reseña', 'error');
    }
}
