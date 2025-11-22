// Gestión del estado de autenticación global - Solare
(function () {
  'use strict';

  let currentUser = null;
  let currentSession = null;
  let initResolve;
  const initPromise = new Promise((resolve) => {
    initResolve = resolve;
  });

  // Inicializar estado de autenticación
  async function initAuthState() {
    if (!window.supabase) {
      // Esperar a que Supabase esté disponible
      setTimeout(initAuthState, 100);
      return;
    }

    try {
      // Obtener sesión actual
      const { data: { session }, error } = await window.supabase.auth.getSession();

      if (error) {
        console.error('Error obteniendo sesión:', error);
        initResolve(); // Resolver incluso con error
        return;
      }

      currentSession = session;
      currentUser = session?.user || null;

      // Actualizar navbar
      updateNavbarAuthState(currentUser);

      // Escuchar cambios en el estado de autenticación
      window.supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        currentSession = session;
        currentUser = session?.user || null;
        updateNavbarAuthState(currentUser);
      });

      // Resolver la promesa de inicialización
      initResolve();

    } catch (error) {
      console.error('Error inicializando estado de autenticación:', error);
      initResolve(); // Resolver incluso con error
    }
  }

  // Actualizar el estado de autenticación en la navbar
  function updateNavbarAuthState(user) {
    // Actualizar enlaces de cuenta en la navbar
    const accountLinks = document.querySelectorAll('.account-icon-desktop, .login-icon-mobile');

    accountLinks.forEach(link => {
      if (user) {
        // Cambiar el href a perfil o dashboard si existe
        const currentHref = link.getAttribute('href');
        if (currentHref && currentHref.includes('login.html')) {
          link.href = currentHref.replace('login.html', 'perfil.html') || 'perfil.html';
        }
        link.title = 'Mi Cuenta';
        link.setAttribute('aria-label', 'Mi Cuenta');
      } else {
        link.href = 'login.html';
        link.title = 'Iniciar Sesión';
        link.setAttribute('aria-label', 'Iniciar Sesión');
      }
    });

    // Agregar indicador visual si el usuario está autenticado
    accountLinks.forEach(link => {
      if (user) {
        link.classList.add('authenticated');
      } else {
        link.classList.remove('authenticated');
      }
    });
  }

  // API pública
  window.SolareAuth = {
    ready: initPromise, // Promesa que se resuelve cuando la auth está lista
    getUser: () => currentUser,
    getSession: () => currentSession,
    isAuthenticated: () => !!currentUser && !!currentSession,
    updateNavbar: updateNavbarAuthState
  };

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthState);
  } else {
    initAuthState();
  }
})();

