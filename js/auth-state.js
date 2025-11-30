// Auth UI Controller - Migrated to State Manager
// Handles UI updates related to authentication (navbar links, etc)
(function () {
  'use strict';

  function updateNavbarAuthUI(user) {
    const accountLinks = document.querySelectorAll('.account-icon-desktop, .login-icon-mobile');

    accountLinks.forEach(link => {
      if (user) {
        // User is logged in - point to profile
        link.href = 'perfil.html';
        link.title = 'Mi Cuenta';
        link.setAttribute('aria-label', 'Mi Cuenta');
        link.classList.add('authenticated');
      } else {
        // User is not logged in - point to login
        link.href = 'login.html';
        link.title = 'Iniciar Sesión';
        link.setAttribute('aria-label', 'Iniciar Sesión');
        link.classList.remove('authenticated');
      }
    });
  }

  function initAuthUI() {
    if (!window.SolareState) {
      setTimeout(initAuthUI, 100);
      return;
    }

    // Initial update
    updateNavbarAuthUI(window.SolareState.auth.getUser());

    // Listen for changes
    window.SolareState.on('auth:changed', ({ user }) => {
      updateNavbarAuthUI(user);
    });
  }

  // Initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthUI);
  } else {
    initAuthUI();
  }

})();
