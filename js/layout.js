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
        const existing = Array.from(document.scripts).find(s => (s.src || '').includes('./navbar.js'));
        if (existing) {
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', reject);
          if (existing.dataset.loaded === 'true' || existing.readyState === 'complete') return resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = './navbar.js';
        script.defer = true;
        script.onload = () => { script.dataset.loaded = 'true'; resolve(); };
        script.onerror = reject;
        document.head.appendChild(script);
      });

      ensureNavbarScript()
        .then(() => {
          if (typeof window.initNavbar === 'function') {
            window.initNavbar();
          }
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