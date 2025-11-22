// Productos con Supabase: colecciones, filtros, orden, búsqueda, reviews
(function () {
  const el = (sel, ctx = document) => ctx.querySelector(sel);
  const els = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const COLLECTION_SLUGS = {
    NUEVOS: 'nuevos-llegados',
    INVIERNO: 'invierno-otono',
    PRIMAVERA: 'primavera-verano',
    OTROS: 'otros',
  };

  // Función para extraer colores del nombre o tags del producto
  function extractColors(name, tags) {
    const colorKeywords = {
      'negro': ['negro', 'black', 'negra'],
      'blanco': ['blanco', 'white', 'blanca'],
      'azul': ['azul', 'blue'],
      'rojo': ['rojo', 'red', 'roja'],
      'multicolor': ['floral', 'multicolor', 'estampado']
    };

    const colors = [];
    const lowerName = name.toLowerCase();
    const lowerTags = tags.map(t => String(t).toLowerCase());

    for (const [color, keywords] of Object.entries(colorKeywords)) {
      const found = keywords.some(keyword =>
        lowerName.includes(keyword) || lowerTags.some(tag => tag.includes(keyword))
      );
      if (found) colors.push(color);
    }

    return colors.length > 0 ? colors : ['negro']; // Default negro si no se encuentra color
  }

  // Dataset de respaldo por si falla Supabase
  function mockFor(slug) {
    return [];
  }

  let currentCollection = COLLECTION_SLUGS.NUEVOS;
  const sectionData = new Map();

  function setActiveTab(slug) {
    els('.collection-link').forEach(a => a.classList.toggle('active', a.dataset.tab === slug));
  }

  function getBadge(tags, isFeatured) {
    if (!Array.isArray(tags)) return '';
    const tagStr = tags.map(t => String(t).toLowerCase()).join(' ');
    if (tagStr.includes('nuevo')) return 'Nuevo';
    if (tagStr.includes('edicion-limitada') || tagStr.includes('ed. limitada')) return 'Ed. Limitada';
    if (isFeatured) return 'Destacado';
    return '';
  }

  function renderGridInto(containerId, emptyId, list) {
    const grid = el(`#${containerId}`);
    const empty = el(`#${emptyId}`);
    if (!grid || !empty) return;
    grid.innerHTML = '';
    if (!list.length) { empty.hidden = false; return; }
    empty.hidden = true;
    const frag = document.createDocumentFragment();

    list.forEach(p => {
      const card = document.createElement('article');
      card.className = 'card';
      const imgUrl = p.primary_image || p.image || 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?q=80&w=800&auto=format&fit=crop';

      // Use real rating data if available, else 0
      const rating = p.rating_avg || 0;
      const ratingCount = p.rating_count || 0;
      const badge = p.badge || getBadge(p.tags, p.is_featured);

      card.innerHTML = `
        <div class="card-media">
          <img src="${imgUrl}" alt="${p.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop'" />
          ${badge ? `<span class="badge">${badge}</span>` : ''}
          <button class="fav-toggle" aria-label="Agregar a favoritos">❤</button>
        </div>
        <div class="card-body">
          <h3 class="card-title">${p.name}</h3>
          <div class="card-rating">
            <span class="rating-stars">★ ${rating > 0 ? rating.toFixed(1) : '-'}</span>
            <span class="rating-count">(${ratingCount})</span>
          </div>
          <div class="card-price">$${Number(p.price || 0).toFixed(2)}</div>
          <button class="btn-add-to-cart" data-product='${JSON.stringify(p)}'>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            Agregar al Carrito
          </button>
        </div>`;

      // Favorites toggle
      const favBtn = card.querySelector('.fav-toggle');
      if (favBtn) {
        try { if (window.SolareFavs?.isFav(p.id)) favBtn.classList.add('active'); } catch (e) { }
        favBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.SolareFavs) {
            window.SolareFavs.toggle(p);
            favBtn.classList.toggle('active');
          }
        });
      }

      // Add to cart
      const addToCartBtn = card.querySelector('.btn-add-to-cart');
      if (addToCartBtn) {
        addToCartBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const productData = JSON.parse(addToCartBtn.dataset.product);
          if (window.SolareCart) {
            window.SolareCart.addToCart(productData);
          }
        });
      }

      frag.appendChild(card);
    });
    grid.appendChild(frag);
  }

  function closeSidebarOnMobile() {
    if (window.innerWidth <= 768) {
      const sidebar = el('.productos-sidebar');
      const backdrop = el('#sidebarBackdrop');
      if (sidebar && sidebar.classList.contains('open')) {
        setTimeout(() => {
          sidebar.classList.remove('open');
          if (backdrop) backdrop.classList.remove('active');
          document.body.classList.remove('sidebar-open');
          document.body.style.overflow = '';
          localStorage.setItem('solare-sidebar-open', false);
        }, 200);
      }
    }
  }

  function applyFilters() {
    const q = (el('#search')?.value || '').trim().toLowerCase();
    const catRadio = el('input[name="categoria"]:checked');
    const cat = catRadio ? catRadio.value : '';
    const selectedColors = Array.from(els('input[name="color"]:checked')).map(cb => cb.value);
    const order = el('#orden')?.value || 'relevancia';

    const applyTo = (list) => {
      let filtered = list.filter(p => {
        const name = (p.name || '').toLowerCase();
        const categorySlug = (p.category_slug || p.category || '').toLowerCase();
        const tags = Array.isArray(p.tags) ? p.tags.map(t => String(t).toLowerCase()) : [];
        const colors = Array.isArray(p.colors) ? p.colors : [];

        const matchesQ = !q || name.includes(q);
        const matchesCat = !cat || categorySlug === cat || tags.includes(cat);
        const matchesColor = selectedColors.length === 0 || selectedColors.some(color =>
          colors.includes(color) || name.includes(color) || tags.includes(color)
        );
        return matchesQ && matchesCat && matchesColor;
      });
      switch (order) {
        case 'precio-asc': filtered.sort((a, b) => Number(a.price || 0) - Number(b.price || 0)); break;
        case 'precio-desc': filtered.sort((a, b) => Number(b.price || 0) - Number(a.price || 0)); break;
        case 'nombre-asc': filtered.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))); break;
        case 'nombre-desc': filtered.sort((a, b) => String(b.name || '').localeCompare(String(a.name || ''))); break;
        default: break;
      }
      return filtered;
    };

    const map = new Map([
      [COLLECTION_SLUGS.NUEVOS, { grid: 'grid-nuevos-llegados', empty: 'empty-nuevos-llegados' }],
      [COLLECTION_SLUGS.INVIERNO, { grid: 'grid-invierno-otono', empty: 'empty-invierno-otono' }],
      [COLLECTION_SLUGS.PRIMAVERA, { grid: 'grid-primavera-verano', empty: 'empty-primavera-verano' }],
      [COLLECTION_SLUGS.OTROS, { grid: 'grid-otros', empty: 'empty-otros' }],
    ]);
    map.forEach((targets, slug) => {
      const original = sectionData.get(slug) || [];
      const filtered = applyTo(original);
      renderGridInto(targets.grid, targets.empty, filtered);
    });
  }

  // Helper to fetch reviews for a list of products
  async function fetchReviewsForProducts(products) {
    if (!products.length) return products;
    const ids = products.map(p => p.id);

    try {
      const { data, error } = await window.supabase
        .from('product_reviews')
        .select('product_id, rating')
        .in('product_id', ids)
        .eq('is_approved', true);

      if (error) throw error;

      // Calculate stats per product
      const stats = {};
      data.forEach(r => {
        if (!stats[r.product_id]) stats[r.product_id] = { sum: 0, count: 0 };
        stats[r.product_id].sum += r.rating;
        stats[r.product_id].count++;
      });

      return products.map(p => {
        const s = stats[p.id];
        return {
          ...p,
          rating_avg: s ? s.sum / s.count : 0,
          rating_count: s ? s.count : 0
        };
      });

    } catch (e) {
      console.error('Error fetching reviews:', e);
      return products;
    }
  }

  async function fetchProductsByCollectionSlug(slug) {
    const supabase = window.supabase;
    if (!supabase) return mockFor(slug);

    try {
      let products = [];

      if (slug !== COLLECTION_SLUGS.OTROS) {
        const { data: collectionData } = await supabase
          .from('collections')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        if (!collectionData) return mockFor(slug);

        const { data } = await supabase
          .from('collection_products')
          .select(`
            product_id,
            sort_order,
            products (
              id, name, slug, description, price, compare_price, is_active, is_featured, tags,
              categories (slug)
            )
          `)
          .eq('collection_id', collectionData.id)
          .order('sort_order');

        products = (data || []).map(item => {
          const p = item.products;
          return p ? {
            ...p,
            category_slug: p.categories?.slug || '',
            colors: extractColors(p.name, p.tags || [])
          } : null;
        }).filter(Boolean);

      } else {
        // OTROS
        const { data: allActive } = await supabase
          .from('products')
          .select(`
            id, name, slug, description, price, compare_price, is_active, is_featured, tags,
            categories (slug)
          `)
          .eq('is_active', true)
          .limit(100);

        // Filter out known collections (simplified logic)
        // Ideally we filter in DB but for now let's just show all active in 'Otros' or filter in JS
        // To keep it simple and robust, let's just return all active products for 'Otros' that aren't in the main collections if we had that list.
        // For now, just returning all active is fine or we can implement the exclusion logic if strict.
        products = (allActive || []).map(p => ({
          ...p,
          category_slug: p.categories?.slug || '',
          colors: extractColors(p.name, p.tags || [])
        }));
      }

      // Fetch Images
      if (products.length > 0) {
        const ids = products.map(p => p.id);
        const { data: images } = await supabase
          .from('product_images')
          .select('product_id, url')
          .in('product_id', ids)
          .eq('is_primary', true);

        const imgMap = new Map((images || []).map(i => [i.product_id, i.url]));
        products = products.map(p => ({ ...p, primary_image: imgMap.get(p.id) }));
      }

      // Fetch Reviews
      products = await fetchReviewsForProducts(products);

      return products;

    } catch (err) {
      console.error('Error fetching products:', err);
      return mockFor(slug);
    }
  }

  async function loadCollection(slug) {
    currentCollection = slug;
    setActiveTab(slug);
    const list = await fetchProductsByCollectionSlug(slug);
    sectionData.set(slug, list || []);
    applyFilters();
  }

  async function loadAllSections(initial) {
    const slugs = [COLLECTION_SLUGS.NUEVOS, COLLECTION_SLUGS.INVIERNO, COLLECTION_SLUGS.PRIMAVERA, COLLECTION_SLUGS.OTROS];
    await Promise.all(slugs.map(loadCollection));
    setActiveTab(initial);
    updateFilterCounts();
  }

  function initTabs() {
    els('.collection-link').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const slug = tab.dataset.tab;
        history.replaceState(null, '', `#${slug}`);
        const target = document.getElementById(slug);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveTab(slug);
        closeSidebarOnMobile();
      });
    });
    const hash = (location.hash || '').replace('#', '');
    const initial = [COLLECTION_SLUGS.NUEVOS, COLLECTION_SLUGS.INVIERNO, COLLECTION_SLUGS.PRIMAVERA, COLLECTION_SLUGS.OTROS].includes(hash) ? hash : COLLECTION_SLUGS.NUEVOS;
    const params = new URLSearchParams(location.search);
    const preCat = params.get('cat');
    const catRadio = el(`input[name="categoria"][value="${preCat}"]`);
    if (preCat && catRadio) catRadio.checked = true;
    loadAllSections(initial).then(() => { if (preCat) applyFilters(); });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          setActiveTab(id);
          history.replaceState(null, '', `#${id}`);
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0.01 });

    ['nuevos-llegados', 'invierno-otono', 'primavera-verano', 'otros'].forEach(id => {
      const sec = document.getElementById(id);
      if (sec) observer.observe(sec);
    });
  }

  function updateFilterCounts() {
    const allProducts = [];
    sectionData.forEach(products => allProducts.push(...products));

    const categoryCounts = {
      mujer: allProducts.filter(p => (p.category_slug || '').toLowerCase() === 'mujer').length,
      hombre: allProducts.filter(p => (p.category_slug || '').toLowerCase() === 'hombre').length,
      accesorios: allProducts.filter(p => (p.category_slug || '').toLowerCase() === 'accesorios').length
    };

    const colorCounts = {
      negro: allProducts.filter(p => (p.colors || []).includes('negro')).length,
      blanco: allProducts.filter(p => (p.colors || []).includes('blanco')).length,
      azul: allProducts.filter(p => (p.colors || []).includes('azul')).length,
      rojo: allProducts.filter(p => (p.colors || []).includes('rojo')).length,
      multicolor: allProducts.filter(p => (p.colors || []).includes('multicolor')).length
    };

    Object.entries(categoryCounts).forEach(([cat, count]) => {
      const countEl = el(`.category-option input[value="${cat}"] + .category-name .count`);
      if (countEl) countEl.textContent = count;
    });

    Object.entries(colorCounts).forEach(([color, count]) => {
      const countEl = el(`.color-option input[value="${color}"] + .color-swatch + .color-name .count`);
      if (countEl) countEl.textContent = count;
    });
  }

  function initSidebarToggle() {
    const sidebar = el('.productos-sidebar');
    const toggleBtn = el('.sidebar-toggle');
    const mobileFilterBtn = el('#mobileFilterBtn');
    const backdrop = el('#sidebarBackdrop');

    if (!sidebar || !toggleBtn) return;

    function toggleSidebar(forceClose = false) {
      if (forceClose) {
        sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('active');
        document.body.classList.remove('sidebar-open');
      } else {
        sidebar.classList.toggle('open');
        if (backdrop) backdrop.classList.toggle('active');
        document.body.classList.toggle('sidebar-open', sidebar.classList.contains('open'));
      }
      const isOpen = sidebar.classList.contains('open');
      localStorage.setItem('solare-sidebar-open', isOpen);
      if (window.innerWidth <= 768) document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    toggleBtn.addEventListener('click', () => toggleSidebar());
    if (mobileFilterBtn) {
      mobileFilterBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        if (backdrop) backdrop.classList.add('active');
        document.body.classList.add('sidebar-open');
        if (window.innerWidth <= 768) document.body.style.overflow = 'hidden';
        localStorage.setItem('solare-sidebar-open', true);
      });
    }
    if (backdrop) backdrop.addEventListener('click', () => toggleSidebar(true));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && window.innerWidth <= 768 && sidebar.classList.contains('open')) toggleSidebar(true);
    });

    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
      const currentWidth = window.innerWidth;
      if ((lastWidth <= 768 && currentWidth > 768) || (lastWidth > 768 && currentWidth <= 768)) {
        if (currentWidth > 768) {
          const savedState = localStorage.getItem('solare-sidebar-open');
          if (savedState === 'false') {
            sidebar.classList.remove('open');
            document.body.classList.remove('sidebar-open');
          } else {
            sidebar.classList.add('open');
            document.body.classList.add('sidebar-open');
          }
          if (backdrop) backdrop.classList.remove('active');
          document.body.style.overflow = '';
        } else {
          sidebar.classList.remove('open');
          if (backdrop) backdrop.classList.remove('active');
          document.body.classList.remove('sidebar-open');
          document.body.style.overflow = '';
        }
      }
      lastWidth = currentWidth;
    });

    if (window.innerWidth > 768) {
      const savedState = localStorage.getItem('solare-sidebar-open');
      if (savedState === 'false') {
        sidebar.classList.remove('open');
        document.body.classList.remove('sidebar-open');
      } else {
        sidebar.classList.add('open');
        document.body.classList.add('sidebar-open');
      }
    } else {
      sidebar.classList.remove('open');
      if (backdrop) backdrop.classList.remove('active');
      document.body.classList.remove('sidebar-open');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const searchInput = el('#search');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', () => {
        applyFilters();
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => closeSidebarOnMobile(), 1200);
      });
    }
    const sortSelect = el('#orden');
    if (sortSelect) sortSelect.addEventListener('change', () => { applyFilters(); closeSidebarOnMobile(); });
    els('input[name="categoria"]').forEach(radio => radio.addEventListener('change', () => { applyFilters(); closeSidebarOnMobile(); }));
    els('input[name="color"]').forEach(checkbox => checkbox.addEventListener('change', () => { applyFilters(); closeSidebarOnMobile(); }));
    initSidebarToggle();
    initTabs();
  });
})();
