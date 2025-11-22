// State Manager Compatibility Layer
// Provides backward compatibility for existing modules
(function () {
    'use strict';

    function waitForState(callback, maxAttempts = 50) {
        let attempts = 0;
        const check = () => {
            if (window.SolareState) {
                callback();
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(check, 100);
            }
        };
        check();
    }

    waitForState(() => {
        // ========================================================================
        // SolareAuth - Compatibility wrapper
        // ========================================================================
        if (!window.SolareAuth) {
            window.SolareAuth = {
                ready: window.SolareState.auth.isReady,
                getUser: () => window.SolareState.auth.getUser(),
                getSession: () => window.SolareState.auth.getSession(),
                isAuthenticated: () => window.SolareState.auth.isAuthenticated(),
                updateNavbar: (user) => {
                    // This function is called by old code, emit event for compatibility
                    window.dispatchEvent(new CustomEvent('auth:statechange', { detail: { user } }));
                }
            };
            console.log('[Compat] SolareAuth wrapper created');
        }

        // ========================================================================
        // SolareFavs - Compatibility wrapper  
        // ========================================================================
        if (!window.SolareFavs) {
            window.SolareFavs = {
                all: () => window.SolareState.favorites.getAll(),
                add: (product) => window.SolareState.favorites.add(product),
                remove: (productId) => window.SolareState.favorites.remove(productId),
                toggle: (product) => window.SolareState.favorites.toggle(product),
                isFav: (productId) => window.SolareState.favorites.isFavorite(productId)
            };
            console.log('[Compat] SolareFavs wrapper created');
        }

        // ========================================================================
        // Emit compatibility events
        // ========================================================================

        // Emit favoritesChanged for navbar.js
        window.SolareState.on('favorites:changed', ({ favorites }) => {
            window.dispatchEvent(new CustomEvent('favoritesChanged', {
                detail: { count: favorites.length }
            }));
        });



        console.log('[Compat] Compatibility layer initialized');
    });

})();
