// Navbar JavaScript - Full Functionality (inject-safe)
function initNavbar() {
    // Get elements (must run AFTER navbar.html is injected)
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const closeBtn = document.getElementById('closeBtn');
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    const mainLinks = document.querySelectorAll('.mobile-nav-link.main-link');
    const cartCount = document.getElementById('cartCount');

    // Toggle mobile menu
    function toggleMobileMenu() {
        if (!hamburgerBtn || !mobileMenuOverlay) return;
        hamburgerBtn.classList.toggle('active');
        mobileMenuOverlay.classList.toggle('active');
        document.body.style.overflow = mobileMenuOverlay.classList.contains('active') ? 'hidden' : '';
    }

    // Close mobile menu
    function closeMobileMenu() {
        if (!hamburgerBtn || !mobileMenuOverlay) return;
        hamburgerBtn.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = '';
        // Close all submenus
        mobileNavItems.forEach(item => item.classList.remove('active'));
    }

    // Event listeners (guarded)
    if (hamburgerBtn) hamburgerBtn.addEventListener('click', toggleMobileMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMobileMenu);
    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', function(e) {
            if (e.target === mobileMenuOverlay) closeMobileMenu();
        });
    }

    // Handle submenu toggles
    mainLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const parentItem = this.closest('.mobile-nav-item');
            const hasSubmenu = parentItem && parentItem.querySelector('.mobile-submenu');
            if (hasSubmenu) {
                e.preventDefault();
                // Close other submenus
                mobileNavItems.forEach(item => { if (item !== parentItem) item.classList.remove('active'); });
                // Toggle current submenu
                parentItem.classList.toggle('active');
            }
        });
    });

    // Handle desktop dropdown hover effects
    const dropdownItems = document.querySelectorAll('.nav-item.dropdown');
    dropdownItems.forEach(item => {
        const dropdownContent = item.querySelector('.dropdown-content');
        if (dropdownContent) {
            item.addEventListener('mouseenter', function() {
                dropdownContent.style.opacity = '1';
                dropdownContent.style.visibility = 'visible';
            });
            item.addEventListener('mouseleave', function() {
                dropdownContent.style.opacity = '0';
                dropdownContent.style.visibility = 'hidden';
            });
        }
    });

    // Close mobile menu on window resize if desktop view
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && mobileMenuOverlay && mobileMenuOverlay.classList.contains('active')) {
            closeMobileMenu();
        }
    });

    // Handle escape key to close mobile menu
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileMenuOverlay && mobileMenuOverlay.classList.contains('active')) {
            closeMobileMenu();
        }
    });

    // Smooth scroll for anchor links (if any)
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href !== '#!') {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    closeMobileMenu();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

    // Cart badge updater (reads our stored cart object)
    function updateCartCount(count = 0) {
        if (cartCount) {
            cartCount.textContent = count;
            if (count > 0) cartCount.classList.add('show'); else cartCount.classList.remove('show');
        }
    }

    function readCartCountFromStorage() {
        try {
            const saved = localStorage.getItem('solare-cart');
            if (!saved) return 0;
            const parsed = JSON.parse(saved);
            const items = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.items) ? parsed.items : []);
            return items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
        } catch (e) {
            console.error('Error leyendo carrito:', e);
            return 0;
        }
    }

    // Initialize cart count now
    updateCartCount(readCartCountFromStorage());

    // Listen for cart updates (storage events)
    window.addEventListener('storage', function(e) {
        if (e.key === 'solare-cart') updateCartCount(readCartCountFromStorage());
    });

    // Add scroll shadow to navbar
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (navbar) navbar.style.boxShadow = scrollTop > 10 ? '0 2px 10px rgba(0, 0, 0, 0.1)' : 'none';
    });
}

// Fallback: if the script is included directly on a page with the navbar in-place,
// initialize on DOMContentLoaded as well.
document.addEventListener('DOMContentLoaded', () => {
    const navbarPresent = document.querySelector('.navbar');
    if (navbarPresent) {
        try { initNavbar(); } catch (e) { /* ignore */ }
    }
});

// Export for CommonJS if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initNavbar };
}
