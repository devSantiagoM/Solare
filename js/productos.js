// Productos con Supabase: colecciones, filtros, orden, búsqueda
(function(){
  const el = (sel, ctx=document) => ctx.querySelector(sel);
  const els = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

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

  // Dataset de respaldo por si falla Supabase (distribuido por colecciones)
  function mockFor(slug){
    const NUEVOS = [
      { id: 'n1', name: 'Blazer Estructurado', category_slug: 'mujer', price: 120.00, badge: 'Nuevo', image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=800&auto=format&fit=crop', colors: ['negro'] },
      { id: 'n2', name: 'Camisa Oxford', category_slug: 'hombre', price: 65.00, badge: 'Nuevo', image: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=800&auto=format&fit=crop', colors: ['blanco'] },
      { id: 'n3', name: 'Bandolera Minimal', category_slug: 'accesorios', price: 85.00, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop', colors: ['negro'] },
      { id: 'n4', name: 'Vestido Seda', category_slug: 'mujer', price: 160.00, image: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop', colors: ['azul'] },
      { id: 'n5', name: 'Zapatillas Urbanas', category_slug: 'hombre', price: 140.00, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop', colors: ['blanco'] },
    ];
    const INVIERNO = [
      { id: 'w1', name: 'Abrigo Lana', category_slug: 'mujer', price: 220.00, image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format&fit=crop', colors: ['negro'] },
      { id: 'w2', name: 'Campera de Cuero', category_slug: 'hombre', price: 290.00, badge: 'Ed. Limitada', image: 'https://images.unsplash.com/photo-1546146830-2cca9512c68e?q=80&w=800&auto=format&fit=crop', colors: ['negro'] },
      { id: 'w3', name: 'Bufanda de Cashmere', category_slug: 'accesorios', price: 70.00, image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=800&auto=format&fit=crop', colors: ['multicolor'] },
      { id: 'w4', name: 'Botas Explorador', category_slug: 'hombre', price: 180.00, image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop', colors: ['negro'] },
    ];
    const PRIMAVERA = [
      { id: 's1', name: 'Vestido Midi Floral', category_slug: 'mujer', price: 135.00, image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=800&auto=format&fit=crop', colors: ['multicolor'] },
      { id: 's2', name: 'Camisa Lino', category_slug: 'hombre', price: 85.00, image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop', colors: ['blanco'] },
      { id: 's3', name: 'Gafas Retro', category_slug: 'accesorios', price: 55.00, image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=800&auto=format&fit=crop', colors: ['negro'] },
      { id: 's4', name: 'Mocasines Piel', category_slug: 'hombre', price: 150.00, image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=800&auto=format&fit=crop', colors: ['negro'] },
    ];
    const OTROS = [
      { id: 'o1', name: 'Cinturón Cuero', category_slug: 'accesorios', price: 45.00, image: 'https://images.unsplash.com/photo-1582582429416-1bff1d50e414?q=80&w=800&auto=format&fit=crop', colors: ['negro'] },
      { id: 'o2', name: 'Pantalón Sastrero', category_slug: 'hombre', price: 90.00, image: 'https://images.unsplash.com/photo-1520974681267-5f57a9b0d69f?q=80&w=800&auto=format&fit=crop', colors: ['azul'] },
      { id: 'o3', name: 'Blusa Seda', category_slug: 'mujer', price: 130.00, image: 'https://images.unsplash.com/photo-1520975771659-058ddf660a55?q=80&w=800&auto=format&fit=crop', colors: ['rojo'] },
      { id: 'o4', name: 'Bandolera Urbana', category_slug: 'accesorios', price: 75.00, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800&auto=format&fit=crop', colors: ['negro'] },
    ];
    switch(slug){
      case COLLECTION_SLUGS.NUEVOS: return NUEVOS;
      case COLLECTION_SLUGS.INVIERNO: return INVIERNO;
      case COLLECTION_SLUGS.PRIMAVERA: return PRIMAVERA;
      default: return OTROS;
    }
  }

  let currentCollection = COLLECTION_SLUGS.NUEVOS;
  // Map de datos por sección: slug -> productos originales
  const sectionData = new Map();

  function setActiveTab(slug){
    els('.collection-link').forEach(a => a.classList.toggle('active', a.dataset.tab === slug));
  }

  // Función para determinar el badge basado en tags
  function getBadge(tags, isFeatured) {
    if (!Array.isArray(tags)) return '';
    const tagStr = tags.map(t => String(t).toLowerCase()).join(' ');
    if (tagStr.includes('nuevo')) return 'Nuevo';
    if (tagStr.includes('edicion-limitada') || tagStr.includes('ed. limitada')) return 'Ed. Limitada';
    if (isFeatured) return 'Destacado';
    return '';
  }

  function renderGridInto(containerId, emptyId, list){
    const grid = el(`#${containerId}`);
    const empty = el(`#${emptyId}`);
    if (!grid || !empty) return;
    grid.innerHTML = '';
    if (!list.length){ empty.hidden = false; return; }
    empty.hidden = true;
    const frag = document.createDocumentFragment();
    list.forEach(p => {
      const card = document.createElement('article');
      card.className = 'card';
      const imgUrl = p.primary_image || p.image || 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?q=80&w=800&auto=format&fit=crop';
      const rating = Math.random() * 2 + 3; // 3-5 rating
      const ratingCount = Math.floor(Math.random() * 50) + 1;
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
            <span class="rating-stars">(${rating.toFixed(1)})</span>
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
        // initial state
        try { if (window.SolareFavs?.isFav(p.id)) favBtn.classList.add('active'); } catch(e){}
        favBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.SolareFavs) {
            window.SolareFavs.toggle(p);
            favBtn.classList.toggle('active');
          }
        });
      }

      // Add event listener for add to cart button
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
    // Cerrar sidebar en móviles después de aplicar un filtro
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
        }, 200); // Pequeño delay para que el usuario vea el cambio
      }
    }
  }

  function applyFilters(){
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
      switch(order){
        case 'precio-asc': filtered.sort((a,b)=>Number(a.price||0)-Number(b.price||0)); break;
        case 'precio-desc': filtered.sort((a,b)=>Number(b.price||0)-Number(a.price||0)); break;
        case 'nombre-asc': filtered.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''))); break;
        case 'nombre-desc': filtered.sort((a,b)=>String(b.name||'').localeCompare(String(a.name||''))); break;
        default: break;
      }
      return filtered;
    };

    // Render por sección
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

  async function fetchProductsByCollectionSlug(slug){
    const supabase = window.supabase;
    if (!supabase){
      console.warn('Supabase no disponible, usando datos mock');
      return mockFor(slug);
    }
    try {
      // Para colecciones definidas
      if (slug !== COLLECTION_SLUGS.OTROS){
        // Primero obtener el ID de la colección
        const { data: collectionData, error: collError } = await supabase
          .from('collections')
          .select('id')
          .eq('slug', slug)
          .single();
        
        if (collError || !collectionData) {
          console.warn(`Collection not found: ${slug}`);
          return mockFor(slug);
        }
        
        // Obtener productos de la colección
        const { data, error } = await supabase
          .from('collection_products')
          .select(`
            product_id,
            sort_order,
            products (
              id,
              name,
              slug,
              description,
              price,
              compare_price,
              is_active,
              is_featured,
              tags,
              category_id,
              categories (
                slug
              )
            )
          `)
          .eq('collection_id', collectionData.id)
          .order('sort_order', { ascending: true });
        
        if (error) {
          console.error('Error fetching collection products:', error);
          throw error;
        }
        
        // Normalizar productos
        let products = (data || [])
          .map(item => {
            const product = item.products;
            if (!product) return null;
            
            // Extraer colores de tags o nombre del producto
            const tags = product.tags || [];
            const colors = extractColors(product.name, tags);
            
            return {
              id: product.id,
              name: product.name,
              slug: product.slug,
              description: product.description,
              price: product.price,
              compare_price: product.compare_price,
              is_active: product.is_active,
              is_featured: product.is_featured,
              tags: tags,
              colors: colors,
              category_slug: product.categories?.slug || '',
              sort_order: item.sort_order
            };
          })
          .filter(Boolean);
        
        // Obtener imágenes para estos productos
        if (products.length > 0) {
          const productIds = products.map(p => p.id);
          const { data: images, error: imgError } = await supabase
            .from('product_images')
            .select('product_id, url, is_primary')
            .in('product_id', productIds)
            .eq('is_primary', true);
          
          if (!imgError && images) {
            const imageMap = new Map(images.map(img => [img.product_id, img.url]));
            products = products.map(p => ({
              ...p,
              image: imageMap.get(p.id) || p.image,
              primary_image: imageMap.get(p.id) || p.image
            }));
          }
        }
        
        console.log(`Loaded ${products.length} products for collection: ${slug}`);
        return products.length ? products : mockFor(slug);
      }

      // OTROS: todo lo activo menos las 3 colecciones conocidas
      const { data: allActive, error: eAll } = await supabase
        .from('products')
        .select(`
          id,
          name,
          slug,
          description,
          price,
          compare_price,
          is_active,
          is_featured,
          tags,
          categories (
            slug
          )
        `)
        .eq('is_active', true)
        .limit(100);
        
      if (eAll) throw eAll;
      
      const { data: inKnown, error: eKnown } = await supabase
        .from('collection_products')
        .select('product_id, collections!inner(slug)')
        .in('collections.slug', [COLLECTION_SLUGS.NUEVOS, COLLECTION_SLUGS.INVIERNO, COLLECTION_SLUGS.PRIMAVERA]);
        
      if (eKnown) throw eKnown;
      
      const excludeIds = new Set((inKnown||[]).map(r => r.product_id));
      let others = (allActive||[])
        .filter(p => !excludeIds.has(p.id))
        .map(p => {
          const tags = p.tags || [];
          const colors = extractColors(p.name, tags);
          return {
            ...p,
            colors: colors,
            category_slug: p.categories?.slug || ''
          };
        });
      
      // Obtener imágenes
      if (others.length > 0) {
        const productIds = others.map(p => p.id);
        const { data: images, error: imgError } = await supabase
          .from('product_images')
          .select('product_id, url, is_primary')
          .in('product_id', productIds)
          .eq('is_primary', true);
        
        if (!imgError && images) {
          const imageMap = new Map(images.map(img => [img.product_id, img.url]));
          others = others.map(p => ({
            ...p,
            image: imageMap.get(p.id) || p.image,
            primary_image: imageMap.get(p.id) || p.image
          }));
        }
      }
      
      console.log(`Loaded ${others.length} products for "Otros"`);
      return others.length ? others : mockFor(slug);
    } catch(err){
      console.error('Error obteniendo productos de Supabase:', err);
      return mockFor(slug);
    }
  }

  async function loadCollection(slug){
    currentCollection = slug;
    setActiveTab(slug);
    const list = await fetchProductsByCollectionSlug(slug);
    sectionData.set(slug, list || []);
    applyFilters();
  }

  async function loadAllSections(initial){
    // Cargamos todas las secciones en paralelo
    const slugs = [COLLECTION_SLUGS.NUEVOS, COLLECTION_SLUGS.INVIERNO, COLLECTION_SLUGS.PRIMAVERA, COLLECTION_SLUGS.OTROS];
    await Promise.all(slugs.map(loadCollection));
    // Activar la tab inicial
    setActiveTab(initial);
    // Actualizar contadores de filtros
    updateFilterCounts();
  }

  function initTabs(){
    els('.collection-link').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const slug = tab.dataset.tab;
        history.replaceState(null, '', `#${slug}`);
        const target = document.getElementById(slug);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveTab(slug);
        // Cerrar sidebar en móviles después de seleccionar colección
        closeSidebarOnMobile();
      });
    });
    // Cargar desde el hash si existe
    const hash = (location.hash || '').replace('#','');
    const initial = [COLLECTION_SLUGS.NUEVOS, COLLECTION_SLUGS.INVIERNO, COLLECTION_SLUGS.PRIMAVERA, COLLECTION_SLUGS.OTROS].includes(hash) ? hash : COLLECTION_SLUGS.NUEVOS;
    // Preseleccionar categoría desde parámetros
    const params = new URLSearchParams(location.search);
    const preCat = params.get('cat');
    const catRadio = el(`input[name="categoria"][value="${preCat}"]`);
    if (preCat && catRadio) {
      catRadio.checked = true;
    }
    loadAllSections(initial).then(() => { if (preCat) applyFilters(); });

    // Observador para activar tab según scroll
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          setActiveTab(id);
          history.replaceState(null, '', `#${id}`);
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0.01 });

    ['nuevos-llegados','invierno-otono','primavera-verano','otros'].forEach(id => {
      const sec = document.getElementById(id);
      if (sec) observer.observe(sec);
    });
  }

  function updateFilterCounts() {
    // Obtener todos los productos de todas las secciones
    const allProducts = [];
    sectionData.forEach(products => allProducts.push(...products));
    
    // Actualizar contadores de categorías
    const categoryCounts = {
      mujer: allProducts.filter(p => (p.category_slug || '').toLowerCase() === 'mujer').length,
      hombre: allProducts.filter(p => (p.category_slug || '').toLowerCase() === 'hombre').length,
      accesorios: allProducts.filter(p => (p.category_slug || '').toLowerCase() === 'accesorios').length
    };
    
    // Actualizar contadores de colores
    const colorCounts = {
      negro: allProducts.filter(p => (p.colors || []).includes('negro')).length,
      blanco: allProducts.filter(p => (p.colors || []).includes('blanco')).length,
      azul: allProducts.filter(p => (p.colors || []).includes('azul')).length,
      rojo: allProducts.filter(p => (p.colors || []).includes('rojo')).length,
      multicolor: allProducts.filter(p => (p.colors || []).includes('multicolor')).length
    };
    
    // Actualizar DOM
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
      
      // Guardar estado en localStorage
      const isOpen = sidebar.classList.contains('open');
      localStorage.setItem('solare-sidebar-open', isOpen);
      
      // Prevenir scroll en body cuando sidebar está abierto en mobile
      if (window.innerWidth <= 768) {
        document.body.style.overflow = isOpen ? 'hidden' : '';
      }
    }
    
    toggleBtn.addEventListener('click', () => toggleSidebar());
    
    // Abrir sidebar desde el botón flotante móvil
    if (mobileFilterBtn) {
      mobileFilterBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        if (backdrop) backdrop.classList.add('active');
        document.body.classList.add('sidebar-open');
        if (window.innerWidth <= 768) {
          document.body.style.overflow = 'hidden';
        }
        localStorage.setItem('solare-sidebar-open', true);
      });
    }
    
    // Cerrar sidebar al hacer click en el backdrop
    if (backdrop) {
      backdrop.addEventListener('click', () => toggleSidebar(true));
    }
    
    // Cerrar sidebar en mobile al presionar ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && window.innerWidth <= 768 && sidebar.classList.contains('open')) {
        toggleSidebar(true);
      }
    });
    
    // Cerrar sidebar al cambiar a mobile y reabrir en desktop
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
      const currentWidth = window.innerWidth;
      
      // Si cambiamos de mobile a desktop o viceversa
      if ((lastWidth <= 768 && currentWidth > 768) || (lastWidth > 768 && currentWidth <= 768)) {
        // En desktop, restaurar estado guardado
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
          // En mobile, cerrar por defecto
          sidebar.classList.remove('open');
          if (backdrop) backdrop.classList.remove('active');
          document.body.classList.remove('sidebar-open');
          document.body.style.overflow = '';
        }
      }
      
      lastWidth = currentWidth;
    });
    
    // Configuración inicial
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
      // En mobile, cerrar por defecto
      sidebar.classList.remove('open');
      if (backdrop) backdrop.classList.remove('active');
      document.body.classList.remove('sidebar-open');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Eventos filtros
    const searchInput = el('#search');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', () => {
        applyFilters();
        // Debounce para cerrar el sidebar solo cuando el usuario termine de escribir
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          closeSidebarOnMobile();
        }, 1200); // Esperar 1.2s después de que el usuario deje de escribir para asegurar que terminó
      });
    }
    
    const sortSelect = el('#orden');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        applyFilters();
        closeSidebarOnMobile();
      });
    }
    
    // Filtros de categoría (radio buttons)
    els('input[name="categoria"]').forEach(radio => {
      radio.addEventListener('change', () => {
        applyFilters();
        closeSidebarOnMobile();
      });
    });
    
    // Filtros de color (checkboxes)
    els('input[name="color"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        applyFilters();
        closeSidebarOnMobile();
      });
    });
    
    initSidebarToggle();
    initTabs();
  });
})();
