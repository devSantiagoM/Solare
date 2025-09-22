// Shopping Cart Functionality - Solare
(function() {
  'use strict';

  // Utility functions
  const el = (selector, context = document) => context.querySelector(selector);
  const els = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  // Cart state
  let cart = {
    items: [],
    subtotal: 0,
    taxes: 0,
    shipping: 0,
    discount: 0,
    total: 0,
    promoCode: null
  };

  // Promo codes
  const promoCodes = {
    'SOLARE10': { discount: 0.10, type: 'percentage', description: '10% de descuento' },
    'WELCOME20': { discount: 0.20, type: 'percentage', description: '20% de descuento' },
    'ENVIOGRATIS': { discount: 15, type: 'fixed', description: 'Envío gratis' },
    'NUEVO15': { discount: 0.15, type: 'percentage', description: '15% de descuento' }
  };

  // Tax rate (21% IVA)
  const TAX_RATE = 0.21;
  const FREE_SHIPPING_THRESHOLD = 100;

  // DOM elements
  let elements = {};

  // Initialize cart
  function initCart() {
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

    // Load cart from localStorage
    loadCartFromStorage();

    // Bind events
    bindEvents();

    // Initial render
    renderCart();
    
    // Load recommended products
    loadRecommendedProducts();

    // Update navbar cart count
    updateNavbarCartCount();
  }

  // Load cart from localStorage
  function loadCartFromStorage() {
    try {
      const savedCart = localStorage.getItem('solare-cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        cart.items = parsedCart.items || [];
        cart.promoCode = parsedCart.promoCode || null;
        calculateTotals();
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
      cart = { items: [], subtotal: 0, taxes: 0, shipping: 0, discount: 0, total: 0, promoCode: null };
    }
  }

  // Save cart to localStorage
  function saveCartToStorage() {
    try {
      localStorage.setItem('solare-cart', JSON.stringify({
        items: cart.items,
        promoCode: cart.promoCode
      }));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }

  // Bind event listeners
  function bindEvents() {
    // Promo code
    if (elements.applyPromoBtn) {
      elements.applyPromoBtn.addEventListener('click', applyPromoCode);
    }
    
    if (elements.promoInput) {
      elements.promoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          applyPromoCode();
        }
      });
    }

    // Clear cart
    if (elements.clearCartBtn) {
      elements.clearCartBtn.addEventListener('click', clearCart);
    }

    // Checkout
    if (elements.checkoutBtn) {
      elements.checkoutBtn.addEventListener('click', proceedToCheckout);
    }
  }

  // Add item to cart
  function addToCart(product) {
    const existingItem = cart.items.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.items.push({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price) || 0,
        image: product.image || product.primary_image,
        category: product.category_slug || product.category || 'producto',
        quantity: 1
      });
    }

    calculateTotals();
    saveCartToStorage();
    renderCart();
    updateNavbarCartCount();
    
    // Show success message
    showNotification(`${product.name} agregado al carrito`, 'success');
  }

  // Remove item from cart
  function removeFromCart(productId) {
    const itemIndex = cart.items.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
      const item = cart.items[itemIndex];
      cart.items.splice(itemIndex, 1);
      calculateTotals();
      saveCartToStorage();
      renderCart();
      updateNavbarCartCount();
      showNotification(`${item.name} eliminado del carrito`, 'info');
    }
  }

  // Update item quantity
  function updateQuantity(productId, newQuantity) {
    const item = cart.items.find(item => item.id === productId);
    if (item && newQuantity > 0) {
      item.quantity = newQuantity;
      calculateTotals();
      saveCartToStorage();
      renderCart();
      updateNavbarCartCount();
    } else if (newQuantity <= 0) {
      removeFromCart(productId);
    }
  }

  // Calculate totals
  function calculateTotals() {
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Calculate shipping
    cart.shipping = cart.subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 15;
    
    // Calculate discount
    cart.discount = 0;
    if (cart.promoCode && promoCodes[cart.promoCode]) {
      const promo = promoCodes[cart.promoCode];
      if (promo.type === 'percentage') {
        cart.discount = cart.subtotal * promo.discount;
      } else if (promo.type === 'fixed') {
        cart.discount = Math.min(promo.discount, cart.shipping); // For free shipping codes
        if (cart.promoCode === 'ENVIOGRATIS') {
          cart.shipping = 0;
        }
      }
    }
    
    // Calculate taxes (on subtotal minus discount)
    const taxableAmount = Math.max(0, cart.subtotal - cart.discount);
    cart.taxes = taxableAmount * TAX_RATE;
    
    // Calculate total
    cart.total = cart.subtotal + cart.shipping + cart.taxes - cart.discount;
  }

  // Render cart
  function renderCart() {
    if (!cart.items.length) {
      showEmptyCart();
    } else {
      showCartItems();
      updateSummary();
    }
  }

  // Show empty cart state
  function showEmptyCart() {
    if (elements.emptyCart) elements.emptyCart.hidden = false;
    if (elements.cartItemsList) elements.cartItemsList.style.display = 'none';
    if (elements.cartActions) elements.cartActions.hidden = true;
    if (elements.cartSummary) elements.cartSummary.hidden = true;
    if (elements.recommendedProducts) elements.recommendedProducts.hidden = true;
  }

  // Show cart items
  function showCartItems() {
    if (elements.emptyCart) elements.emptyCart.hidden = true;
    if (elements.cartItemsList) elements.cartItemsList.style.display = 'flex';
    if (elements.cartActions) elements.cartActions.hidden = false;
    if (elements.cartSummary) elements.cartSummary.hidden = false;
    if (elements.recommendedProducts) elements.recommendedProducts.hidden = false;

    renderCartItems();
  }

  // Render cart items
  function renderCartItems() {
    if (!elements.cartItemsList || !elements.cartItemTemplate) return;

    elements.cartItemsList.innerHTML = '';
    
    cart.items.forEach(item => {
      const itemElement = createCartItemElement(item);
      elements.cartItemsList.appendChild(itemElement);
    });
  }

  // Create cart item element
  function createCartItemElement(item) {
    const template = elements.cartItemTemplate.content.cloneNode(true);
    const itemElement = template.querySelector('.cart-item');
    
    // Set data attributes
    itemElement.dataset.id = item.id;
    
    // Set content
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

    // Bind events
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

    return itemElement;
  }

  // Update summary
  function updateSummary() {
    if (elements.subtotalEl) elements.subtotalEl.textContent = `$${cart.subtotal.toFixed(2)}`;
    if (elements.shippingEl) {
      elements.shippingEl.textContent = cart.shipping === 0 ? 'Gratis' : `$${cart.shipping.toFixed(2)}`;
    }
    if (elements.taxesEl) elements.taxesEl.textContent = `$${cart.taxes.toFixed(2)}`;
    if (elements.totalEl) elements.totalEl.textContent = `$${cart.total.toFixed(2)}`;
  }

  // Apply promo code
  function applyPromoCode() {
    if (!elements.promoInput || !elements.promoMessage) return;

    const code = elements.promoInput.value.trim().toUpperCase();
    
    if (!code) {
      showPromoMessage('Ingresa un código promocional', 'error');
      return;
    }

    if (promoCodes[code]) {
      cart.promoCode = code;
      calculateTotals();
      saveCartToStorage();
      updateSummary();
      showPromoMessage(`Código aplicado: ${promoCodes[code].description}`, 'success');
      elements.promoInput.value = '';
    } else {
      showPromoMessage('Código promocional inválido', 'error');
    }
  }

  // Show promo message
  function showPromoMessage(message, type) {
    if (!elements.promoMessage) return;

    elements.promoMessage.textContent = message;
    elements.promoMessage.className = `promo-message ${type}`;
    elements.promoMessage.hidden = false;

    setTimeout(() => {
      elements.promoMessage.hidden = true;
    }, 5000);
  }

  // Clear cart
  function clearCart() {
    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      cart = { items: [], subtotal: 0, taxes: 0, shipping: 0, discount: 0, total: 0, promoCode: null };
      saveCartToStorage();
      renderCart();
      updateNavbarCartCount();
      showNotification('Carrito vaciado', 'info');
    }
  }

  // Proceed to checkout
  function proceedToCheckout() {
    if (!cart.items.length) {
      showNotification('Tu carrito está vacío', 'error');
      return;
    }

    // Add loading state
    if (elements.checkoutBtn) {
      elements.checkoutBtn.classList.add('loading');
      elements.checkoutBtn.disabled = true;
    }

    // Simulate checkout process
    setTimeout(() => {
      alert(`¡Gracias por tu compra!\n\nResumen:\n- Productos: ${cart.items.length}\n- Total: $${cart.total.toFixed(2)}\n\nSerás redirigido al proceso de pago.`);
      
      // Reset button state
      if (elements.checkoutBtn) {
        elements.checkoutBtn.classList.remove('loading');
        elements.checkoutBtn.disabled = false;
      }
      
      // In a real app, redirect to payment processor
      // window.location.href = '/checkout';
    }, 2000);
  }

  // Load recommended products
  async function loadRecommendedProducts() {
    if (!elements.recommendedGrid) return;

    // Mock recommended products
    const recommendedProducts = [
      {
        id: 'rec1',
        name: 'Blazer Clásico',
        price: 120.00,
        image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=800&auto=format&fit=crop',
        category_slug: 'mujer'
      },
      {
        id: 'rec2',
        name: 'Camisa Oxford',
        price: 65.00,
        image: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=800&auto=format&fit=crop',
        category_slug: 'hombre'
      },
      {
        id: 'rec3',
        name: 'Bandolera Minimal',
        price: 85.00,
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop',
        category_slug: 'accesorios'
      },
      {
        id: 'rec4',
        name: 'Vestido Midi',
        price: 135.00,
        image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=800&auto=format&fit=crop',
        category_slug: 'mujer'
      }
    ];

    renderRecommendedProducts(recommendedProducts);
  }

  // Render recommended products
  function renderRecommendedProducts(products) {
    if (!elements.recommendedGrid) return;

    elements.recommendedGrid.innerHTML = '';

    products.forEach(product => {
      const productElement = createRecommendedProductElement(product);
      elements.recommendedGrid.appendChild(productElement);
    });
  }

  // Create recommended product element
  function createRecommendedProductElement(product) {
    const productElement = document.createElement('div');
    productElement.className = 'recommended-card';
    
    productElement.innerHTML = `
      <div class="recommended-card-image">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
      </div>
      <div class="recommended-card-body">
        <h3 class="recommended-card-title">${product.name}</h3>
        <div class="recommended-card-price">$${product.price.toFixed(2)}</div>
        <button class="btn-add-to-cart" data-product='${JSON.stringify(product)}'>
          Agregar al Carrito
        </button>
      </div>
    `;

    // Bind add to cart event
    const addBtn = productElement.querySelector('.btn-add-to-cart');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        addToCart(product);
      });
    }

    return productElement;
  }

  // Update navbar cart count
  function updateNavbarCartCount() {
    const cartCountEl = document.querySelector('#cartCount');
    if (cartCountEl) {
      const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      cartCountEl.textContent = totalItems;
      if (totalItems > 0) {
        cartCountEl.classList.add('show');
      } else {
        cartCountEl.classList.remove('show');
      }
    }
  }

  // Show notification
  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span>${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;

    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 16px 20px;
      border-radius: 6px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideInRight 0.3s ease;
      max-width: 300px;
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);

    // Close button
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => notification.remove());
    }
  }

  // Public API for external use
  window.SolareCart = {
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCart: () => ({ ...cart }),
    getItemCount: () => cart.items.reduce((sum, item) => sum + item.quantity, 0)
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCart);
  } else {
    initCart();
  }

})();
