// Shopping Cart UI Controller - Migrated to State Manager
(function () {
  'use strict';

  // Utility functions
  const el = (selector, context = document) => context.querySelector(selector);

  // Local state for UI-specific things (promos)
  let promoCode = null;
  let promoDetails = null;
  let discountAmount = 0;

  // DOM elements
  let elements = {};

  // Initialize cart UI
  function initCartUI() {
    // Cache DOM elements
    elements = {
      emptyCart: el('#empty-cart'),
      cartItemsList: el('#cart-items-list'),
      cartActions: el('#cart-actions'),
      cartSummary: el('#cart-summary'),
      recommendedProducts: el('#recommended-products'),
      subtotalEl: el('#subtotal'),
      shippingEl: el('#shipping'),
      taxesEl: el('#taxes'),
      totalEl: el('#total'),
      promoInput: el('#promo-code'),
      applyPromoBtn: el('#apply-promo'),
      promoMessage: el('#promo-message'),
      checkoutBtn: el('#checkout-btn'),
      clearCartBtn: el('#clear-cart'),
      cartItemTemplate: el('#cart-item-template'),
      recommendedGrid: el('#recommended-grid')
    };

    // Wait for State Manager
    if (!window.SolareState) {
      setTimeout(initCartUI, 100);
      return;
    }

    // Bind events
    bindEvents();

    // Initial Render
    renderCart();

    // Listen for state changes
    window.SolareState.on('cart:changed', () => {
      renderCart();
    });

    // Load recommended products
    loadRecommendedProducts();
  }

  function bindEvents() {
    if (elements.applyPromoBtn) {
      elements.applyPromoBtn.addEventListener('click', applyPromoCode);
    }

    if (elements.promoInput) {
      elements.promoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') applyPromoCode();
      });
    }

    if (elements.clearCartBtn) {
      elements.clearCartBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
          window.SolareState.cart.clear().then(() => {
            if (window.SolareToast) window.SolareToast.info('Carrito vaciado');
            promoCode = null;
            promoDetails = null;
            discountAmount = 0;
          });
        }
      });
    }

    if (elements.checkoutBtn) {
      elements.checkoutBtn.addEventListener('click', proceedToCheckout);
    }
  }

  function renderCart() {
    const items = window.SolareState.cart.getItems();

    if (!items.length) {
      showEmptyCart();
    } else {
      showCartItems(items);
      updateSummary();
    }
  }

  function showEmptyCart() {
    if (elements.emptyCart) elements.emptyCart.hidden = false;
    if (elements.cartItemsList) elements.cartItemsList.style.display = 'none';
    if (elements.cartActions) elements.cartActions.hidden = true;
    if (elements.cartSummary) elements.cartSummary.hidden = true;
    if (elements.recommendedProducts) elements.recommendedProducts.hidden = true;
  }

  function showCartItems(items) {
    if (elements.emptyCart) elements.emptyCart.hidden = true;
    if (elements.cartItemsList) elements.cartItemsList.style.display = 'flex';
    if (elements.cartActions) elements.cartActions.hidden = false;
    if (elements.cartSummary) elements.cartSummary.hidden = false;
    if (elements.recommendedProducts) elements.recommendedProducts.hidden = false;

    renderCartItemsList(items);
  }

  function renderCartItemsList(items) {
    if (!elements.cartItemsList || !elements.cartItemTemplate) return;
    elements.cartItemsList.innerHTML = '';

    items.forEach(item => {
      const template = elements.cartItemTemplate.content.cloneNode(true);
      const itemElement = template.querySelector('.cart-item');
      itemElement.dataset.id = item.id;

      const img = template.querySelector('.item-image img');
      const name = template.querySelector('.item-name');
      const category = template.querySelector('.item-category');
      const price = template.querySelector('.item-price');
      const qtyDisplay = template.querySelector('.qty-display');

      if (img) {
        img.src = item.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop';
        img.alt = item.name;
      }
      if (name) name.textContent = item.name;
      if (category) category.textContent = item.category;
      if (price) price.textContent = `$${(item.price * item.quantity).toFixed(2)}`;
      if (qtyDisplay) qtyDisplay.textContent = item.quantity;

      const decreaseBtn = template.querySelector('.qty-decrease');
      const increaseBtn = template.querySelector('.qty-increase');
      const removeBtn = template.querySelector('.remove-item');

      if (decreaseBtn) {
        decreaseBtn.addEventListener('click', () => {
          if (item.quantity > 1) window.SolareState.cart.updateQuantity(item.id, item.quantity - 1);
          else window.SolareState.cart.removeItem(item.id);
        });
        decreaseBtn.disabled = item.quantity <= 1; // Optional: keep enabled to allow remove
      }
      if (increaseBtn) {
        increaseBtn.addEventListener('click', () => window.SolareState.cart.updateQuantity(item.id, item.quantity + 1));
      }
      if (removeBtn) {
        removeBtn.addEventListener('click', () => window.SolareState.cart.removeItem(item.id));
      }
      elements.cartItemsList.appendChild(itemElement);
    });
  }

  function updateSummary() {
    const totals = window.SolareState.cart.getTotals();

    // Recalculate discount if promo exists
    discountAmount = 0;
    if (promoDetails) {
      if (promoDetails.type === 'percentage') {
        discountAmount = totals.subtotal * (promoDetails.value / 100);
      } else if (promoDetails.type === 'fixed_amount') {
        discountAmount = promoDetails.value;
      }
      if (discountAmount > totals.subtotal) discountAmount = totals.subtotal;
    }

    // Adjust total with discount
    const finalTotal = totals.total - discountAmount;

    if (elements.subtotalEl) elements.subtotalEl.textContent = `$${totals.subtotal.toFixed(2)}`;
    if (elements.shippingEl) elements.shippingEl.textContent = totals.shipping === 0 ? 'Gratis' : `$${totals.shipping.toFixed(2)}`;
    if (elements.taxesEl) elements.taxesEl.textContent = `$${totals.tax.toFixed(2)}`;
    if (elements.totalEl) elements.totalEl.textContent = `$${finalTotal.toFixed(2)}`;
  }

  // Promo Code Logic (Local UI only)
  async function applyPromoCode() {
    if (!elements.promoInput || !elements.promoMessage) return;
    const code = elements.promoInput.value.trim().toUpperCase();

    if (!code) {
      showPromoMessage('Ingresa un código promocional', 'error');
      return;
    }

    try {
      const { data, error } = await window.supabase
        .from('discount_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        showPromoMessage('Código inválido o expirado', 'error');
        promoCode = null;
        promoDetails = null;
      } else {
        // Validate dates
        const now = new Date();
        if (data.starts_at && new Date(data.starts_at) > now) {
          showPromoMessage('El código aún no está activo', 'error');
          return;
        }
        if (data.expires_at && new Date(data.expires_at) < now) {
          showPromoMessage('El código ha expirado', 'error');
          return;
        }

        promoCode = code;
        promoDetails = data;
        updateSummary();
        showPromoMessage(`Código aplicado: ${data.description || code}`, 'success');
        elements.promoInput.value = '';
      }
    } catch (err) {
      console.error('Error checking promo:', err);
      showPromoMessage('Error al validar el código', 'error');
    }
  }

  function showPromoMessage(message, type) {
    if (!elements.promoMessage) return;
    elements.promoMessage.textContent = message;
    elements.promoMessage.className = `promo-message ${type}`;
    elements.promoMessage.hidden = false;
    setTimeout(() => { elements.promoMessage.hidden = true; }, 5000);
  }



  function proceedToCheckout() {
    const items = window.SolareState.cart.getItems();
    if (!items.length) {
      if (!items.length) {
        if (window.SolareToast) window.SolareToast.error('Tu carrito está vacío');
        return;
      }
      return;
    }
    if (elements.checkoutBtn) {
      elements.checkoutBtn.classList.add('loading');
      elements.checkoutBtn.disabled = true;
    }

    const totals = window.SolareState.cart.getTotals();
    const finalTotal = totals.total - discountAmount;

    setTimeout(() => {
      alert(`¡Gracias por tu compra!\n\nResumen:\n- Productos: ${items.length}\n- Total: $${finalTotal.toFixed(2)}\n\nSerás redirigido al proceso de pago.`);
      if (elements.checkoutBtn) {
        elements.checkoutBtn.classList.remove('loading');
        elements.checkoutBtn.disabled = false;
      }
    }, 2000);
  }

  async function loadRecommendedProducts() {
    if (!elements.recommendedGrid) return;

    try {
      const { data: products, error } = await window.supabase
        .from('products')
        .select('id, name, price, slug, categories(slug), product_images(url)')
        .eq('is_active', true)
        .limit(4);

      if (error) throw error;

      elements.recommendedGrid.innerHTML = '';
      if (!products || products.length === 0) return;

      products.forEach(product => {
        const imgUrl = product.product_images?.[0]?.url || 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=800&auto=format&fit=crop';
        const category = product.categories?.slug || 'producto';

        const el = document.createElement('div');
        el.className = 'recommended-card';
        el.innerHTML = `
          <div class="recommended-card-image"><img src="${imgUrl}" alt="${product.name}"></div>
          <div class="recommended-card-body">
            <h3 class="recommended-card-title">${product.name}</h3>
            <div class="recommended-card-price">$${product.price.toFixed(2)}</div>
            <button class="btn-add-to-cart">Agregar al Carrito</button>
          </div>
        `;

        const productForCart = {
          id: product.id,
          name: product.name,
          price: product.price,
          category: category
        };

        el.querySelector('.btn-add-to-cart').addEventListener('click', () => {
          window.SolareState.cart.addItem(productForCart).then(() => {
            if (window.SolareToast) window.SolareToast.success(`${product.name} agregado al carrito`);
          });
        });
        elements.recommendedGrid.appendChild(el);
      });
    } catch (error) {
      console.error('Error loading recommended products:', error);
    }
  }

  // Public API for compatibility
  window.SolareCart = {
    addToCart: (p) => window.SolareState.cart.addItem(p).then(() => { if (window.SolareToast) window.SolareToast.success(`${p.name} agregado`); }),
    removeFromCart: (id) => window.SolareState.cart.removeItem(id),
    updateQuantity: (id, q) => window.SolareState.cart.updateQuantity(id, q),
    clearCart: () => window.SolareState.cart.clear(),
    getCart: () => ({ items: window.SolareState.cart.getItems() }),
    getItemCount: () => window.SolareState.cart.getItems().reduce((s, i) => s + i.quantity, 0)
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCartUI);
  else initCartUI();

})();
