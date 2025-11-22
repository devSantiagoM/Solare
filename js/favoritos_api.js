// Favoritos API - Migrated to State Manager
// This file is kept for backward compatibility and script tag presence
(function () {
  'use strict';

  // The actual logic is now in state-manager.js
  // and compatibility mapping is in state-compat.js

  // If state-compat.js hasn't run yet or we need to ensure SolareFavs exists:
  function initCompat() {
    if (!window.SolareState) {
      setTimeout(initCompat, 100);
      return;
    }

    if (!window.SolareFavs) {
      window.SolareFavs = {
        all: () => window.SolareState.favorites.getAll(),
        add: (product) => window.SolareState.favorites.add(product),
        remove: (productId) => window.SolareState.favorites.remove(productId),
        toggle: (product) => window.SolareState.favorites.toggle(product),
        isFav: (productId) => window.SolareState.favorites.isFavorite(productId),
        // Legacy method kept for safety, though navbar.js handles it now
        updateNavbarFavCount: () => { }
      };
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCompat);
  } else {
    initCompat();
  }

})();
