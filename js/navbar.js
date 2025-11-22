// Navbar JavaScript - Migrated to State Manager
function initNavbar() {
    // Get elements (must run AFTER navbar is in DOM)
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const closeBtn = document.getElementById('closeBtn');
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    const mainLinks = document.querySelectorAll('.mobile-nav-link.main-link');
    const cartCount = document.getElementById('cartCount');
    const favCount = document.getElementById('favCount');

    // ========================================================================
    // MOBILE MENU
    // ========================================================================

    function toggleMobileMenu() {
        if (!hamburgerBtn || !mobileMenuOverlay) return;
        hamburgerBtn.classList.toggle('active');
        mobileMenuOverlay.classList.toggle('active');
        document.body.style.overflow = mobileMenuOverlay.classList.contains('active') ? 'hidden' : '';
    }

    function closeMobileMenu() {
        if (!hamburgerBtn || !mobileMenuOverlay) return;
        hamburgerBtn.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = '';
        mobileNavItems.forEach(item => item.classList.remove('active'));
    }

    // Event listeners
    if (hamburgerBtn) hamburgerBtn.addEventListener('click', toggleMobileMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMobileMenu);
    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', function (e) {
            if (e.target === mobileMenuOverlay) closeMobileMenu();
        });
    }

    // Handle submenu toggles
    mainLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const parentItem = this.closest('.mobile-nav-item');
            const hasSubmenu = parentItem && parentItem.querySelector('.mobile-submenu');
            if (hasSubmenu) {
                e.preventDefault();
                mobileNavItems.forEach(item => { if (item !== parentItem) item.classList.remove('active'); });
                parentItem.classList.toggle('active');
            }
        });
    });

    // Close mobile menu on desktop resize
    window.addEventListener('resize', function () {
        if (window.innerWidth > 768 && mobileMenuOverlay && mobileMenuOverlay.classList.contains('active')) {
            closeMobileMenu();
        }
    });

    // Close on escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && mobileMenuOverlay && mobileMenuOverlay.classList.contains('active')) {
            closeMobileMenu();
        }
    });

    // ========================================================================
    // DESKTOP DROPDOWNS
    // ========================================================================

    const dropdownItems = document.querySelectorAll('.nav-item.dropdown');
    dropdownItems.forEach(item => {
        const dropdownContent = item.querySelector('.dropdown-content');
        if (dropdownContent) {
            item.addEventListener('mouseenter', function () {
                dropdownContent.style.opacity = '1';
                dropdownContent.style.visibility = 'visible';
            });
            item.addEventListener('mouseleave', function () {
                dropdownContent.style.opacity = '0';
                dropdownContent.style.visibility = 'hidden';
            });
        }
    });

    // ========================================================================
    // SMOOTH SCROLL
    // ========================================================================

    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function (e) {
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

    // ========================================================================
    // ACTIVE LINK HIGHLIGHTING
    // ========================================================================

    function highlightActiveLink() {
        const currentPath = window.location.pathname;
        const pageName = currentPath.split('/').pop() || 'index.html';

        const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;

            // Check exact match or if it's the home page
            if (href === pageName || (pageName === 'index.html' && (href === './' || href === '/' || href === 'index.html'))) {
                link.classList.add('active');
                // Also highlight parent if it's a dropdown item (optional, but good for UX)
                const parentDropdown = link.closest('.dropdown');
                if (parentDropdown) {
                    const parentLink = parentDropdown.querySelector('.nav-link');
                    if (parentLink) parentLink.classList.add('active');
                }
            } else {
                link.classList.remove('active');
            }
        });
    }

    highlightActiveLink();

    // ========================================================================
    // BADGE COUNTERS - Using State Manager
    // ========================================================================

    function updateCartBadge(count) {
        if (!cartCount) return;
        cartCount.textContent = count;
        if (count > 0) cartCount.classList.add('show');
        else cartCount.classList.remove('show');
    }

    function updateFavBadge(count) {
        if (!favCount) return;
        favCount.textContent = count;
        if (count > 0) favCount.classList.add('show');
        else favCount.classList.remove('show');
    }

    // Wait for State Manager to be ready
    function initBadges() {
        if (!window.SolareState) {
            setTimeout(initBadges, 100);
            return;
        }

        // Initialize from current state
        const cartItems = window.SolareState.cart.getItems();
        const favItems = window.SolareState.favorites.getAll();
        updateCartBadge(cartItems.reduce((sum, item) => sum + item.quantity, 0));
        updateFavBadge(favItems.length);

        // Listen for changes
        window.SolareState.on('cart:changed', ({ items }) => {
            const count = items.reduce((sum, item) => sum + item.quantity, 0);
            updateCartBadge(count);
        });

        window.SolareState.on('favorites:changed', ({ favorites }) => {
            updateFavBadge(favorites.length);
        });
    }

    initBadges();

    // ========================================================================
    // SCROLL SHADOW
    // ========================================================================

    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function () {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (navbar) navbar.style.boxShadow = scrollTop > 10 ? '0 2px 10px rgba(0, 0, 0, 0.1)' : 'none';
    });
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const navbarPresent = document.querySelector('.navbar');
    if (navbarPresent) {
        try { initNavbar(); } catch (e) { console.error('Navbar init error:', e); }
    }
});

// Export for CommonJS if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initNavbar };
}
