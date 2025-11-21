// Admin Panel - Solare
// Gestión completa del panel de administración

(function() {
  'use strict';

  // Utilidades - Definir primero para que estén disponibles en todas las funciones
  const el = (selector) => document.querySelector(selector);
  const els = (selector) => document.querySelectorAll(selector);
  const formatCurrency = (value) => {
    try {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0,
      }).format(value);
    } catch (e) {
      return `$${value}`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-AR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  const showToast = (message, type = 'info') => {
    if (window.SolareToast) {
      if (type === 'success') window.SolareToast.success(message);
      else if (type === 'error') window.SolareToast.error(message);
      else window.SolareToast.info(message);
    } else {
      alert(message);
    }
  };

  // Variables de estado
  let currentUser = null;
  let currentSection = 'dashboard';
  let editingProductId = null;
  let editingCategoryId = null;
  let editingCollectionId = null;
  let editingFaqId = null;
  let editingUserId = null;
  let editingOrderStatusId = null;

  // Verificación de autenticación y permisos
  async function checkAdminAccess() {
    const statusEl = el('#admin-status');
    const emailEl = el('#admin-user-email');
    const roleEl = el('#admin-user-role');

    if (!window.supabase) {
      if (statusEl) statusEl.textContent = 'Error: Cliente de Supabase no disponible';
      return false;
    }

    try {
      const { data: { session }, error } = await window.supabase.auth.getSession();
      
      if (error || !session) {
        if (statusEl) statusEl.textContent = 'No hay sesión activa';
        // No redirigir automáticamente, permitir que el usuario vea la interfaz
        return false;
      }

      currentUser = session.user;
      
      // Mostrar email del usuario
      if (emailEl) emailEl.textContent = currentUser.email || 'Sin email';
      
      // Intentar obtener perfil del usuario (puede no tener columna role)
      let role = null;
      try {
        const { data: profile, error: profileError } = await window.supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (!profileError && profile) {
          // Intentar obtener role de diferentes lugares
          role = profile.role || profile.rol || null;
        }
      } catch (profileErr) {
        console.log('No se pudo obtener perfil, usando metadata:', profileErr);
      }

      // Verificar role en user_metadata o app_metadata
      if (!role) {
        role = currentUser.user_metadata?.role || 
               currentUser.user_metadata?.rol ||
               currentUser.app_metadata?.role ||
               currentUser.app_metadata?.rol ||
               null;
      }

      // Si no hay role definido, permitir acceso temporalmente (para desarrollo)
      // En producción, deberías tener una forma de asignar roles
      if (!role) {
        console.warn('Usuario sin role definido. Permitiendo acceso temporal.');
        if (statusEl) statusEl.textContent = 'Acceso temporal (sin role definido)';
        if (roleEl) roleEl.textContent = 'Usuario';
        // Permitir acceso pero mostrar advertencia
        return true;
      }
      
      if (role !== 'admin' && role !== 'administrador') {
        if (statusEl) statusEl.textContent = 'No tienes permisos de administrador';
        if (roleEl) roleEl.textContent = `Rol: ${role}`;
        // No redirigir automáticamente, solo mostrar mensaje
        return false;
      }

      if (roleEl) roleEl.textContent = 'Administrador';
      if (statusEl) statusEl.textContent = 'Acceso concedido';

      return true;
    } catch (error) {
      console.error('Error verificando acceso:', error);
      if (statusEl) statusEl.textContent = 'Error al verificar acceso: ' + error.message;
      // No redirigir en caso de error, permitir que el usuario vea la interfaz
      return false;
    }
  }

  // Navegación entre secciones
  function initNavigation() {
    try {
      const navButtons = els('.admin-nav-btn');
      const sections = els('[data-admin-section]');

      if (navButtons.length === 0 || sections.length === 0) {
        console.warn('No se encontraron elementos de navegación');
        return;
      }

      function showSection(sectionName) {
        currentSection = sectionName;
        
        sections.forEach((section) => {
          const name = section.getAttribute('data-admin-section');
          if (name === sectionName) {
            section.classList.add('admin-section-active');
            section.style.display = 'block';
          } else {
            section.classList.remove('admin-section-active');
            section.style.display = 'none';
          }
        });

        navButtons.forEach((btn) => {
          const name = btn.getAttribute('data-section');
          if (name === sectionName) {
            btn.classList.add('admin-nav-btn-active');
          } else {
            btn.classList.remove('admin-nav-btn-active');
          }
        });

        // Cargar datos de la sección
        loadSectionData(sectionName).catch(err => {
          console.error('Error cargando datos de sección:', err);
        });
      }

      navButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const sectionName = btn.getAttribute('data-section');
          if (sectionName) {
            showSection(sectionName);
          }
        });
      });

      // Mostrar dashboard por defecto
      showSection('dashboard');
    } catch (error) {
      console.error('Error inicializando navegación:', error);
      showToast('Error al inicializar la navegación', 'error');
    }
  }

  // Cargar datos según la sección
  async function loadSectionData(sectionName) {
    switch (sectionName) {
      case 'dashboard':
        await loadDashboard();
        break;
      case 'products':
        await loadProducts();
        break;
      case 'orders':
        await loadOrders();
        break;
      case 'users':
        await loadUsers();
        break;
      case 'categories':
        await loadCategories();
        break;
      case 'collections':
        await loadCollections();
        break;
      case 'faq':
        await loadFAQs();
        break;
      case 'messages':
        await loadMessages();
        break;
      case 'settings':
        await loadSettings();
        break;
    }
  }

  // ===== DASHBOARD =====
  async function loadDashboard() {
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
        .select('total');

      const salesTotal = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

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
        .select('id, order_number, total, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      if (!orders || orders.length === 0) {
        container.innerHTML = '<p class="admin-empty-state">No hay pedidos recientes</p>';
        return;
      }

      container.innerHTML = orders.map(order => `
        <div class="admin-stat-item">
          <div>
            <div class="admin-stat-item-title">Pedido ${order.order_number || order.id}</div>
            <div class="admin-stat-item-meta">${formatDate(order.created_at)} • ${formatCurrency(order.total)}</div>
          </div>
          <span class="admin-badge admin-badge-${order.status || 'pending'}">${order.status || 'Pendiente'}</span>
        </div>
      `).join('');
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

  // Botón de actualizar dashboard
  const refreshDashboardBtn = el('#btn-refresh-dashboard');
  if (refreshDashboardBtn) {
    refreshDashboardBtn.addEventListener('click', () => {
      loadDashboard();
      showToast('Dashboard actualizado', 'success');
    });
  }

  // ===== PRODUCTOS =====
  async function loadProducts() {
    const tbody = el('#products-table-body');
    const countEl = el('#products-count');
    if (!tbody) return;

    try {
      tbody.innerHTML = '<tr><td colspan="7" class="admin-table-empty"><p>Cargando productos...</p></td></tr>';

      const { data: products, error } = await window.supabase
        .from('products')
        .select(`
          *,
          categories(name),
          brands(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="admin-table-empty"><p>No hay productos</p></td></tr>';
        if (countEl) countEl.textContent = '0 productos';
        return;
      }

      tbody.innerHTML = products.map(product => {
        const imageUrl = product.images && product.images[0] ? product.images[0] : '';
        const categoryName = product.categories?.name || 'Sin categoría';
        const statusClass = product.is_active ? 'admin-badge-active' : 'admin-badge-inactive';
        const statusText = product.is_active ? 'Activo' : 'Inactivo';

        return `
          <tr>
            <td>
              ${imageUrl ? `<img src="${imageUrl}" alt="${product.name}" class="admin-table-image" />` : '<span class="admin-table-empty">Sin imagen</span>'}
            </td>
            <td>
              <strong>${product.name || 'Sin nombre'}</strong>
              ${product.sku ? `<br><small style="color: var(--admin-muted);">SKU: ${product.sku}</small>` : ''}
            </td>
            <td>${categoryName}</td>
            <td>${formatCurrency(product.price || 0)}</td>
            <td>${product.inventory_quantity || 0}</td>
            <td><span class="admin-badge ${statusClass}">${statusText}</span></td>
            <td class="admin-th-actions">
              <div class="admin-table-actions">
                <button class="admin-action-btn admin-action-btn-edit" onclick="admin.editProduct('${product.id}')" title="Editar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button class="admin-action-btn admin-action-btn-delete" onclick="admin.deleteProduct('${product.id}')" title="Eliminar">
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

      if (countEl) countEl.textContent = `${products.length} producto${products.length !== 1 ? 's' : ''}`;

      // Cargar categorías para el filtro
      await loadCategoriesForFilter();
    } catch (error) {
      console.error('Error cargando productos:', error);
      tbody.innerHTML = '<tr><td colspan="7" class="admin-table-empty"><p>Error al cargar productos</p></td></tr>';
      showToast('Error al cargar productos', 'error');
    }
  }

  async function loadCategoriesForFilter() {
    const select = el('#products-filter-category');
    if (!select) return;

    try {
      const { data: categories, error } = await window.supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      const currentValue = select.value;
      select.innerHTML = '<option value="">Todas las categorías</option>' +
        (categories || []).map(cat => 
          `<option value="${cat.id}" ${currentValue === cat.id ? 'selected' : ''}>${cat.name}</option>`
        ).join('');
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  }

  // Búsqueda y filtros de productos
  const productsSearch = el('#products-search');
  const productsFilterCategory = el('#products-filter-category');
  const productsFilterStatus = el('#products-filter-status');

  if (productsSearch) {
    let searchTimeout;
    productsSearch.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        filterProducts();
      }, 300);
    });
  }

  if (productsFilterCategory) {
    productsFilterCategory.addEventListener('change', filterProducts);
  }

  if (productsFilterStatus) {
    productsFilterStatus.addEventListener('change', filterProducts);
  }

  async function filterProducts() {
    // Implementación de filtrado (simplificada - se puede mejorar)
    await loadProducts();
  }

  // Modal de producto
  const productModal = el('#product-modal');
  const productForm = el('#product-form');
  const btnAddProduct = el('#btn-add-product');
  const btnCloseProductModal = el('#btn-close-product-modal');
  const btnCancelProduct = el('#btn-cancel-product');

  if (btnAddProduct) {
    btnAddProduct.addEventListener('click', () => {
      editingProductId = null;
      openProductModal();
    });
  }

  if (btnCloseProductModal) {
    btnCloseProductModal.addEventListener('click', closeProductModal);
  }

  if (btnCancelProduct) {
    btnCancelProduct.addEventListener('click', closeProductModal);
  }

  // Cerrar modal al hacer clic fuera
  if (productModal) {
    productModal.addEventListener('click', (e) => {
      if (e.target === productModal) {
        closeProductModal();
      }
    });
  }

  // Tabs del formulario de producto
  const productFormTabs = els('.admin-form-tab[data-tab]');
  productFormTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      switchProductTab(tabName);
    });
  });

  function switchProductTab(tabName) {
    // Desactivar todos los tabs
    productFormTabs.forEach(tab => {
      tab.classList.remove('active');
      const name = tab.getAttribute('data-tab');
      const content = el(`[data-tab-content="${name}"]`);
      if (content) content.classList.remove('active');
    });

    // Activar el tab seleccionado
    const activeTab = el(`.admin-form-tab[data-tab="${tabName}"]`);
    const activeContent = el(`[data-tab-content="${tabName}"]`);
    if (activeTab) activeTab.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
  }

  async function openProductModal(productId = null) {
    editingProductId = productId;
    const title = el('#product-modal-title');
    if (title) {
      title.textContent = productId ? 'Editar Producto' : 'Nuevo Producto';
    }

    // Cargar categorías y marcas
    await loadProductFormData();

    if (productId) {
      await loadProductData(productId);
    } else {
      if (productForm) productForm.reset();
      // Establecer valores por defecto
      const isActiveCheckbox = el('#product-is-active');
      if (isActiveCheckbox) isActiveCheckbox.checked = true;
    }

    if (productModal) {
      productModal.hidden = false;
      productModal.removeAttribute('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  async function loadProductFormData() {
    // Cargar categorías
    const categorySelect = el('#product-category');
    if (categorySelect) {
      try {
        const { data: categories } = await window.supabase
          .from('categories')
          .select('id, name')
          .eq('is_active', true)
          .order('name');

        categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>' +
          (categories || []).map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
      } catch (error) {
        console.error('Error cargando categorías:', error);
      }
    }

    // Cargar marcas
    const brandSelect = el('#product-brand');
    if (brandSelect) {
      try {
        const { data: brands } = await window.supabase
          .from('brands')
          .select('id, name')
          .eq('is_active', true)
          .order('name');

        brandSelect.innerHTML = '<option value="">Sin marca</option>' +
          (brands || []).map(brand => `<option value="${brand.id}">${brand.name}</option>`).join('');
      } catch (error) {
        console.error('Error cargando marcas:', error);
      }
    }
  }

  async function loadProductData(productId) {
    try {
      const { data: product, error } = await window.supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;

      // Llenar formulario
      if (el('#product-name')) el('#product-name').value = product.name || '';
      if (el('#product-slug')) el('#product-slug').value = product.slug || '';
      if (el('#product-sku')) el('#product-sku').value = product.sku || '';
      if (el('#product-short-description')) el('#product-short-description').value = product.short_description || '';
      if (el('#product-description')) el('#product-description').value = product.description || '';
      if (el('#product-category')) el('#product-category').value = product.category_id || '';
      if (el('#product-brand')) el('#product-brand').value = product.brand_id || '';
      if (el('#product-price')) el('#product-price').value = product.price || '';
      if (el('#product-compare-price')) el('#product-compare-price').value = product.compare_price || '';
      if (el('#product-cost-price')) el('#product-cost-price').value = product.cost_price || '';
      if (el('#product-inventory')) el('#product-inventory').value = product.inventory_quantity || 0;
      if (el('#product-low-stock')) el('#product-low-stock').value = product.low_stock_threshold || 5;
      if (el('#product-weight')) el('#product-weight').value = product.weight || '';
      if (el('#product-tags')) el('#product-tags').value = product.tags ? product.tags.join(', ') : '';
      if (el('#product-meta-title')) el('#product-meta-title').value = product.meta_title || '';
      if (el('#product-meta-description')) el('#product-meta-description').value = product.meta_description || '';
      if (el('#product-is-active')) el('#product-is-active').checked = product.is_active !== false;
      if (el('#product-is-featured')) el('#product-is-featured').checked = product.is_featured === true;
      if (el('#product-track-inventory')) el('#product-track-inventory').checked = product.track_inventory !== false;
      if (el('#product-requires-shipping')) el('#product-requires-shipping').checked = product.requires_shipping !== false;
      if (el('#product-taxable')) el('#product-taxable').checked = product.taxable !== false;

      // Cargar imágenes
      if (product.images && product.images.length > 0) {
        displayProductImages(product.images);
      }
    } catch (error) {
      console.error('Error cargando producto:', error);
      showToast('Error al cargar el producto', 'error');
    }
  }

  function closeProductModal() {
    if (productModal) {
      productModal.hidden = true;
      productModal.setAttribute('hidden', '');
      document.body.style.overflow = '';
    }
    editingProductId = null;
    if (productForm) productForm.reset();
  }

  // Manejo de imágenes de producto
  const productImagesInput = el('#product-images-input');
  const productImagesPreview = el('#product-images-preview');
  const productUploadArea = el('.admin-upload-area');

  if (productImagesInput) {
    productImagesInput.addEventListener('change', handleProductImages);
  }

  if (productUploadArea) {
    productUploadArea.addEventListener('click', () => {
      if (productImagesInput) productImagesInput.click();
    });
  }

  function handleProductImages(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        showToast('Solo se permiten archivos de imagen', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target.result;
        addProductImagePreview(imageUrl);
      };
      reader.readAsDataURL(file);
    });
  }

  function addProductImagePreview(imageUrl) {
    if (!productImagesPreview) return;

    const item = document.createElement('div');
    item.className = 'admin-image-preview-item';
    item.innerHTML = `
      <img src="${imageUrl}" alt="Preview" />
      <button type="button" class="admin-action-btn admin-image-remove" onclick="this.parentElement.remove()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    productImagesPreview.appendChild(item);
  }

  function displayProductImages(images) {
    if (!productImagesPreview) return;
    productImagesPreview.innerHTML = '';
    images.forEach(imageUrl => {
      addProductImagePreview(imageUrl);
    });
  }

  // Guardar producto
  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        const formData = new FormData(productForm);
        const data = {
          name: formData.get('name') || '',
          slug: formData.get('slug') || generateSlug(formData.get('name')),
          sku: formData.get('sku') || null,
          short_description: formData.get('short_description') || null,
          description: formData.get('description') || null,
          category_id: formData.get('category_id') || null,
          brand_id: formData.get('brand_id') || null,
          price: parseFloat(formData.get('price')) || 0,
          compare_price: formData.get('compare_price') ? parseFloat(formData.get('compare_price')) : null,
          cost_price: formData.get('cost_price') ? parseFloat(formData.get('cost_price')) : null,
          inventory_quantity: parseInt(formData.get('inventory_quantity')) || 0,
          low_stock_threshold: parseInt(formData.get('low_stock_threshold')) || 5,
          weight: formData.get('weight') ? parseFloat(formData.get('weight')) : null,
          tags: formData.get('tags') ? formData.get('tags').split(',').map(t => t.trim()).filter(t => t) : [],
          meta_title: formData.get('meta_title') || null,
          meta_description: formData.get('meta_description') || null,
          is_active: formData.get('is_active') === 'on',
          is_featured: formData.get('is_featured') === 'on',
          track_inventory: formData.get('track_inventory') === 'on',
          requires_shipping: formData.get('requires_shipping') === 'on',
          taxable: formData.get('taxable') === 'on',
        };

        // Obtener imágenes del preview
        const imagePreviews = els('#product-images-preview img');
        data.images = Array.from(imagePreviews).map(img => img.src);

        let result;
        if (editingProductId) {
          const { error } = await window.supabase
            .from('products')
            .update(data)
            .eq('id', editingProductId);
          
          if (error) throw error;
          showToast('Producto actualizado correctamente', 'success');
        } else {
          const { error } = await window.supabase
            .from('products')
            .insert([data]);
          
          if (error) throw error;
          showToast('Producto creado correctamente', 'success');
        }

        closeProductModal();
        await loadProducts();
        await loadDashboard();
      } catch (error) {
        console.error('Error guardando producto:', error);
        showToast('Error al guardar el producto: ' + (error.message || 'Error desconocido'), 'error');
      }
    });
  }

  function generateSlug(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Auto-generar slug desde el nombre
  const productNameInput = el('#product-name');
  if (productNameInput) {
    productNameInput.addEventListener('blur', () => {
      const slugInput = el('#product-slug');
      if (slugInput && !slugInput.value) {
        slugInput.value = generateSlug(productNameInput.value);
      }
    });
  }

  // ===== PEDIDOS =====
  async function loadOrders() {
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

  // ===== USUARIOS =====
  async function loadUsers() {
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
      const userIds = profiles.map(p => p.id);
      const userRoles = {};
      
      // Intentar obtener roles desde user_metadata (esto requiere permisos de admin)
      for (const profile of profiles) {
        try {
          // Obtener role desde diferentes fuentes
          const role = profile.role || profile.rol || null;
          userRoles[profile.id] = role || 'usuario';
        } catch (err) {
          userRoles[profile.id] = 'usuario';
        }
      }

      tbody.innerHTML = profiles.map(profile => {
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Sin nombre';
        const statusClass = profile.is_active !== false ? 'admin-badge-active' : 'admin-badge-inactive';
        const statusText = profile.is_active !== false ? 'Activo' : 'Inactivo';
        const userRole = userRoles[profile.id] || 'usuario';
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
      tbody.innerHTML = '<tr><td colspan="6" class="admin-table-empty"><p>Error al cargar usuarios</p></td></tr>';
      showToast('Error al cargar usuarios', 'error');
    }
  }

  // ===== CATEGORÍAS =====
  async function loadCategories() {
    const container = el('#categories-list');
    const countEl = el('#categories-count');
    if (!container) return;

    try {
      container.innerHTML = '<p class="admin-loading">Cargando categorías...</p>';

      const { data: categories, error } = await window.supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;

      if (!categories || categories.length === 0) {
        container.innerHTML = '<p class="admin-empty-state">No hay categorías</p>';
        if (countEl) countEl.textContent = '0 categorías';
        return;
      }

      container.innerHTML = categories.map(category => {
        const statusClass = category.is_active !== false ? 'admin-badge-active' : 'admin-badge-inactive';
        return `
          <div class="admin-category-item">
            <div class="admin-category-info">
              ${category.image ? `<img src="${category.image}" alt="${category.name}" class="admin-category-image" />` : ''}
              <div class="admin-category-details">
                <h4>${category.name}</h4>
                <p>${category.slug || ''} • <span class="admin-badge ${statusClass}">${category.is_active !== false ? 'Activa' : 'Inactiva'}</span></p>
              </div>
            </div>
            <div class="admin-category-actions">
              <button class="admin-action-btn admin-action-btn-edit" onclick="admin.editCategory('${category.id}')" title="Editar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="admin-action-btn admin-action-btn-delete" onclick="admin.deleteCategory('${category.id}')" title="Eliminar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        `;
      }).join('');

      if (countEl) countEl.textContent = `${categories.length} categoría${categories.length !== 1 ? 's' : ''}`;
    } catch (error) {
      console.error('Error cargando categorías:', error);
      container.innerHTML = '<p class="admin-loading">Error al cargar categorías</p>';
      showToast('Error al cargar categorías', 'error');
    }
  }

  // ===== COLECCIONES =====
  async function loadCollections() {
    const tbody = el('#collections-table-body');
    const countEl = el('#collections-count');
    if (!tbody) return;

    try {
      tbody.innerHTML = '<tr><td colspan="5" class="admin-table-empty"><p>Cargando colecciones...</p></td></tr>';

      const { data: collections, error } = await window.supabase
        .from('collections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!collections || collections.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="admin-table-empty"><p>No hay colecciones</p></td></tr>';
        if (countEl) countEl.textContent = '0 colecciones';
        return;
      }

      // Contar productos por colección (simplificado)
      tbody.innerHTML = collections.map(collection => {
        const statusClass = collection.is_active !== false ? 'admin-badge-active' : 'admin-badge-inactive';
        return `
          <tr>
            <td><strong>${collection.title || 'Sin título'}</strong></td>
            <td>${collection.type || 'manual'}</td>
            <td>—</td>
            <td><span class="admin-badge ${statusClass}">${collection.is_active !== false ? 'Activa' : 'Inactiva'}</span></td>
            <td class="admin-th-actions">
              <div class="admin-table-actions">
                <button class="admin-action-btn admin-action-btn-edit" onclick="admin.editCollection('${collection.id}')" title="Editar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button class="admin-action-btn admin-action-btn-delete" onclick="admin.deleteCollection('${collection.id}')" title="Eliminar">
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

      if (countEl) countEl.textContent = `${collections.length} colección${collections.length !== 1 ? 'es' : ''}`;
    } catch (error) {
      console.error('Error cargando colecciones:', error);
      tbody.innerHTML = '<tr><td colspan="5" class="admin-table-empty"><p>Error al cargar colecciones</p></td></tr>';
      showToast('Error al cargar colecciones', 'error');
    }
  }

  // ===== FAQ =====
  async function loadFAQs() {
    const container = el('#faqs-list');
    const countEl = el('#faqs-count');
    if (!container) return;

    try {
      container.innerHTML = '<p class="admin-loading">Cargando preguntas...</p>';

      const { data: faqs, error } = await window.supabase
        .from('faqs')
        .select(`
          *,
          faq_categories(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!faqs || faqs.length === 0) {
        container.innerHTML = '<p class="admin-empty-state">No hay preguntas frecuentes</p>';
        if (countEl) countEl.textContent = '0 preguntas';
        return;
      }

      container.innerHTML = faqs.map(faq => {
        const categoryName = faq.faq_categories?.name || 'Sin categoría';
        return `
          <div class="admin-list-item">
            <div class="admin-list-item-info">
              <div class="admin-list-item-title">${faq.question || 'Sin pregunta'}</div>
              <div class="admin-list-item-meta">${categoryName}</div>
            </div>
            <div class="admin-table-actions">
              <button class="admin-action-btn admin-action-btn-edit" onclick="admin.editFaq('${faq.id}')" title="Editar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="admin-action-btn admin-action-btn-delete" onclick="admin.deleteFaq('${faq.id}')" title="Eliminar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        `;
      }).join('');

      if (countEl) countEl.textContent = `${faqs.length} pregunta${faqs.length !== 1 ? 's' : ''}`;
    } catch (error) {
      console.error('Error cargando FAQs:', error);
      container.innerHTML = '<p class="admin-loading">Error al cargar preguntas</p>';
      showToast('Error al cargar preguntas frecuentes', 'error');
    }
  }

  // ===== MENSAJES =====
  async function loadMessages() {
    const container = el('#messages-list');
    const countEl = el('#messages-count');
    if (!container) return;

    try {
      container.innerHTML = '<p class="admin-loading">Cargando mensajes...</p>';

      const { data: messages, error } = await window.supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!messages || messages.length === 0) {
        container.innerHTML = '<p class="admin-empty-state">No hay mensajes</p>';
        if (countEl) countEl.textContent = '0 mensajes';
        return;
      }

      container.innerHTML = messages.map(message => {
        const statusClass = getMessageStatusClass(message.status);
        return `
          <div class="admin-message-item" onclick="admin.viewMessage('${message.id}')">
            <div class="admin-message-header">
              <div>
                <div class="admin-message-subject">${message.subject || 'Sin asunto'}</div>
                <div class="admin-message-meta">
                  <span>${message.name || 'Anónimo'}</span>
                  <span>${message.email || ''}</span>
                  <span>${formatDate(message.created_at)}</span>
                </div>
              </div>
              <span class="admin-badge ${statusClass}">${message.status || 'new'}</span>
            </div>
            <div class="admin-message-preview">${message.message || ''}</div>
          </div>
        `;
      }).join('');

      if (countEl) countEl.textContent = `${messages.length} mensaje${messages.length !== 1 ? 's' : ''}`;
    } catch (error) {
      console.error('Error cargando mensajes:', error);
      container.innerHTML = '<p class="admin-loading">Error al cargar mensajes</p>';
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

  // ===== CONFIGURACIÓN =====
  async function loadSettings() {
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

  // ===== FUNCIONES GLOBALES PARA BOTONES =====
  window.admin = {
    editProduct: (id) => {
      openProductModal(id);
    },
    
    deleteProduct: async (id) => {
      if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;
      
      try {
        const { error } = await window.supabase
          .from('products')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        showToast('Producto eliminado correctamente', 'success');
        await loadProducts();
        await loadDashboard();
      } catch (error) {
        console.error('Error eliminando producto:', error);
        showToast('Error al eliminar el producto', 'error');
      }
    },

    viewOrder: async (id) => {
      // Implementar vista de detalle de pedido
      showToast('Funcionalidad en desarrollo', 'info');
    },

    editUser: async (id) => {
      await openUserModal(id);
    },

    editCategory: async (id) => {
      // Implementar edición de categoría
      showToast('Funcionalidad en desarrollo', 'info');
    },

    deleteCategory: async (id) => {
      if (!confirm('¿Estás seguro de que deseas eliminar esta categoría?')) return;
      
      try {
        const { error } = await window.supabase
          .from('categories')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        showToast('Categoría eliminada correctamente', 'success');
        await loadCategories();
      } catch (error) {
        console.error('Error eliminando categoría:', error);
        showToast('Error al eliminar la categoría', 'error');
      }
    },

    editCollection: async (id) => {
      // Implementar edición de colección
      showToast('Funcionalidad en desarrollo', 'info');
    },

    deleteCollection: async (id) => {
      if (!confirm('¿Estás seguro de que deseas eliminar esta colección?')) return;
      
      try {
        const { error } = await window.supabase
          .from('collections')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        showToast('Colección eliminada correctamente', 'success');
        await loadCollections();
      } catch (error) {
        console.error('Error eliminando colección:', error);
        showToast('Error al eliminar la colección', 'error');
      }
    },

    editFaq: async (id) => {
      // Implementar edición de FAQ
      showToast('Funcionalidad en desarrollo', 'info');
    },

    deleteFaq: async (id) => {
      if (!confirm('¿Estás seguro de que deseas eliminar esta pregunta?')) return;
      
      try {
        const { error } = await window.supabase
          .from('faqs')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        showToast('Pregunta eliminada correctamente', 'success');
        await loadFAQs();
      } catch (error) {
        console.error('Error eliminando pregunta:', error);
        showToast('Error al eliminar la pregunta', 'error');
      }
    },

    viewMessage: async (id) => {
      // Implementar vista de mensaje
      showToast('Funcionalidad en desarrollo', 'info');
    },
  };

  // ===== GESTIÓN DE USUARIOS =====
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

  async function openUserModal(userId) {
    editingUserId = userId;
    const title = el('#user-modal-title');
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

      // Obtener role desde diferentes fuentes
      let userRole = profile.role || profile.rol || 'usuario';
      
      // Intentar obtener desde auth metadata
      try {
        const { data: { user }, error: authError } = await window.supabase.auth.admin.getUserById(userId);
        if (!authError && user) {
          userRole = user.user_metadata?.role || 
                     user.user_metadata?.rol ||
                     user.app_metadata?.role ||
                     user.app_metadata?.rol ||
                     userRole;
        }
      } catch (err) {
        console.log('No se pudo obtener metadata de auth, usando role del perfil');
      }

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
    if (userModal) {
      userModal.hidden = true;
      userModal.setAttribute('hidden', '');
      document.body.style.overflow = '';
    }
    editingUserId = null;
    if (userForm) userForm.reset();
  }

  // Guardar usuario
  if (userForm) {
    userForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        const formData = new FormData(userForm);
        const userId = formData.get('id');
        const role = formData.get('role');
        
        const profileData = {
          first_name: formData.get('first_name') || null,
          last_name: formData.get('last_name') || null,
          phone: formData.get('phone') || null,
          is_active: formData.get('is_active') === 'on',
        };

        // Actualizar role en profile si la columna existe
        // Intentar actualizar role en la tabla profiles
        try {
          const { error: profileError } = await window.supabase
            .from('profiles')
            .update({
              ...profileData,
              role: role, // Intentar actualizar role
            })
            .eq('id', userId);

          if (profileError && !profileError.message.includes('column "role"')) {
            // Si el error no es por columna inexistente, lanzarlo
            throw profileError;
          }
        } catch (profileErr) {
          // Si no existe la columna role, actualizar sin ella
          const { error: profileError } = await window.supabase
            .from('profiles')
            .update(profileData)
            .eq('id', userId);

          if (profileError) throw profileError;
        }

        // Actualizar role en user_metadata de Supabase Auth
        // Nota: Esto requiere permisos de administrador en Supabase
        try {
          // Usar la función admin de Supabase si está disponible
          if (window.supabase.auth.admin) {
            const { error: authError } = await window.supabase.auth.admin.updateUserById(
              userId,
              {
                user_metadata: { role: role },
                app_metadata: { role: role }
              }
            );

            if (authError) {
              console.warn('No se pudo actualizar role en auth metadata:', authError);
              // Continuar de todas formas, el role se guardó en profiles
            }
          } else {
            // Si no hay acceso admin, intentar actualizar metadata del usuario actual
            if (currentUser && currentUser.id === userId) {
              const { error: updateError } = await window.supabase.auth.updateUser({
                data: { role: role }
              });
              
              if (updateError) {
                console.warn('No se pudo actualizar role en metadata:', updateError);
              }
            }
          }
        } catch (authErr) {
          console.warn('Error actualizando role en auth:', authErr);
          // Continuar de todas formas
        }

        showToast('Usuario actualizado correctamente', 'success');
        closeUserModal();
        await loadUsers();
      } catch (error) {
        console.error('Error guardando usuario:', error);
        showToast('Error al guardar el usuario: ' + (error.message || 'Error desconocido'), 'error');
      }
    });
  }

  // ===== BOTONES DE ACCIÓN GENERALES =====
  const btnGoHome = el('#btn-go-home');
  const btnLogout = el('#btn-logout');

  if (btnGoHome) {
    btnGoHome.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      try {
        await window.supabase.auth.signOut();
        window.location.href = 'login.html';
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showToast('Error al cerrar sesión', 'error');
      }
    });
  }

  // ===== INICIALIZACIÓN =====
  async function init() {
    try {
      // Esperar a que Supabase esté disponible
      let attempts = 0;
      while (!window.supabase && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.supabase) {
        console.error('Supabase no está disponible');
        const statusEl = el('#admin-status');
        if (statusEl) statusEl.textContent = 'Error: Supabase no disponible';
        // Inicializar navegación de todas formas para que el usuario pueda ver la interfaz
        initNavigation();
        return;
      }

      // Inicializar navegación PRIMERO para que el usuario pueda interactuar
      initNavigation();

      // Verificar acceso de administrador (no bloqueante)
      const hasAccess = await checkAdminAccess();

      if (hasAccess) {
        // Cargar dashboard inicial solo si tiene acceso
        await loadDashboard();
      } else {
        // Mostrar mensaje pero permitir navegación
        const statusEl = el('#admin-status');
        if (statusEl && !statusEl.textContent.includes('Error')) {
          statusEl.textContent = 'Verificando permisos...';
        }
      }
    } catch (error) {
      console.error('Error en inicialización:', error);
      const statusEl = el('#admin-status');
      if (statusEl) statusEl.textContent = 'Error al inicializar: ' + error.message;
      // Inicializar navegación de todas formas
      initNavigation();
    }
  }

  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Pequeño delay para asegurar que Supabase esté cargado
    setTimeout(init, 100);
  }

})();
