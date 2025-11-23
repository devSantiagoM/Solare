// EmailJS Configuration - Solare
(function () {
  'use strict';

  // EmailJS initialization
  function initEmailJS() {
    // Check if EmailJS is already loaded
    if (window.emailjs) {
      console.log('EmailJS already loaded');
      return;
    }

    // Load EmailJS script
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    script.onload = function () {
      // Initialize EmailJS with your public key
      // IMPORTANT: Replace 'YOUR_PUBLIC_KEY' with your actual EmailJS public key
      window.emailjs.init('XGhHMU8D-PCEL5qkN');
      console.log('EmailJS initialized successfully');
    };
    script.onerror = function () {
      console.error('Failed to load EmailJS script');
    };

    document.head.appendChild(script);
  }

  // Initialize EmailJS when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmailJS);
  } else {
    initEmailJS();
  }

  // Send order confirmation email
  async function sendOrderEmail(orderData) {
    if (!window.emailjs) {
      console.error('EmailJS not loaded');
      return { success: false, error: 'EmailJS not loaded' };
    }

    try {
      // Send to Client
      const clientParams = {
        to_email: orderData.email,
        to_name: orderData.first_name,
        order_number: orderData.order_number,
        order_total: orderData.total,
        order_items: formatOrderItems(orderData.items),
        // Add other template params as needed
      };

      // Send to Provider (Admin)
      const providerParams = {
        to_email: 'lucassosavega@gmail.com', // Replace with actual admin email
        client_name: `${orderData.first_name} ${orderData.last_name}`,
        client_email: orderData.email,
        client_phone: orderData.phone,
        order_number: orderData.order_number,
        order_total: orderData.total,
        order_items: formatOrderItems(orderData.items),
      };

      // Replace 'YOUR_SERVICE_ID' and 'YOUR_TEMPLATE_ID' with actual values
      // You might want separate templates for client and provider
      await window.emailjs.send('service_rkhzjpw', 'template_4afqq84', clientParams);
      await window.emailjs.send('service_esxi5pn', 'template_j6qb7vv', providerParams);

      console.log('Emails sent successfully (simulated)', clientParams, providerParams);
      return { success: true };

    } catch (error) {
      console.error('Error sending emails:', error);
      return { success: false, error };
    }
  }

  function formatOrderItems(items) {
    return items.map(item => `${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}`).join('\n');
  }

  // Export for external use
  window.SolareEmailJS = {
    init: initEmailJS,
    sendOrderEmail: sendOrderEmail,
    isInitialized: () => window.emailjs !== undefined
  };

})();
