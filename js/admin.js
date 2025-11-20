document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('admin-status');
  const emailEl = document.getElementById('admin-user-email');
  const roleEl = document.getElementById('admin-user-role');
  const btnHome = document.getElementById('btn-go-home');
  const btnLogout = document.getElementById('btn-logout');
  const navButtons = document.querySelectorAll('.admin-nav-btn');
  const sections = document.querySelectorAll('[data-admin-section]');

  const dashUsersCountEl = document.getElementById('dash-users-count');
  const dashProductsCountEl = document.getElementById('dash-products-count');
  const dashOrdersCountEl = document.getElementById('dash-orders-count');

  const productsTableBody = document.getElementById('products-table-body');
  const productsCountEl = document.getElementById('products-count');
  const productForm = document.getElementById('product-form');
  const productFormMessage = document.getElementById('product-form-message');

  const ordersTableBody = document.getElementById('orders-table-body');
  const ordersCountEl = document.getElementById('orders-count');

  const supabase = window.supabase;

  const setStatus = (text) => {
    if (statusEl) statusEl.textContent = text;
  };

  const setUserInfo = (user) => {
    if (!user) return;
    if (emailEl) emailEl.textContent = user.email || 'Sin email';
    const role =
      user.user_metadata?.role ||
      user.app_metadata?.role ||
      user.user_metadata?.rol ||
      user.app_metadata?.rol ||
      'usuario';
    if (roleEl) roleEl.textContent = `Rol: ${role}`;
  };

  const ensureAdminSession = async () => {
    if (!supabase) {
      setStatus('Error: cliente de autenticación no disponible.');
      return;
    }

    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      setStatus('No hay sesión activa. Redirigiendo al inicio de sesión...');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
      return;
    }

    const user = data.session.user;
    setUserInfo(user);

    const role =
      user.user_metadata?.role ||
      user.app_metadata?.role ||
      user.user_metadata?.rol ||
      user.app_metadata?.rol;
    if (role !== 'admin') {
      setStatus('No tienes permisos para acceder a este panel.');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
      return;
    }

    setStatus('Acceso concedido. Bienvenido al panel de administración.');

    // Inicializar datos demo una vez comprobado el acceso
    initDemoData();
  };

  if (btnHome) {
    btnHome.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      try {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
      } catch (e) {
        console.error('Error al cerrar sesión desde admin:', e);
        alert('No se pudo cerrar sesión. Intenta nuevamente.');
      }
    });
  }

  ensureAdminSession();

  // --- Navegación entre secciones ---
  const showSection = (sectionName) => {
    sections.forEach((section) => {
      const name = section.getAttribute('data-admin-section');
      section.style.display = name === sectionName ? 'block' : 'none';
    });

    navButtons.forEach((btn) => {
      const name = btn.getAttribute('data-section');
      if (name === sectionName) {
        btn.classList.add('admin-nav-btn-active');
        // estilos ya vienen inline; la clase se usa por si necesitas ajustar con CSS más adelante
      } else {
        btn.classList.remove('admin-nav-btn-active');
      }
    });
  };

  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const sectionName = btn.getAttribute('data-section');
      showSection(sectionName);
    });
  });

  // --- Datos demo para Dashboard / Productos / Pedidos ---
  const demoState = {
    usersCount: 24,
    products: [
      { name: 'Blazer estructurado', category: 'mujer', price: 15999 },
      { name: 'Abrigo lana doble faz', category: 'mujer', price: 22999 },
      { name: 'Saco relaxed fit', category: 'hombre', price: 18999 },
    ],
    orders: [
      { id: 'SO-1024', customer: 'M. Romero', status: 'Preparando envío', total: 32998 },
      { id: 'SO-1023', customer: 'L. García', status: 'Pagado', total: 18999 },
      { id: 'SO-1022', customer: 'S. Pérez', status: 'Entregado', total: 45998 },
    ],
  };

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

  const renderDashboard = () => {
    if (dashUsersCountEl) dashUsersCountEl.textContent = String(demoState.usersCount);
    if (dashProductsCountEl) dashProductsCountEl.textContent = String(demoState.products.length);
    if (dashOrdersCountEl) dashOrdersCountEl.textContent = String(demoState.orders.length);
  };

  const renderProducts = () => {
    if (!productsTableBody) return;
    productsTableBody.innerHTML = '';

    demoState.products.forEach((p) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding: 0.6rem 1.1rem; border-bottom: 1px solid #f5f5f5;">
          ${p.name}
        </td>
        <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid #f5f5f5; text-transform: capitalize; color: #555;">
          ${p.category}
        </td>
        <td style="padding: 0.6rem 1.1rem; border-bottom: 1px solid #f5f5f5; text-align: right; font-variant-numeric: tabular-nums;">
          ${formatCurrency(p.price)}
        </td>
      `;
      productsTableBody.appendChild(tr);
    });

    if (productsCountEl) {
      const count = demoState.products.length;
      productsCountEl.textContent = `${count} item${count === 1 ? '' : 's'}`;
    }
  };

  const renderOrders = () => {
    if (!ordersTableBody) return;
    ordersTableBody.innerHTML = '';

    demoState.orders.forEach((o) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding: 0.6rem 1.1rem; border-bottom: 1px solid #f5f5f5; font-variant-numeric: tabular-nums;">
          ${o.id}
        </td>
        <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid #f5f5f5; color: #555;">
          ${o.customer}
        </td>
        <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid #f5f5f5; color: #555;">
          ${o.status}
        </td>
        <td style="padding: 0.6rem 1.1rem; border-bottom: 1px solid #f5f5f5; text-align: right; font-variant-numeric: tabular-nums;">
          ${formatCurrency(o.total)}
        </td>
      `;
      ordersTableBody.appendChild(tr);
    });

    if (ordersCountEl) {
      const count = demoState.orders.length;
      ordersCountEl.textContent = `${count} pedido${count === 1 ? '' : 's'}`;
    }
  };

  const initDemoData = () => {
    renderDashboard();
    renderProducts();
    renderOrders();
  };

  // --- Formulario de nuevo producto (solo en memoria) ---
  if (productForm) {
    productForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(productForm);
      const name = (formData.get('name') || '').toString().trim();
      const category = (formData.get('category') || '').toString();
      const priceValue = Number(formData.get('price') || 0);

      if (!name || !category || !priceValue) {
        if (productFormMessage) {
          productFormMessage.textContent = 'Completa nombre, categoría y precio.';
          productFormMessage.style.color = '#c53030';
          productFormMessage.style.display = 'block';
        }
        return;
      }

      demoState.products.push({ name, category, price: priceValue });
      renderProducts();
      renderDashboard();

      // Reset de campos (excepto categoría para mayor comodidad)
      productForm.reset();

      if (productFormMessage) {
        productFormMessage.textContent = 'Producto agregado a la lista local.';
        productFormMessage.style.color = '#2f855a';
        productFormMessage.style.display = 'block';
        setTimeout(() => {
          productFormMessage.style.display = 'none';
        }, 2500);
      }
    });
  }
});
