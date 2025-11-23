import { el, formatDate, showToast } from './utils.js';
import { state } from './state.js';

export async function init() {
    const userModal = el('#user-modal');
    const userForm = el('#form-user');
    const btnCloseUserModal = el('#btn-close-user-modal');
    const btnCancelUser = el('#btn-cancel-user');

    if (btnCloseUserModal) {
        btnCloseUserModal.addEventListener('click', closeUserModal);
    }

    if (btnCancelUser) {
        btnCancelUser.addEventListener('click', closeUserModal);
    }

    if (userModal) {
        userModal.addEventListener('click', (e) => {
            if (e.target === userModal) {
                closeUserModal();
            }
        });
    }

    // Guardar usuario
    if (userForm) {
        userForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            try {
                const formData = new FormData(userForm);
                const userId = formData.get('id');
                const role = formData.get('role');

                // Validar que el rol sea uno de los valores permitidos
                const validRoles = ['customer', 'admin', 'staff'];
                const finalRole = validRoles.includes(role) ? role : 'customer';

                const profileData = {
                    first_name: formData.get('first_name') || null,
                    last_name: formData.get('last_name') || null,
                    phone: formData.get('phone') || null,
                    is_active: formData.get('is_active') === 'on',
                    role: finalRole // Usar el rol validado
                };

                // Actualizar perfil en la tabla profiles
                const { error: profileError } = await window.supabase
                    .from('profiles')
                    .update(profileData)
                    .eq('id', userId);

                if (profileError) throw profileError;

                showToast('Usuario actualizado correctamente', 'success');
                closeUserModal();
                await loadUsers();
            } catch (error) {
                console.error('Error guardando usuario:', error);
                showToast('Error al guardar el usuario: ' + (error.message || 'Error desconocido'), 'error');
            }
        });
    }
}

export async function loadUsers() {
    const tbody = el('#users-table-body');
    const countEl = el('#users-count');
    if (!tbody) return;

    try {
        tbody.innerHTML = '<tr><td colspan="6" class="admin-table-empty"><p>Cargando usuarios...</p></td></tr>';

        const { data: profiles, error } = await window.supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!profiles || profiles.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="admin-table-empty"><p>No hay usuarios</p></td></tr>';
            if (countEl) countEl.textContent = '0 usuarios';
            return;
        }

        // Obtener roles de los usuarios desde auth
        const userRoles = {};

        // Intentar obtener roles desde user_metadata (esto requiere permisos de admin)
        for (const profile of profiles) {
            try {
                // Obtener role desde diferentes fuentes
                const role = profile.role || profile.rol || null;
                userRoles[profile.id] = role || 'customer';
            } catch (err) {
                userRoles[profile.id] = 'customer';
            }
        }

        tbody.innerHTML = profiles.map(profile => {
            const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Sin nombre';
            const statusClass = profile.is_active !== false ? 'admin-badge-active' : 'admin-badge-inactive';
            const statusText = profile.is_active !== false ? 'Activo' : 'Inactivo';
            const userRole = userRoles[profile.id] || 'customer';
            const roleBadgeClass = userRole === 'admin' ? 'admin-badge-processing' : 'admin-badge-inactive';

            return `
        <tr>
          <td>${fullName}</td>
          <td>${profile.email || 'Sin email'}</td>
          <td>${profile.phone || '—'}</td>
          <td>${formatDate(profile.created_at)}</td>
          <td>
            <span class="admin-badge ${statusClass}">${statusText}</span>
            <br>
            <span class="admin-badge ${roleBadgeClass}" style="margin-top: 0.25rem; font-size: 0.7rem;">${userRole}</span>
          </td>
          <td class="admin-th-actions">
            <div class="admin-table-actions">
              <button class="admin-action-btn admin-action-btn-edit" onclick="admin.editUser('${profile.id}')" title="Editar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
        }).join('');

        if (countEl) countEl.textContent = `${profiles.length} usuario${profiles.length !== 1 ? 's' : ''}`;
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        showToast('Error al cargar usuarios', 'error');
    }
}

export async function openUserModal(userId) {
    state.editingUserId = userId;
    const title = el('#user-modal-title');
    const userModal = el('#user-modal');

    if (title) {
        title.textContent = 'Editar Usuario';
    }

    try {
        // Cargar datos del usuario
        const { data: profile, error } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;

        // Obtener role desde el perfil (el valor por defecto debe ser uno válido según el constraint)
        let userRole = profile.role || 'customer'; // 'customer' es el valor por defecto válido

        // Llenar formulario
        if (el('#user-id')) el('#user-id').value = profile.id || '';
        if (el('#user-first-name')) el('#user-first-name').value = profile.first_name || '';
        if (el('#user-last-name')) el('#user-last-name').value = profile.last_name || '';
        if (el('#user-email')) el('#user-email').value = profile.email || '';
        if (el('#user-phone')) el('#user-phone').value = profile.phone || '';
        if (el('#user-role')) el('#user-role').value = userRole;
        if (el('#user-is-active')) el('#user-is-active').checked = profile.is_active !== false;

        if (userModal) {
            userModal.hidden = false;
            userModal.removeAttribute('hidden');
            document.body.style.overflow = 'hidden';
        }
    } catch (error) {
        console.error('Error cargando usuario:', error);
        showToast('Error al cargar el usuario: ' + (error.message || 'Error desconocido'), 'error');
    }
}

function closeUserModal() {
    const userModal = el('#user-modal');
    const userForm = el('#form-user');

    if (userModal) {
        userModal.hidden = true;
        userModal.setAttribute('hidden', '');
        document.body.style.overflow = '';
    }
    state.editingUserId = null;
    if (userForm) userForm.reset();
}

// Global actions
export async function editUser(id) {
    await openUserModal(id);
}
