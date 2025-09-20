// Navbar JavaScript - Full Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const closeBtn = document.getElementById('closeBtn');
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    const mainLinks = document.querySelectorAll('.mobile-nav-link.main-link');
    const cartCount = document.getElementById('cartCount');
    const cartIcon = document.querySelector('.cart-icon');

    // Toggle mobile menu
    function toggleMobileMenu() {
        hamburgerBtn.classList.toggle('active');
        mobileMenuOverlay.classList.toggle('active');
        document.body.style.overflow = mobileMenuOverlay.classList.contains('active') ? 'hidden' : '';
    }

    // Close mobile menu
    function closeMobileMenu() {
        hamburgerBtn.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = '';
        
        // Close all submenus
        mobileNavItems.forEach(item => {
            item.classList.remove('active');
        });
    }

    // Event listeners
    hamburgerBtn.addEventListener('click', toggleMobileMenu);
    closeBtn.addEventListener('click', closeMobileMenu);

    // Close menu when clicking overlay
    mobileMenuOverlay.addEventListener('click', function(e) {
        if (e.target === mobileMenuOverlay) {
            closeMobileMenu();
        }
    });

    // Handle submenu toggles
    mainLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const parentItem = this.closest('.mobile-nav-item');
            const hasSubmenu = parentItem.querySelector('.mobile-submenu');
            
            if (hasSubmenu) {
                // Close other submenus
                mobileNavItems.forEach(item => {
                    if (item !== parentItem) {
                        item.classList.remove('active');
                    }
                });
                
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
        if (window.innerWidth > 768 && mobileMenuOverlay.classList.contains('active')) {
            closeMobileMenu();
        }
    });

    // Handle escape key to close mobile menu
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileMenuOverlay.classList.contains('active')) {
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
                    closeMobileMenu(); // Close mobile menu if open
                    
                    // Smooth scroll to target
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Cart functionality
    function updateCartCount(count = 0) {
        if (cartCount) {
            cartCount.textContent = count;
            if (count > 0) {
                cartCount.classList.add('show');
            } else {
                cartCount.classList.remove('show');
            }
        }
    }

    // Initialize cart count from localStorage
    function initCart() {
        const savedCart = localStorage.getItem('solare-cart');
        if (savedCart) {
            try {
                const cart = JSON.parse(savedCart);
                const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
                updateCartCount(totalItems);
            } catch (e) {
                console.error('Error parsing cart data:', e);
            }
        }
    }

    // Cart click handler
    if (cartIcon) {
        cartIcon.addEventListener('click', function(e) {
            e.preventDefault();
            // TODO: Abrir modal del carrito o ir a página de carrito
            console.log('Carrito clicked');
            // Por ahora solo mostramos un alert
            alert('Funcionalidad del carrito próximamente');
        });
    }

    // Search functionality (for future implementation)
    function initSearch() {
        // TODO: Implementar búsqueda global
        const searchLinks = document.querySelectorAll('.mobile-icon-link');
        searchLinks.forEach(link => {
            if (link.textContent.includes('Search')) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    // TODO: Abrir modal de búsqueda
                    console.log('Search clicked');
                });
            }
        });
    }

    // Add scroll effect to navbar
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add shadow when scrolled
        if (scrollTop > 10) {
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.boxShadow = 'none';
        }
        
        lastScrollTop = scrollTop;
    });

    // Initialize all functionality
    initCart();
    initSearch();

    // Listen for cart updates from other pages
    window.addEventListener('storage', function(e) {
        if (e.key === 'solare-cart') {
            initCart();
        }
    });
});

// Initialize navbar functionality
function initNavbar() {
    // Add any additional initialization code here
    console.log('Navbar initialized successfully');
}

// Export for use in other files if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initNavbar };
}
