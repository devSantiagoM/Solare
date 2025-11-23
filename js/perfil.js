// Perfil Page - Solare
(function () {
  'use strict';

  // Elementos del DOM
  const el = (sel, ctx = document) => ctx.querySelector(sel);
  const els = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // Estado
  let currentUser = null;
  let currentProfile = null;
  let editingAddressId = null;

  // Inicialización
  async function init() {
    if (!window.supabase) {
      setTimeout(init, 100);
      return;
    }

    // Verificar autenticación
    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();

    if (sessionError || !session) {
      window.location.href = 'login.html';
      return;
    }

    currentUser = session.user;

    // Cargar perfil
    await loadProfile();

    // Configurar navegación
    setupNavigation();

    // Configurar formularios
    setupForms();

    // Configurar eventos
    setupEvents();

    // Cargar datos iniciales
    await loadAddresses();
    await loadOrders();
    loadNotifications();
  }

  // Cargar perfil del usuario
  async function loadProfile() {
    try {
      // Intentar cargar desde la tabla profiles
      const { data: profile, error } = await window.supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error cargando perfil:', error);
        // Si no existe, crear perfil básico
        await createProfile();
        return;
      }

      currentProfile = profile || {
        id: currentUser.id,
        email: currentUser.email,
        first_name: currentUser.user_metadata?.first_name || currentUser.user_metadata?.firstName || '',
        last_name: currentUser.user_metadata?.last_name || currentUser.user_metadata?.lastName || '',
        phone: '',
        date_of_birth: null,
        gender: null,
        avatar_url: null,
        email_notifications: true,
        sms_notifications: false,
        role: 'user' // Default role
      };

      // Actualizar UI
      updateProfileUI();

      console.log('Current Profile:', currentProfile);
      console.log('User Role:', currentProfile.role);

      // Mostrar botón de admin si corresponde
      if (currentProfile.role === 'admin' || currentProfile.role === 'staff') {
        console.log('Showing admin button');
        const adminBtn = el('#btn-admin-panel');
        if (adminBtn) adminBtn.hidden = false;
      } else {
        console.log('Hiding admin button (role mismatch or no role)');
      }

    } catch (error) {
      console.error('Error en loadProfile:', error);
      // Usar datos básicos del usuario
      currentProfile = {
        id: currentUser.id,
        email: currentUser.email,
        first_name: currentUser.user_metadata?.first_name || currentUser.user_metadata?.firstName || '',
        last_name: currentUser.user_metadata?.last_name || currentUser.user_metadata?.lastName || '',
        phone: '',
        date_of_birth: null,
        gender: null,
        avatar_url: null,
        email_notifications: true,
        sms_notifications: false
      };
      updateProfileUI();
    }
  }

  // Crear perfil si no existe
  async function createProfile() {
    try {
      const newProfile = {
        id: currentUser.id,
        email: currentUser.email,
        first_name: currentUser.user_metadata?.first_name || currentUser.user_metadata?.firstName || '',
        last_name: currentUser.user_metadata?.last_name || currentUser.user_metadata?.lastName || '',
        phone: '',
        date_of_birth: null,
        gender: null,
        avatar_url: null,
        email_notifications: true,
        sms_notifications: false
      };

      const { data, error } = await window.supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (error) throw error;

      currentProfile = data;
      updateProfileUI();
    } catch (error) {
      console.error('Error creando perfil:', error);
      // Continuar con datos básicos
      currentProfile = {
        id: currentUser.id,
        email: currentUser.email,
        first_name: currentUser.user_metadata?.first_name || currentUser.user_metadata?.firstName || '',
        last_name: currentUser.user_metadata?.last_name || currentUser.user_metadata?.lastName || '',
        phone: '',
        date_of_birth: null,
        gender: null,
        avatar_url: null,
        email_notifications: true,
        sms_notifications: false
      };
      updateProfileUI();
    }
  }

  // Actualizar UI del perfil
  function updateProfileUI() {
    const nameEl = el('#perfil-name');
    const emailEl = el('#perfil-email');
    const avatarEl = el('#perfil-avatar');
    const firstNameEl = el('#first-name');
    const lastNameEl = el('#last-name');
    const emailInputEl = el('#email');
    const phoneEl = el('#phone');
    const dobEl = el('#date-of-birth');
    const genderEl = el('#gender');

    if (nameEl) {
      const fullName = `${currentProfile.first_name || ''} ${currentProfile.last_name || ''}`.trim() || 'Usuario';
      nameEl.textContent = fullName;
    }

    if (emailEl) {
      emailEl.textContent = currentProfile.email || currentUser.email;
    }

    if (avatarEl) {
      if (currentProfile.avatar_url) {
        avatarEl.src = currentProfile.avatar_url;
      } else {
        const name = (currentProfile.first_name || 'Usuario').charAt(0).toUpperCase();
        avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111&color=fff&size=128`;
      }
    }

    if (firstNameEl) firstNameEl.value = currentProfile.first_name || '';
    if (lastNameEl) lastNameEl.value = currentProfile.last_name || '';
    if (emailInputEl) emailInputEl.value = currentProfile.email || currentUser.email;
    if (phoneEl) phoneEl.value = currentProfile.phone || '';
    if (dobEl) dobEl.value = currentProfile.date_of_birth || '';
    if (genderEl) genderEl.value = currentProfile.gender || '';
  }

  // Configurar navegación
  function setupNavigation() {
    const navButtons = els('.perfil-nav-btn');
    const sections = els('.perfil-section');

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const sectionName = btn.dataset.section;

        // Actualizar botones activos
        navButtons.forEach(b => b.classList.remove('perfil-nav-btn-active'));
        btn.classList.add('perfil-nav-btn-active');

        // Mostrar sección correspondiente
        sections.forEach(s => {
          s.classList.remove('perfil-section-active');
          if (s.dataset.perfilSection === sectionName) {
            s.classList.add('perfil-section-active');
          }
        });
      });
    });
  }

  // Configurar formularios
  function setupForms() {
    // Formulario de información personal
    const infoForm = el('#form-informacion');
    if (infoForm) {
      infoForm.addEventListener('submit', handleUpdateProfile);
    }

    // Formulario de dirección
    const addressForm = el('#form-address');
    if (addressForm) {
      addressForm.addEventListener('submit', handleSaveAddress);
    }

    // Formulario de contraseña
    const passwordForm = el('#form-password');
    if (passwordForm) {
      passwordForm.addEventListener('submit', handleChangePassword);
    }

    // Formulario de notificaciones
    const notificationsForm = el('#form-notifications');
    if (notificationsForm) {
      notificationsForm.addEventListener('submit', handleUpdateNotifications);
    }
  }

  // Configurar eventos
  function setupEvents() {
    // Botón de cerrar sesión
    const logoutBtn = el('#btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }

    // Botón de ir a inicio
    const homeBtn = el('#btn-go-home');
    if (homeBtn) {
      homeBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }

    // Botón de ir al panel de admin
    const adminBtn = el('#btn-admin-panel');
    if (adminBtn) {
      adminBtn.addEventListener('click', () => {
        window.location.href = 'admin.html';
      });
    }

    // Cambiar avatar
    const changeAvatarBtn = el('#btn-change-avatar');
    const avatarInput = el('#avatar-input');
    if (changeAvatarBtn && avatarInput) {
      changeAvatarBtn.addEventListener('click', () => {
        avatarInput.click();
      });

      avatarInput.addEventListener('change', handleAvatarChange);
    }

    // Agregar dirección
    const addAddressBtn = el('#btn-add-address');
    if (addAddressBtn) {
      addAddressBtn.addEventListener('click', () => {
        editingAddressId = null;
        openAddressModal();
      });
    }

    // Cerrar modal de dirección
    const closeModalBtn = el('#btn-close-address-modal');
    const cancelAddressBtn = el('#btn-cancel-address');
    const addressModal = el('#address-modal');

    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeAddressModal();
      });
    }

    if (cancelAddressBtn) {
      cancelAddressBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeAddressModal();
      });
    }

    if (addressModal) {
      addressModal.addEventListener('click', (e) => {
        if (e.target === addressModal) {
          closeAddressModal();
        }
      });
    }

    // Cerrar con tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && addressModal && !addressModal.hidden) {
        closeAddressModal();
      }
    });
  }

  // Actualizar perfil
  async function handleUpdateProfile(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      phone: formData.get('phone') || null,
      date_of_birth: formData.get('date_of_birth') || null,
      gender: formData.get('gender') || null,
      updated_at: new Date().toISOString()
    };

    try {
      // Actualizar en Supabase
      const { error } = await window.supabase
        .from('profiles')
        .update(data)
        .eq('id', currentUser.id);

      if (error) throw error;

      // Actualizar metadata del usuario
      await window.supabase.auth.updateUser({
        data: {
          first_name: data.first_name,
          last_name: data.last_name
        }
      });

      // Actualizar perfil local
      Object.assign(currentProfile, data);
      updateProfileUI();

      if (window.SolareToast) {
        window.SolareToast.success('Perfil actualizado correctamente');
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      if (window.SolareToast) {
        window.SolareToast.error('Error al actualizar el perfil');
      }
    }
  }

  // Cambiar avatar
  async function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      if (window.SolareToast) {
        window.SolareToast.error('Por favor selecciona una imagen');
      }
      return;
    }

    // Validar tamaño (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      if (window.SolareToast) {
        window.SolareToast.error('La imagen debe ser menor a 2MB');
      }
      return;
    }

    try {
      // Subir a Supabase Storage (si está configurado)
      // Por ahora, usaremos una URL temporal o base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageUrl = event.target.result;

        // Actualizar perfil con la URL de la imagen
        const { error } = await window.supabase
          .from('profiles')
          .update({
            avatar_url: imageUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentUser.id);

        if (error) throw error;

        currentProfile.avatar_url = imageUrl;
        const avatarEl = el('#perfil-avatar');
        if (avatarEl) {
          avatarEl.src = imageUrl;
        }

        if (window.SolareToast) {
          window.SolareToast.success('Avatar actualizado correctamente');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error cambiando avatar:', error);
      if (window.SolareToast) {
        window.SolareToast.error('Error al actualizar el avatar');
      }
    }
  }

  // Cargar direcciones
  async function loadAddresses() {
    try {
      const { data: addresses, error } = await window.supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      renderAddresses(addresses || []);
    } catch (error) {
      console.error('Error cargando direcciones:', error);
      renderAddresses([]);
    }
  }

  // Renderizar direcciones
  function renderAddresses(addresses) {
    const container = el('#addresses-list');
    if (!container) return;

    if (addresses.length === 0) {
      container.innerHTML = '<p style="color: var(--perfil-muted); grid-column: 1 / -1;">No tienes direcciones guardadas.</p>';
      return;
    }

    container.innerHTML = addresses.map(addr => `
      <div class="perfil-address-card ${addr.is_default ? 'perfil-address-card-default' : ''}">
        <div class="perfil-address-header">
          <div>
            <span class="perfil-address-type">${addr.type === 'shipping' ? 'Envío' : 'Facturación'}</span>
            ${addr.is_default ? '<span class="perfil-address-default-badge">Predeterminada</span>' : ''}
          </div>
          <div class="perfil-address-actions">
            <button class="perfil-address-btn" onclick="window.perfilEditAddress('${addr.id}')" title="Editar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="perfil-address-btn" onclick="window.perfilDeleteAddress('${addr.id}')" title="Eliminar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="perfil-address-body">
          <div class="perfil-address-name">${addr.first_name} ${addr.last_name}</div>
          <div class="perfil-address-text">
            ${addr.company ? `${addr.company}<br>` : ''}
            ${addr.address_line_1}<br>
            ${addr.address_line_2 ? `${addr.address_line_2}<br>` : ''}
            ${addr.city}, ${addr.state} ${addr.postal_code}<br>
            ${addr.country}<br>
            ${addr.phone ? `Tel: ${addr.phone}` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  // Abrir modal de dirección
  function openAddressModal(address = null) {
    const modal = el('#address-modal');
    const form = el('#form-address');
    const title = el('#address-modal-title');

    if (!modal || !form) return;

    if (address) {
      editingAddressId = address.id;
      if (title) title.textContent = 'Editar Dirección';

      // Llenar formulario
      el('#address-id').value = address.id;
      el(`input[name="type"][value="${address.type}"]`).checked = true;
      el('#address-is-default').checked = address.is_default || false;
      el('#address-first-name').value = address.first_name || '';
      el('#address-last-name').value = address.last_name || '';
      el('#address-company').value = address.company || '';
      el('#address-phone').value = address.phone || '';
      el('#address-line-1').value = address.address_line_1 || '';
      el('#address-line-2').value = address.address_line_2 || '';
      el('#address-city').value = address.city || '';
      el('#address-state').value = address.state || '';
      el('#address-postal-code').value = address.postal_code || '';
      el('#address-country').value = address.country || 'México';
    } else {
      editingAddressId = null;
      if (title) title.textContent = 'Agregar Dirección';
      form.reset();
      el('#address-country').value = 'México';
    }

    modal.hidden = false;
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';

    // Enfocar el primer campo del formulario
    const firstInput = form.querySelector('input:not([type="hidden"]), select');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }

  // Cerrar modal de dirección
  function closeAddressModal() {
    const modal = el('#address-modal');
    const form = el('#form-address');

    if (modal) {
      modal.hidden = true;
      modal.setAttribute('hidden', '');
      document.body.style.overflow = '';
    }

    // Resetear formulario
    if (form) {
      form.reset();
      el('#address-country').value = 'México';
    }

    editingAddressId = null;
  }

  // Guardar dirección
  async function handleSaveAddress(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
      user_id: currentUser.id,
      type: formData.get('type'),
      is_default: formData.get('is_default') === 'on',
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      company: formData.get('company') || null,
      phone: formData.get('phone') || null,
      address_line_1: formData.get('address_line_1'),
      address_line_2: formData.get('address_line_2') || null,
      city: formData.get('city'),
      state: formData.get('state'),
      postal_code: formData.get('postal_code'),
      country: formData.get('country'),
      updated_at: new Date().toISOString()
    };

    try {
      // Si es predeterminada, quitar predeterminada de otras direcciones del mismo tipo
      if (data.is_default) {
        await window.supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', currentUser.id)
          .eq('type', data.type);
      }

      if (editingAddressId) {
        // Actualizar
        const { error } = await window.supabase
          .from('user_addresses')
          .update(data)
          .eq('id', editingAddressId);

        if (error) throw error;
      } else {
        // Crear
        const { error } = await window.supabase
          .from('user_addresses')
          .insert([data]);

        if (error) throw error;
      }

      closeAddressModal();
      await loadAddresses();

      if (window.SolareToast) {
        window.SolareToast.success(editingAddressId ? 'Dirección actualizada' : 'Dirección agregada');
      }
    } catch (error) {
      console.error('Error guardando dirección:', error);
      if (window.SolareToast) {
        window.SolareToast.error('Error al guardar la dirección');
      }
    }
  }

  // Editar dirección (función global)
  window.perfilEditAddress = async function (addressId) {
    try {
      const { data: address, error } = await window.supabase
        .from('user_addresses')
        .select('*')
        .eq('id', addressId)
        .single();

      if (error) throw error;
      openAddressModal(address);
    } catch (error) {
      console.error('Error cargando dirección:', error);
      if (window.SolareToast) {
        window.SolareToast.error('Error al cargar la dirección');
      }
    }
  };

  // Eliminar dirección (función global)
  window.perfilDeleteAddress = async function (addressId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta dirección?')) {
      return;
    }

    try {
      const { error } = await window.supabase
        .from('user_addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;

      await loadAddresses();

      if (window.SolareToast) {
        window.SolareToast.success('Dirección eliminada');
      }
    } catch (error) {
      console.error('Error eliminando dirección:', error);
      if (window.SolareToast) {
        window.SolareToast.error('Error al eliminar la dirección');
      }
    }
  };

  // Cargar pedidos
  async function loadOrders() {
    try {
      const { data: orders, error } = await window.supabase
        .from('orders')
        .select(`
          *,
          order_statuses(name)
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      renderOrders(orders || []);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      renderOrders([]);
    }
  }

  // Renderizar pedidos
  function renderOrders(orders) {
    const container = el('#orders-list');
    const empty = el('#orders-empty');

    if (!container) return;

    if (orders.length === 0) {
      container.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }

    if (empty) empty.hidden = true;

    container.innerHTML = orders.map(order => {
      const status = order.order_statuses?.name || 'pending';
      const statusClass = `perfil-order-status-${status.toLowerCase()}`;
      const statusText = {
        'pending': 'Pendiente',
        'processing': 'En Proceso',
        'shipped': 'Enviado',
        'delivered': 'Entregado',
        'cancelled': 'Cancelado'
      }[status] || status;

      const date = new Date(order.created_at).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      return `
        <div class="perfil-order-card">
          <div class="perfil-order-header">
            <div class="perfil-order-info">
              <div class="perfil-order-number">Pedido #${order.order_number}</div>
              <div class="perfil-order-date">${date}</div>
            </div>
            <span class="perfil-order-status ${statusClass}">${statusText}</span>
          </div>
          <div class="perfil-order-footer">
            <div class="perfil-order-total">Total: $${Number(order.total_amount).toFixed(2)}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Cargar notificaciones
  function loadNotifications() {
    const emailNotif = el('#email-notifications');
    const smsNotif = el('#sms-notifications');

    if (emailNotif) {
      emailNotif.checked = currentProfile.email_notifications !== false;
    }
    if (smsNotif) {
      smsNotif.checked = currentProfile.sms_notifications === true;
    }
  }

  // Actualizar notificaciones
  async function handleUpdateNotifications(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
      email_notifications: formData.get('email_notifications') === 'on',
      sms_notifications: formData.get('sms_notifications') === 'on',
      updated_at: new Date().toISOString()
    };

    try {
      const { error } = await window.supabase
        .from('profiles')
        .update(data)
        .eq('id', currentUser.id);

      if (error) throw error;

      currentProfile.email_notifications = data.email_notifications;
      currentProfile.sms_notifications = data.sms_notifications;

      if (window.SolareToast) {
        window.SolareToast.success('Preferencias actualizadas');
      }
    } catch (error) {
      console.error('Error actualizando notificaciones:', error);
      if (window.SolareToast) {
        window.SolareToast.error('Error al actualizar las preferencias');
      }
    }
  }

  // Cambiar contraseña
  async function handleChangePassword(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const currentPassword = formData.get('current_password');
    const newPassword = formData.get('new_password');
    const confirmPassword = formData.get('confirm_password');

    // Validar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      if (window.SolareToast) {
        window.SolareToast.error('Las contraseñas no coinciden');
      }
      return;
    }

    // Validar longitud
    if (newPassword.length < 8) {
      if (window.SolareToast) {
        window.SolareToast.error('La contraseña debe tener al menos 8 caracteres');
      }
      return;
    }

    try {
      // Actualizar contraseña
      const { error } = await window.supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      e.target.reset();

      if (window.SolareToast) {
        window.SolareToast.success('Contraseña actualizada correctamente');
      }
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      if (window.SolareToast) {
        window.SolareToast.error(error.message || 'Error al cambiar la contraseña');
      }
    }
  }

  // Cerrar sesión
  async function handleLogout() {
    if (!confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      return;
    }

    try {
      const { error } = await window.supabase.auth.signOut();
      if (error) throw error;

      window.location.href = 'login.html';
    } catch (error) {
      console.error('Error cerrando sesión:', error);
      if (window.SolareToast) {
        window.SolareToast.error('Error al cerrar sesión');
      }
    }
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
