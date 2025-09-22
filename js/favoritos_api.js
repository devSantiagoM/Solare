// Favoritos API - Solare
(function(){
  'use strict';

  const STORAGE_KEY = 'solare-favs';

  function readFavs(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch(e){
      console.error('Error leyendo favoritos', e);
      return [];
    }
  }

  function saveFavs(list){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
    catch(e){ console.error('Error guardando favoritos', e); }
  }

  function isFav(id){
    return readFavs().some(it => String(it.id) === String(id));
  }

  function add(product){
    const list = readFavs();
    if (!list.some(it => String(it.id) === String(product.id))){
      const item = {
        id: product.id,
        name: product.name,
        price: Number(product.price||0),
        image: product.primary_image || product.image,
        category: product.category_slug || product.category || 'producto'
      };
      list.push(item);
      saveFavs(list);
      updateNavbarFavCount();
    }
  }

  function remove(id){
    const list = readFavs().filter(it => String(it.id) !== String(id));
    saveFavs(list);
    updateNavbarFavCount();
  }

  function toggle(product){
    if (isFav(product.id)) remove(product.id); else add(product);
  }

  function all(){ return readFavs(); }

  function updateNavbarFavCount(){
    const el = document.querySelector('#favCount');
    if (!el) return;
    const count = readFavs().length;
    el.textContent = count;
    if (count > 0) el.classList.add('show'); else el.classList.remove('show');
  }

  window.SolareFavs = { isFav, add, remove, toggle, all, updateNavbarFavCount };

  document.addEventListener('DOMContentLoaded', updateNavbarFavCount);
  window.addEventListener('storage', (e)=>{ if (e.key === STORAGE_KEY) updateNavbarFavCount(); });
})();
