import { el, formatCurrency, formatDate, showToast } from './utils.js';

let editingCouponId = null;

export async function init() {
    const couponModal = el('#coupon-modal');
    const couponForm = el('#coupon-form');
    const btnAddCoupon = el('#btn-add-coupon');
    const btnCloseCouponModal = el('#btn-close-coupon-modal');
    const btnCancelCoupon = el('#btn-cancel-coupon');

    if (btnAddCoupon) {
        btnAddCoupon.addEventListener('click', () => {
            editingCouponId = null;
            openCouponModal();
        });
    }

    if (btnCloseCouponModal) btnCloseCouponModal.addEventListener('click', closeCouponModal);
    if (btnCancelCoupon) btnCancelCoupon.addEventListener('click', closeCouponModal);

    if (couponForm) {
        couponForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(couponForm);

            const data = {
                code: formData.get('code').toUpperCase(),
                type: formData.get('discount_type'),
                value: parseFloat(formData.get('discount_value')),
                minimum_amount: formData.get('min_purchase_amount') ? parseFloat(formData.get('min_purchase_amount')) : null,
                starts_at: formData.get('start_date') || null,
                expires_at: formData.get('end_date') || null,
                usage_limit: formData.get('usage_limit') ? parseInt(formData.get('usage_limit')) : null,
                is_active: formData.get('is_active') === 'on'
            };

            try {
                let error;
                if (editingCouponId) {
                    ({ error } = await window.supabase
                        .from('discount_codes')
                        .update(data)
                        .eq('id', editingCouponId));
                } else {
                    ({ error } = await window.supabase
                        .from('discount_codes')
                        .insert([data]));
                }

                if (error) throw error;

                showToast('Cupón guardado correctamente', 'success');
                closeCouponModal();
                await loadCoupons();
            } catch (err) {
                console.error('Error guardando cupón:', err);
                showToast('Error al guardar el cupón', 'error');
            }
        });
    }
}

export async function loadCoupons() {
    const tbody = el('#coupons-table-body');
    const countEl = el('#coupons-count');
    if (!tbody) return;

    try {
        tbody.innerHTML = '<tr><td colspan="6" class="admin-table-empty"><p>Cargando cupones...</p></td></tr>';

        const { data: coupons, error } = await window.supabase
            .from('discount_codes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!coupons || coupons.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="admin-table-empty"><p>No hay cupones</p></td></tr>';
            if (countEl) countEl.textContent = '0 cupones';
            return;
        }

        tbody.innerHTML = coupons.map(coupon => {
            const statusClass = coupon.is_active ? 'admin-badge-active' : 'admin-badge-inactive';
            const typeText = coupon.type === 'percentage' ? '%' : '$';
            const valueText = coupon.type === 'percentage' ? `${coupon.value}%` : formatCurrency(coupon.value);

            return `
        <tr>
          <td><strong>${coupon.code}</strong></td>
          <td>${valueText}</td>
          <td>${coupon.usage_count || 0} / ${coupon.usage_limit || '∞'}</td>
          <td>${formatDate(coupon.expires_at)}</td>
          <td><span class="admin-badge ${statusClass}">${coupon.is_active ? 'Activo' : 'Inactivo'}</span></td>
          <td class="admin-th-actions">
            <div class="admin-table-actions">
              <button class="admin-action-btn admin-action-btn-edit" onclick="admin.editCoupon('${coupon.id}')" title="Editar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="admin-action-btn admin-action-btn-delete" onclick="admin.deleteCoupon('${coupon.id}')" title="Eliminar">
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

        if (countEl) countEl.textContent = `${coupons.length} cupón${coupons.length !== 1 ? 'es' : ''}`;
    } catch (error) {
        console.error('Error cargando cupones:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="admin-table-empty"><p>Error al cargar cupones</p></td></tr>';
        showToast('Error al cargar cupones', 'error');
    }
}

export async function openCouponModal(couponId = null) {
    editingCouponId = couponId;
    const title = el('#coupon-modal-title');
    const couponModal = el('#coupon-modal');
    const couponForm = el('#coupon-form');

    if (title) title.textContent = couponId ? 'Editar Cupón' : 'Nuevo Cupón';

    if (couponId) {
        try {
            const { data: coupon, error } = await window.supabase
                .from('discount_codes')
                .select('*')
                .eq('id', couponId)
                .single();

            if (error) throw error;

            if (el('#coupon-code')) el('#coupon-code').value = coupon.code;
            if (el('#coupon-type')) el('#coupon-type').value = coupon.type;
            if (el('#coupon-value')) el('#coupon-value').value = coupon.value;
            if (el('#coupon-min-purchase')) el('#coupon-min-purchase').value = coupon.minimum_amount || '';
            if (el('#coupon-start-date')) el('#coupon-start-date').value = coupon.starts_at ? new Date(coupon.starts_at).toISOString().slice(0, 16) : '';
            if (el('#coupon-end-date')) el('#coupon-end-date').value = coupon.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : '';
            if (el('#coupon-usage-limit')) el('#coupon-usage-limit').value = coupon.usage_limit || '';
            if (el('#coupon-is-active')) el('#coupon-is-active').checked = coupon.is_active;

        } catch (error) {
            console.error('Error cargando cupón:', error);
            showToast('Error al cargar el cupón', 'error');
            return;
        }
    } else {
        if (couponForm) couponForm.reset();
        if (el('#coupon-is-active')) el('#coupon-is-active').checked = true;
    }

    if (couponModal) {
        couponModal.hidden = false;
        couponModal.removeAttribute('hidden');
    }
}

function closeCouponModal() {
    const couponModal = el('#coupon-modal');
    const couponForm = el('#coupon-form');
    if (couponModal) {
        couponModal.hidden = true;
        couponModal.setAttribute('hidden', '');
    }
    editingCouponId = null;
    if (couponForm) couponForm.reset();
}

// Global actions
export function editCoupon(id) {
    openCouponModal(id);
}

export async function deleteCoupon(id) {
    if (!confirm('¿Estás seguro de eliminar este cupón?')) return;
    try {
        const { error } = await window.supabase.from('discount_codes').delete().eq('id', id);
        if (error) throw error;
        showToast('Cupón eliminado', 'success');
        await loadCoupons();
    } catch (e) {
        console.error(e);
        showToast('Error al eliminar cupón', 'error');
    }
}
