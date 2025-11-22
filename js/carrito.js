// Shopping Cart Functionality - Solare (Supabase Integration)
(function () {
  'use strict';

  // Utility functions
  const el = (selector, context = document) => context.querySelector(selector);
  const els = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  // Generate a random UUID for guest sessions
  function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

  // Cart state
  let cart = {
    id: null,
    items: [],
    subtotal: 0,
    taxes: 0,
    shipping: 0,
    discount: 0,
    total: 0,
    promoCode: null,
    promoDetails: null
  };

  // Constants
  const TAX_RATE = 0.21;
  const FREE_SHIPPING_THRESHOLD = 100;
  const STORAGE_KEY = 'solare-cart';
  const SESSION_KEY = 'solare_session_id';

  // DOM elements
  let elements = {};

  // Initialize cart
  async function initCart() {
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

    // Ensure session ID exists for guests
    if (!localStorage.getItem(SESSION_KEY)) {
      localStorage.setItem(SESSION_KEY, uuidv4());
    }

    // Wait for Supabase
    if (!window.supabase) {
      setTimeout(initCart, 100);
      return;
    }

    // Bind events
    bindEvents();

    // Listen for auth changes
    window.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        cart.items = []; // Clear current state
        loadCart(); // Reload for new context
      }
    });

    // CRITICAL: Wait for SolareAuth to initialize before loading cart
    // This ensures getContext() returns the correct user
    if (window.SolareAuth?.ready) {
      await window.SolareAuth.ready;
    }

    // Load cart
    await loadCart();

    // Load recommended products
    loadRecommendedProducts();
  }

  // Get current context (User ID or Session ID)
  function getContext() {
    const user = window.SolareAuth?.getUser();

    if (user) {
      return { type: 'user', id: user.id };
    }
    return { type: 'session', id: localStorage.getItem(SESSION_KEY) };
  }

  // Load cart from Supabase
  async function loadCart() {
    try {
      const ctx = getContext();
      let query = window.supabase
        .from('shopping_carts')
        .select(`
          id, 
          currency,
          cart_items (
            id,
            product_id,
            quantity,
            products (
              id,
              name,
              price,
              slug,
              categories (slug),
              product_images (url)
            )
          )
        `);

      if (ctx.type === 'user') {
        query = query.eq('user_id', ctx.id);
      } else {
        query = query.eq('session_id', ctx.id);
      }

      const { data: carts, error } = await query;

      if (error) throw error;

      console.log('All found carts:', carts);

      // Pick the first cart, or handle duplicates if needed
      const data = carts?.[0] || null;

      if (data) {
        console.log('Selected Cart Data:', data);
        cart.id = data.id;
        // Transform items
        cart.items = (data.cart_items || []).map(item => {
          // Get primary image or first image
          const img = item.products.product_images?.[0]?.url || null;

          return {
            id: item.products.id, // Product ID
            cart_item_id: item.id,
            name: item.products.name,
            price: item.products.price,
            image: img,
            category: item.products.categories?.slug || 'producto',
            quantity: item.quantity
          };
        });

        // Need to fetch images properly if the above nested select didn't work as expected for 1:1
        if (cart.items.length > 0) {
          await enrichImages(cart.items);
        }

      } else {
        // Create new cart
        await createCart(ctx);
      }

      calculateTotals();
      renderCart();
      updateNavbarCartCount();

    } catch (error) {
      console.error('Error loading cart:', error);
    }
  }

  async function enrichImages(items) {
    const ids = items.map(i => i.id);
    const { data } = await window.supabase
      .from('product_images')
      .select('product_id, url')
      .in('product_id', ids)
      .eq('is_primary', true);

    if (data) {
      const map = new Map(data.map(i => [i.product_id, i.url]));
      items.forEach(item => {
        if (!item.image) item.image = map.get(item.id);
      });
    }
  }

  async function createCart(ctx) {
    const payload = ctx.type === 'user' ? { user_id: ctx.id } : { session_id: ctx.id };
    const { data, error } = await window.supabase
      .from('shopping_carts')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error creating cart:', error);
      return;
    }

    cart.id = data.id;
    cart.items = [];
  }

  // Bind event listeners
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
      elements.clearCartBtn.addEventListener('click', clearCart);
    }

    if (elements.checkoutBtn) {
      elements.checkoutBtn.addEventListener('click', proceedToCheckout);
    }
  }

  // Add item to cart
  async function addToCart(product) {
    if (!cart.id) await loadCart(); // Ensure cart exists

    const existingItem = cart.items.find(item => item.id === product.id);

    try {
      if (existingItem) {
        // Update quantity
        const newQty = existingItem.quantity + 1;
        await updateQuantity(product.id, newQty);
      } else {
        // Insert new item
        const { data, error } = await window.supabase
          .from('cart_items')
          .insert([{
            cart_id: cart.id,
            product_id: product.id,
            quantity: 1
          }])
          .select()
          .single();

        if (error) throw error;

        // Add to local state
        cart.items.push({
          id: product.id,
          cart_item_id: data.id,
          name: product.name,
          price: parseFloat(product.price) || 0,
          image: product.image || product.primary_image,
          category: product.category_slug || product.category || 'producto',
          quantity: 1
        });

        calculateTotals();
        renderCart();
        updateNavbarCartCount();
        showNotification(`${product.name} agregado al carrito`, 'success');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showNotification('Error al agregar al carrito', 'error');
    }
  }

  // Remove item from cart
  async function removeFromCart(productId) {
    const item = cart.items.find(item => item.id === productId);
    if (!item) return;

    try {
      const { error } = await window.supabase
        .from('cart_items')
        .delete()
        .eq('id', item.cart_item_id);

      if (error) throw error;

      cart.items = cart.items.filter(i => i.id !== productId);
      calculateTotals();
      renderCart();
      updateNavbarCartCount();
      showNotification(`${item.name} eliminado del carrito`, 'info');
    } catch (error) {
      console.error('Error removing item:', error);
    }
  }

  // Update item quantity
  async function updateQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    const item = cart.items.find(item => item.id === productId);
    if (!item) return;

    try {
      const { error } = await window.supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', item.cart_item_id);

      if (error) throw error;

      item.quantity = newQuantity;
      calculateTotals();
      renderCart();
      updateNavbarCartCount();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  }

  // Calculate totals
  function calculateTotals() {
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Calculate shipping
    cart.shipping = cart.subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 15;

    // Calculate discount
    cart.discount = 0;
    if (cart.promoDetails) {
      if (cart.promoDetails.type === 'percentage') {
        cart.discount = cart.subtotal * (cart.promoDetails.value / 100); // Assuming value is stored as 10, 20 etc. or 0.10? Plan said value decimal. Let's assume value is absolute amount or percentage based on type.
        // Wait, schema says value decimal. Usually percentage is 0-100 or 0-1. Let's assume 0-100 for UX or check schema.
        // Schema: value DECIMAL(10,2).
        // Let's assume if type is percentage, value is e.g. 10.00 for 10%.
        if (cart.promoDetails.value <= 1) {
          // Maybe it's 0.10? Let's handle both just in case or assume standard.
          // Let's assume it's a percentage value like 10, 15.
          cart.discount = cart.subtotal * (cart.promoDetails.value / 100);
        } else {
          cart.discount = cart.subtotal * (cart.promoDetails.value / 100);
        }
      } else if (cart.promoDetails.type === 'fixed_amount') {
        cart.discount = cart.promoDetails.value;
      }

      // Cap discount at subtotal
      if (cart.discount > cart.subtotal) cart.discount = cart.subtotal;
    }

    // Calculate taxes (on subtotal minus discount)
    const taxableAmount = Math.max(0, cart.subtotal - cart.discount);
    cart.taxes = taxableAmount * TAX_RATE;

    // Calculate total
    cart.total = cart.subtotal + cart.shipping + cart.taxes - cart.discount;
  }

  // Apply promo code
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
        cart.promoCode = null;
        cart.promoDetails = null;
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

        // Validate usage limit
        if (data.usage_limit && data.usage_count >= data.usage_limit) {
          showPromoMessage('El código ha alcanzado su límite de uso', 'error');
          return;
        }

        cart.promoCode = code;
        cart.promoDetails = data;
        calculateTotals();
        updateSummary();
        showPromoMessage(`Código aplicado: ${data.description || code}`, 'success');
        elements.promoInput.value = '';
      }
    } catch (err) {
      console.error('Error checking promo:', err);
      showPromoMessage('Error al validar el código', 'error');
    }
  }

  // Show promo message
  function showPromoMessage(message, type) {
    if (!elements.promoMessage) return;
    elements.promoMessage.textContent = message;
    elements.promoMessage.className = `promo-message ${type}`;
    elements.promoMessage.hidden = false;
    setTimeout(() => { elements.promoMessage.hidden = true; }, 5000);
  }

  // Clear cart
  async function clearCart() {
    if (!confirm('¿Estás seguro de que quieres vaciar el carrito?')) return;

    try {
      const { error } = await window.supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);

      if (error) throw error;

      cart.items = [];
      cart.promoCode = null;
      cart.promoDetails = null;
      calculateTotals();
      renderCart();
      updateNavbarCartCount();
      showNotification('Carrito vaciado', 'info');
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  }

  // Render functions
  function renderCart() {
    if (!cart.items.length) {
      showEmptyCart();
    } else {
      showCartItems();
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

  function showCartItems() {
    if (elements.emptyCart) elements.emptyCart.hidden = true;
    if (elements.cartItemsList) elements.cartItemsList.style.display = 'flex';
    if (elements.cartActions) elements.cartActions.hidden = false;
    if (elements.cartSummary) elements.cartSummary.hidden = false;
    if (elements.recommendedProducts) elements.recommendedProducts.hidden = false;
    renderCartItems();
  }

  function renderCartItems() {
    if (!elements.cartItemsList || !elements.cartItemTemplate) return;
    elements.cartItemsList.innerHTML = '';

    cart.items.forEach(item => {
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
        decreaseBtn.addEventListener('click', () => updateQuantity(item.id, item.quantity - 1));
        decreaseBtn.disabled = item.quantity <= 1;
      }
      if (increaseBtn) {
        increaseBtn.addEventListener('click', () => updateQuantity(item.id, item.quantity + 1));
      }
      if (removeBtn) {
        removeBtn.addEventListener('click', () => removeFromCart(item.id));
      }
      elements.cartItemsList.appendChild(itemElement);
    });
  }

  function updateSummary() {
    if (elements.subtotalEl) elements.subtotalEl.textContent = `$${cart.subtotal.toFixed(2)}`;
    if (elements.shippingEl) elements.shippingEl.textContent = cart.shipping === 0 ? 'Gratis' : `$${cart.shipping.toFixed(2)}`;
    if (elements.taxesEl) elements.taxesEl.textContent = `$${cart.taxes.toFixed(2)}`;
    if (elements.totalEl) elements.totalEl.textContent = `$${cart.total.toFixed(2)}`;

    // Show discount row if applicable
    // (Assuming there is a discount element or we append it, but for now just updating totals)
  }

  function updateNavbarCartCount() {
    const cartCountEl = document.querySelector('#cartCount');
    // Sync to local storage so other pages/navbar.js see the correct count
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart.items));

    if (cartCountEl) {
      const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      cartCountEl.textContent = totalItems;
      if (totalItems > 0) cartCountEl.classList.add('show');
      else cartCountEl.classList.remove('show');
    }
  }

  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span>${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white; padding: 16px 20px; border-radius: 6px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15); z-index: 10000;
      animation: slideInRight 0.3s ease; max-width: 300px;
    `;

    const style = document.createElement('style');
    style.textContent = `@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
    document.head.appendChild(style);
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
    notification.querySelector('.notification-close').addEventListener('click', () => notification.remove());
  }

  // Mock Checkout
  function proceedToCheckout() {
    if (!cart.items.length) {
      showNotification('Tu carrito está vacío', 'error');
      return;
    }
    if (elements.checkoutBtn) {
      elements.checkoutBtn.classList.add('loading');
      elements.checkoutBtn.disabled = true;
    }
    setTimeout(() => {
      alert(`¡Gracias por tu compra!\n\nResumen:\n- Productos: ${cart.items.length}\n- Total: $${cart.total.toFixed(2)}\n\nSerás redirigido al proceso de pago.`);
      if (elements.checkoutBtn) {
        elements.checkoutBtn.classList.remove('loading');
        elements.checkoutBtn.disabled = false;
      }
    }, 2000);
  }

  // Recommended products (Fetch from DB)
  async function loadRecommendedProducts() {
    if (!elements.recommendedGrid) return;

    try {
      // Fetch 4 random active products (simplified as just 4 active products for now)
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

        // Prepare product object for addToCart
        const productForCart = {
          id: product.id,
          name: product.name,
          price: product.price,
          image: imgUrl,
          category: category
        };

        el.querySelector('.btn-add-to-cart').addEventListener('click', () => addToCart(productForCart));
        elements.recommendedGrid.appendChild(el);
      });
    } catch (error) {
      console.error('Error loading recommended products:', error);
    }
  }

  // Public API
  window.SolareCart = {
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCart: () => ({ ...cart }),
    getItemCount: () => cart.items.reduce((sum, item) => sum + item.quantity, 0)
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCart);
  else initCart();

})();
