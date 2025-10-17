document.addEventListener('DOMContentLoaded', () => {
  // Cargar navbar y luego inicializar sus eventos
  fetch('../html/navbar.html')
    .then((res) => res.text())
    .then((html) => {
      const navbarContainer = document.getElementById('navbar');
      if (!navbarContainer) return;
      navbarContainer.innerHTML = html;
      // Cargar script del navbar y luego inicializarlo
      const ensureNavbarScript = () => new Promise((resolve, reject) => {
        if (window.initNavbar) return resolve();
        const existing = Array.from(document.scripts).find(s => (s.src || '').includes('../js/navbar.js'));
        if (existing) {
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', reject);
          if (existing.dataset.loaded === 'true' || existing.readyState === 'complete') return resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = '../js/navbar.js';
        script.defer = true;
        script.onload = () => { script.dataset.loaded = 'true'; resolve(); };
        script.onerror = reject;
        document.head.appendChild(script);
      });

      // Cargar favoritos_api para contador de favoritos
      const ensureFavsScript = () => new Promise((resolve, reject) => {
        if (window.SolareFavs) return resolve();
        const existing = Array.from(document.scripts).find(s => (s.src || '').includes('favoritos_api.js'));
        if (existing) {
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', reject);
          if (existing.dataset.loaded === 'true' || existing.readyState === 'complete') return resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = '../js/favoritos_api.js';
        script.defer = true;
        script.onload = () => { script.dataset.loaded = 'true'; resolve(); };
        script.onerror = reject;
        document.head.appendChild(script);
      });

      Promise.all([ensureNavbarScript(), ensureFavsScript()])
        .then(() => {
          if (typeof window.initNavbar === 'function') {
            window.initNavbar();
          }
          // Actualizar contadores si existen APIs
          try { window.SolareFavs?.updateNavbarFavCount?.(); } catch(e){}
          try {
            // Cart count se actualiza al cargar carrito.js; si no está, intentamos leer localStorage básico
            if (!document.querySelector('#cartCount')?.classList.contains('show')) {
              const saved = localStorage.getItem('solare-cart');
              if (saved) {
                const parsed = JSON.parse(saved);
                const items = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.items) ? parsed.items : []);
                const count = items.reduce((s, it) => s + (Number(it.quantity)||0), 0);
                const el = document.querySelector('#cartCount');
                if (el) { el.textContent = count; if (count>0) el.classList.add('show'); }
              }
            }
          } catch(e){}
        })
        .catch((err) => console.error('Error inicializando navbar:', err));
    })
    .catch((err) => console.error('Error cargando navbar:', err));

  // Cargar footer
  fetch('../html/footer.html')
    .then((res) => res.text())
    .then((html) => {
      const footerContainer = document.getElementById('footer');
      if (!footerContainer) return;
      footerContainer.innerHTML = html;
    })
    .catch((err) => console.error('Error cargando footer:', err));

  // Toggle clase 'scrolled' en body para estilos del navbar al hacer scroll
  const toggleScrolled = () => {
    if (window.scrollY > 20) {
      document.body.classList.add('scrolled');
    } else {
      document.body.classList.remove('scrolled');
    }
  };
  toggleScrolled();
  window.addEventListener('scroll', toggleScrolled, { passive: true });
});