// Favoritos API - Solare (Supabase Integration)
(function () {
  'use strict';

  const STORAGE_KEY = 'solare-favs';
  let localFavs = [];
  let dbFavs = [];

  // Initialize
  async function init() {
    // Load local
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      localFavs = raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error loading local favs', e);
      localFavs = [];
    }

    // Wait for auth to be ready
    if (!window.supabase) {
      setTimeout(init, 100);
      return;
    }

    // CRITICAL: Wait for SolareAuth to initialize
    if (window.SolareAuth?.ready) {
      await window.SolareAuth.ready;
    }

    // Check auth
    const user = window.SolareAuth?.getUser();
    if (user) {
      await loadDbFavs(user.id);
      await syncFavs(user.id);
    }

    updateNavbarFavCount();

    // Listen for auth changes
    window.supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadDbFavs(session.user.id);
        await syncFavs(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        dbFavs = [];
        updateNavbarFavCount();
      }
    });
  }

  async function loadDbFavs(userId) {
    try {
      const { data, error } = await window.supabase
        .from('user_favorites')
        .select('product_id, products(id, name, price, slug, categories(slug), product_images(url))')
        .eq('user_id', userId);

      if (error) throw error;

      console.log('Raw Favorites Data:', data);

      dbFavs = (data || []).map(item => {
        console.log('Mapping item:', item);
        return {
          id: item.products.id,
          name: item.products.name,
          price: item.products.price,
          image: item.products.product_images?.[0]?.url || null, // Simplified
          category: item.products.categories?.slug || 'producto'
        };
      });

      console.log('Mapped dbFavs:', dbFavs);

      // Enrich images if needed (similar to cart)
      if (dbFavs.length > 0) {
        // For now, we assume the join works or we rely on what we have.
        // Ideally we fetch primary images.
      }

      // Trigger UI update
      updateNavbarFavCount();

    } catch (e) {
      console.error('Error loading DB favs:', e);
    }
  }

  async function syncFavs(userId) {
    // Merge local into DB
    const toAdd = localFavs.filter(l => !dbFavs.some(d => d.id === l.id));

    if (toAdd.length > 0) {
      // Filter out items that might already exist in DB but weren't in dbFavs state yet
      // (Double check with DB to avoid 409)
      const idsToCheck = toAdd.map(i => i.id);
      const { data: existing } = await window.supabase
        .from('user_favorites')
        .select('product_id')
        .eq('user_id', userId)
        .in('product_id', idsToCheck);

      const existingIds = new Set((existing || []).map(e => e.product_id));
      const finalToAdd = toAdd.filter(item => !existingIds.has(item.id));

      if (finalToAdd.length > 0) {
        const records = finalToAdd.map(item => ({
          user_id: userId,
          product_id: item.id
        }));

        const { error } = await window.supabase
          .from('user_favorites')
          .insert(records);

        if (error) {
          console.error('Error syncing favs:', error);
        }
      }

      // Clear local storage after sync attempt
      localStorage.removeItem(STORAGE_KEY);
      localFavs = [];
      await loadDbFavs(userId);
    }
    updateNavbarFavCount();
  }

  function getFavs() {
    const user = window.SolareAuth?.getUser();
    return user ? dbFavs : localFavs;
  }

  function isFav(id) {
    return getFavs().some(it => String(it.id) === String(id));
  }

  async function add(product) {
    const user = window.SolareAuth?.getUser();

    if (user) {
      // Add to DB
      if (isFav(product.id)) return;

      // Optimistic update
      const newItem = {
        id: product.id,
        name: product.name,
        price: Number(product.price || 0),
        image: product.primary_image || product.image,
        category: product.category_slug || product.category || 'producto'
      };
      dbFavs.push(newItem);
      updateNavbarFavCount();

      const { error } = await window.supabase
        .from('user_favorites')
        .insert([{ user_id: user.id, product_id: product.id }]);

      if (error) {
        console.error('Error adding fav to DB:', error);
        // Rollback
        dbFavs = dbFavs.filter(i => i.id !== product.id);
        updateNavbarFavCount();
      }
    } else {
      // Add to Local
      if (isFav(product.id)) return;

      const item = {
        id: product.id,
        name: product.name,
        price: Number(product.price || 0),
        image: product.primary_image || product.image,
        category: product.category_slug || product.category || 'producto'
      };
      localFavs.push(item);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localFavs));
      updateNavbarFavCount();
    }
  }

  async function remove(id) {
    const user = window.SolareAuth?.getUser();

    if (user) {
      // Remove from DB
      const prev = [...dbFavs];
      dbFavs = dbFavs.filter(it => String(it.id) !== String(id));
      updateNavbarFavCount();

      const { error } = await window.supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', id);

      if (error) {
        console.error('Error removing fav from DB:', error);
        dbFavs = prev;
        updateNavbarFavCount();
      }
    } else {
      // Remove from Local
      localFavs = localFavs.filter(it => String(it.id) !== String(id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localFavs));
      updateNavbarFavCount();
    }
  }

  function toggle(product) {
    if (isFav(product.id)) remove(product.id); else add(product);
  }

  function all() { return getFavs(); }

  function updateNavbarFavCount() {
    const el = document.querySelector('#favCount');
    if (!el) return;
    const count = getFavs().length;
    el.textContent = count;
    if (count > 0) el.classList.add('show'); else el.classList.remove('show');

    // Also update UI if on favorites page
    if (window.location.pathname.includes('favoritos.html') && typeof window.renderFavs === 'function') {
      window.renderFavs();
    }
  }

  window.SolareFavs = { isFav, add, remove, toggle, all, updateNavbarFavCount };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
