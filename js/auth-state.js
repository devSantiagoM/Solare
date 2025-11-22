// Auth UI Controller - Migrated to State Manager
// Handles UI updates related to authentication (navbar links, etc)
(function () {
  'use strict';

  function updateNavbarAuthUI(user) {
    const accountLinks = document.querySelectorAll('.account-icon-desktop, .login-icon-mobile');

    accountLinks.forEach(link => {
      if (user) {
        // Change href to profile
        const currentHref = link.getAttribute('href');
        if (currentHref && currentHref.includes('login.html')) {
          link.href = currentHref.replace('login.html', 'perfil.html') || 'perfil.html';
        }
        link.title = 'Mi Cuenta';
        link.setAttribute('aria-label', 'Mi Cuenta');
        link.classList.add('authenticated');
      } else {
        // Change href to login
        const currentHref = link.getAttribute('href');
        if (currentHref && currentHref.includes('perfil.html')) {
          link.href = currentHref.replace('perfil.html', 'login.html') || 'login.html';
        } else {
          link.href = 'login.html';
        }
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
