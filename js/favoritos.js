// Favoritos Page - render and interactions
(function(){
  'use strict';

  const el = (s, c=document) => c.querySelector(s);
  const els = (s, c=document) => Array.from(c.querySelectorAll(s));

  function render() {
    const grid = el('#favs-grid');
    const empty = el('#empty-favs');
    const tpl = el('#fav-card-template');
    if (!grid || !tpl) return;

    const favs = (window.SolareFavs && window.SolareFavs.all()) || [];

    grid.innerHTML = '';
    if (!favs.length) {
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    const frag = document.createDocumentFragment();
    favs.forEach(p => {
      const node = tpl.content.cloneNode(true);
      const card = node.querySelector('.card');
      const img = node.querySelector('img');
      const title = node.querySelector('.card-title');
      const price = node.querySelector('.card-price');
      const btnRemove = node.querySelector('.remove-fav');
      const btnAddCart = node.querySelector('.add-cart');
      const favBtn = node.querySelector('.fav-btn');

      if (card) card.dataset.id = p.id;
      if (img) { img.src = p.image || 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?q=80&w=800&auto=format&fit=crop'; img.alt = p.name; }
      if (title) title.textContent = p.name;
      if (price) price.textContent = `$${Number(p.price||0).toFixed(2)}`;

      if (btnRemove) btnRemove.addEventListener('click', () => { window.SolareFavs?.remove(p.id); render(); });
      if (favBtn) favBtn.addEventListener('click', () => { window.SolareFavs?.remove(p.id); render(); });
      if (btnAddCart) btnAddCart.addEventListener('click', () => { window.SolareCart?.addToCart(p); });

      frag.appendChild(node);
    });
    grid.appendChild(frag);
  }

  function init(){ render(); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
