// EmailJS Configuration - Solare
(function() {
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
    script.onload = function() {
      // Initialize EmailJS with your public key
      // IMPORTANT: Replace 'YOUR_PUBLIC_KEY' with your actual EmailJS public key
      window.emailjs.init('YOUR_PUBLIC_KEY');
      console.log('EmailJS initialized successfully');
    };
    script.onerror = function() {
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

  // Export for external use
  window.SolareEmailJS = {
    init: initEmailJS,
    isInitialized: () => window.emailjs !== undefined
  };

})();
