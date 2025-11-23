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
      // Validate inputs
      if (!orderData.email) {
        console.error('Missing email in orderData:', orderData);
        throw new Error('El email del cliente es requerido');
      }

      // Send to Client
      const clientParams = {
        to_email: orderData.email,
        to_name: orderData.first_name,
        order_number: orderData.order_number,
        order_total: orderData.total,
        order_items: formatOrderItems(orderData.items),
      };

      console.log('Sending client email with params:', clientParams);

      // Send to Provider (Admin)
      const providerParams = {
        to_email: 'vera27351@gmail.com',
        client_name: `${orderData.first_name} ${orderData.last_name}`,
        client_email: orderData.email,
        client_phone: orderData.phone,
        order_number: orderData.order_number,
        order_total: orderData.total,
        order_items: formatOrderItems(orderData.items),
      };

      console.log('Sending provider email with params:', providerParams);

      // Send emails
      // Note: Ensure 'To Email' field in EmailJS template settings is set to {{to_email}}
      const clientPromise = window.emailjs.send('service_rkhzjpw', 'template_4afqq84', clientParams);
      const providerPromise = window.emailjs.send('service_esxi5pn', 'template_j6qb7vv', providerParams);

      await Promise.all([clientPromise, providerPromise]);

      console.log('Emails sent successfully');
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
