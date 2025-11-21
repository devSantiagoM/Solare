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

    // Show checkout modal instead of alert
    showCheckoutModal();
  }

  // Show checkout modal
  function showCheckoutModal() {
    const modal = el('#checkout-modal');
    if (!modal) return;

    // Update checkout summary
    updateCheckoutSummary();
    
    // Show modal
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    
    // Bind modal events
    bindCheckoutEvents();
  }

  // Hide checkout modal
  function hideCheckoutModal() {
    const modal = el('#checkout-modal');
    if (modal) {
      modal.hidden = true;
      document.body.style.overflow = '';
    }
  }

  // Update checkout summary
  function updateCheckoutSummary() {
    const checkoutItems = el('#checkout-items');
    const checkoutSubtotal = el('#checkout-subtotal');
    const checkoutShipping = el('#checkout-shipping');
    const checkoutTaxes = el('#checkout-taxes');
    const checkoutTotal = el('#checkout-total');

    if (checkoutItems) {
      checkoutItems.innerHTML = cart.items.map(item => `
        <div class="checkout-item">
          <div class="checkout-item-image">
            <img src="${item.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop'}" alt="${item.name}">
          </div>
          <div class="checkout-item-details">
            <div class="checkout-item-name">${item.name}</div>
            <div class="checkout-item-quantity">Cantidad: ${item.quantity}</div>
          </div>
          <div class="checkout-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
        </div>
      `).join('');
    }

    if (checkoutSubtotal) checkoutSubtotal.textContent = `$${cart.subtotal.toFixed(2)}`;
    if (checkoutShipping) checkoutShipping.textContent = cart.shipping === 0 ? 'Gratis' : `$${cart.shipping.toFixed(2)}`;
    if (checkoutTaxes) checkoutTaxes.textContent = `$${cart.taxes.toFixed(2)}`;
    if (checkoutTotal) checkoutTotal.textContent = `$${cart.total.toFixed(2)}`;
  }

  // Bind checkout events
  function bindCheckoutEvents() {
    const closeBtn = el('#close-checkout-modal');
    const cancelBtn = el('#cancel-checkout');
    const confirmBtn = el('#confirm-order');
    const form = el('#checkout-form');

    if (closeBtn) {
      closeBtn.onclick = hideCheckoutModal;
    }

    if (cancelBtn) {
      cancelBtn.onclick = hideCheckoutModal;
    }

    if (confirmBtn) {
      confirmBtn.onclick = handleConfirmOrder;
    }

    // Close modal on outside click
    const modal = el('#checkout-modal');
    if (modal) {
      modal.onclick = (e) => {
        if (e.target === modal) {
          hideCheckoutModal();
        }
      };
    }
  }

  // Handle confirm order
  async function handleConfirmOrder() {
    const form = el('#checkout-form');
    const confirmBtn = el('#confirm-order');
    
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Get form data
    const formData = new FormData(form);
    const customerData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      whatsapp: formData.get('whatsapp') || formData.get('phone'),
      address: formData.get('address'),
      city: formData.get('city'),
      province: formData.get('province'),
      notes: formData.get('notes') || ''
    };

    // Add loading state
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Procesando...';
    }

    try {
      // Generate order number
      const orderNumber = 'ORD-' + Date.now().toString().slice(-8);
      
      // Send WhatsApp message to provider
      await sendWhatsAppOrder(customerData, orderNumber);
      
      // Send email confirmation to customer
      await sendEmailConfirmation(customerData, orderNumber);
      
      // Save order to database (if implemented)
      await saveOrderToDatabase(customerData, orderNumber);
      
      // Show success message
      showNotification('¡Pedido confirmado! Te contactaremos pronto.', 'success');
      
      // Clear cart and hide modal
      clearCart();
      hideCheckoutModal();
      
      // Show order confirmation details
      showOrderConfirmation(customerData, orderNumber);
      
    } catch (error) {
      console.error('Error processing order:', error);
      showNotification('Error al procesar el pedido. Por favor intenta nuevamente.', 'error');
    } finally {
      // Reset button state
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirmar Pedido';
      }
    }
  }

  // Send WhatsApp order to provider
  async function sendWhatsAppOrder(customerData, orderNumber) {
    const providerPhone = '595983199896'; // Replace with actual provider WhatsApp number
    
    let message = `🛍️ *NUEVO PEDIDO - SOLARE*\n\n`;
    message += `📋 *Número de Pedido:* ${orderNumber}\n`;
    message += `📅 *Fecha:* ${new Date().toLocaleString('es-AR')}\n\n`;
    
    message += `👤 *DATOS DEL CLIENTE*\n`;
    message += `📝 *Nombre:* ${customerData.name}\n`;
    message += `📧 *Email:* ${customerData.email}\n`;
    message += `📞 *Teléfono:* ${customerData.phone}\n`;
    message += `💬 *WhatsApp:* ${customerData.whatsapp}\n\n`;
    
    message += `📍 *DIRECCIÓN DE ENVÍO*\n`;
    message += `🏠 ${customerData.address}\n`;
    message += `🏙️ ${customerData.city}, ${customerData.province}\n\n`;
    
    message += `🛒 *DETALLE DEL PEDIDO*\n`;
    cart.items.forEach((item, index) => {
      message += `${index + 1}. ${item.name}\n`;
      message += `   Cantidad: ${item.quantity} x $${item.price.toFixed(2)} = $${(item.price * item.quantity).toFixed(2)}\n`;
    });
    
    message += `\n💰 *RESUMEN DE PAGO*\n`;
    message += `Subtotal: $${cart.subtotal.toFixed(2)}\n`;
    message += `Envío: ${cart.shipping === 0 ? 'Gratis' : '$' + cart.shipping.toFixed(2)}\n`;
    message += `Impuestos: $${cart.taxes.toFixed(2)}\n`;
    message += `💳 *TOTAL: $${cart.total.toFixed(2)}*\n\n`;
    
    message += `💳 *MÉTODO DE PAGO:* Pago contra entrega\n`;
    message += `🚚 *MÉTODO DE ENTREGA:* Envío a domicilio\n\n`;
    
    if (customerData.notes) {
      message += `📝 *Notas del cliente:* ${customerData.notes}\n\n`;
    }
    
    message += `⏰ Por favor contactar al cliente para coordinar la entrega.`;
    
    const whatsappUrl = `https://wa.me/${providerPhone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  // Send email confirmation to customer
  async function sendEmailConfirmation(customerData, orderNumber) {
    // Check if EmailJS is initialized
    if (!window.emailjs) {
      console.warn('EmailJS not initialized. Skipping email confirmation.');
      return;
    }

    try {
      await window.emailjs.send('service_solare', 'template_order_confirmation', {
        order_number: orderNumber,
        customer_name: customerData.name,
        customer_email: customerData.email,
        customer_phone: customerData.phone,
        customer_address: `${customerData.address}, ${customerData.city}, ${customerData.province}`,
        order_items: cart.items.map(item => 
          `${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`
        ).join('\n'),
        order_total: cart.total.toFixed(2),
        order_date: new Date().toLocaleString('es-AR'),
        reply_to: customerData.email
      });
      
      console.log('Email confirmation sent successfully');
    } catch (error) {
      console.error('Error sending email confirmation:', error);
      throw error;
    }
  }

  // Save order to database (placeholder for future implementation)
  async function saveOrderToDatabase(customerData, orderNumber) {
    // This would save the order to your database
    // For now, we'll just log it
    const orderData = {
      order_number: orderNumber,
      customer: customerData,
      items: cart.items,
      totals: {
        subtotal: cart.subtotal,
        shipping: cart.shipping,
        taxes: cart.taxes,
        total: cart.total
      },
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    console.log('Order data to be saved:', orderData);
    
    // If you have Supabase or another database, you would save it here:
    // if (window.supabase) {
    //   await window.supabase.from('orders').insert([orderData]);
    // }
  }

  // Show order confirmation
  function showOrderConfirmation(customerData, orderNumber) {
    const confirmationHtml = `
      <div style="max-width: 600px; margin: 20px auto; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <h2 style="color: #10b981; margin-bottom: 20px;">✅ ¡Pedido Confirmado!</h2>
        <p><strong>Número de Pedido:</strong> ${orderNumber}</p>
        <p><strong>Gracias por tu compra, ${customerData.name}!</strong></p>
        <p>Hemos recibido tu pedido y te contactaremos pronto para coordinar la entrega.</p>
        <p>Revisa tu email (${customerData.email}) para ver los detalles completos de tu pedido.</p>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
          <h3>Resumen del Pedido:</h3>
          <p><strong>Total:</strong> $${cart.total.toFixed(2)}</p>
          <p><strong>Método de entrega:</strong> Envío a domicilio</p>
          <p><strong>Método de pago:</strong> Pago contra entrega</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="margin-top: 20px; padding: 12px 24px; background: #111; color: white; border: none; border-radius: 6px; cursor: pointer;">Cerrar</button>
      </div>
    `;
    
    const confirmationDiv = document.createElement('div');
    confirmationDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
    `;
    confirmationDiv.innerHTML = confirmationHtml;
    
    document.body.appendChild(confirmationDiv);
    
    // Auto-remove after 10 seconds or when clicked
    setTimeout(() => {
      if (confirmationDiv.parentElement) {
        confirmationDiv.remove();
      }
    }, 10000);
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
