// Route Guard - Protección de rutas para Solare
// Este script protege páginas que requieren autenticación o permisos especiales

(function () {
    'use strict';

    // Configuración de rutas protegidas
    const PROTECTED_ROUTES = {
        // Páginas que requieren autenticación
        authenticated: [
            'perfil.html',
            'carrito.html',
            'favoritos.html'
        ],
        // Páginas que requieren rol de administrador
        admin: [
            'admin.html'
        ],
        // Página de login (redirigir aquí si no está autenticado)
        loginPage: 'login.html',
        // Página de inicio (redirigir aquí si no tiene permisos)
        homePage: 'index.html'
    };

    // Obtener el nombre del archivo actual
    function getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        return page;
    }

    // Verificar si la página actual requiere protección
    function requiresAuth() {
        const currentPage = getCurrentPage();
        return PROTECTED_ROUTES.authenticated.includes(currentPage);
    }

    function requiresAdmin() {
        const currentPage = getCurrentPage();
        return PROTECTED_ROUTES.admin.includes(currentPage);
    }

    // Función principal de protección de rutas
    async function checkRouteAccess() {
        const currentPage = getCurrentPage();

        // Si estamos en la página de login, no hacer nada
        if (currentPage === PROTECTED_ROUTES.loginPage) {
            return;
        }

        // Esperar a que Supabase esté disponible
        let attempts = 0;
        while (!window.supabase && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.supabase) {
            console.error('Supabase no está disponible para route guard');
            return;
        }

        try {
            // Obtener sesión actual
            const { data: { session }, error } = await window.supabase.auth.getSession();

            // Si la página requiere autenticación
            if (requiresAuth()) {
                if (error || !session) {
                    console.warn('Acceso denegado: se requiere autenticación');
                    // Guardar la URL a la que intentaba acceder
                    sessionStorage.setItem('redirectAfterLogin', window.location.href);
                    window.location.href = PROTECTED_ROUTES.loginPage;
                    return;
                }
            }

            // Si la página requiere permisos de admin
            if (requiresAdmin()) {
                if (error || !session) {
                    console.warn('Acceso denegado: se requiere autenticación de admin');
                    sessionStorage.setItem('redirectAfterLogin', window.location.href);
                    window.location.href = PROTECTED_ROUTES.loginPage;
                    return;
                }

                // Verificar rol de administrador
                const userId = session.user.id;
                let isAdmin = false;

                // Intentar obtener rol desde la tabla profiles
                try {
                    const { data: profile, error: profileError } = await window.supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', userId)
                        .maybeSingle();

                    if (!profileError && profile) {
                        isAdmin = profile.role === 'admin' || profile.role === 'staff';
                    }
                } catch (err) {
                    console.log('No se pudo verificar rol desde profiles');
                }

                // Si no es admin, verificar en metadata como fallback
                if (!isAdmin) {
                    const userRole = session.user.user_metadata?.role ||
                        session.user.app_metadata?.role;
                    isAdmin = userRole === 'admin' || userRole === 'staff';
                }

                // Si no es admin, redirigir a inicio
                if (!isAdmin) {
                    console.warn('Acceso denegado: se requieren permisos de administrador');
                    alert('No tienes permisos para acceder a esta página');
                    window.location.href = PROTECTED_ROUTES.homePage;
                    return;
                }
            }

            // Si llegamos aquí, el usuario tiene acceso
            console.log('Acceso permitido a:', currentPage);

        } catch (error) {
            console.error('Error en route guard:', error);
            // En caso de error, permitir acceso para no romper la aplicación
            // pero registrar el error
        }
    }

    // Ejecutar verificación cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkRouteAccess);
    } else {
        // Si el DOM ya está listo, ejecutar inmediatamente
        checkRouteAccess();
    }

})();
