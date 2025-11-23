import { el, els, showToast } from './utils.js';
import { state } from './state.js';
import * as Dashboard from './dashboard.js';
import * as Products from './products.js';
import * as Orders from './orders.js';
import * as Users from './users.js';
import * as Categories from './categories.js';
import * as Collections from './collections.js';
import * as Coupons from './coupons.js';
import * as Reviews from './reviews.js';
import * as Messages from './messages.js';
import * as FAQ from './faq.js';
import * as Settings from './settings.js';

// Expose global actions to window.admin
window.admin = {
    ...window.admin, // Preserve existing if any
    editProduct: Products.editProduct,
    deleteProduct: Products.deleteProduct,
    viewOrder: Orders.viewOrder,
    editUser: Users.editUser,
    editCategory: Categories.editCategory,
    deleteCategory: Categories.deleteCategory,
    editCollection: Collections.editCollection,
    deleteCollection: Collections.deleteCollection,
    editCoupon: Coupons.editCoupon,
    deleteCoupon: Coupons.deleteCoupon,
    approveReview: Reviews.approveReview,
    rejectReview: Reviews.rejectReview,
    deleteReview: Reviews.deleteReview,
    viewMessage: Messages.viewMessage,
    editFaqCategory: FAQ.editFaqCategory,
    deleteFaqCategory: FAQ.deleteFaqCategory,
    editFaq: FAQ.editFaq,
    deleteFaq: FAQ.deleteFaq,
};

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
        window.location.href = '../html/login.html';
        return;
    }

    // Check admin role
    const { data: profile } = await window.supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (profile?.role !== 'admin' && profile?.role !== 'staff') {
        window.location.href = '../html/index.html';
        return;
    }

    state.currentUser = session.user;
    updateUserInterface(session.user);

    // Initialize all modules
    await Dashboard.init();
    await Products.init();
    await Orders.init();
    await Users.init();
    await Categories.init();
    await Collections.init();
    await Coupons.init();
    await Reviews.init();
    await Messages.init();
    await FAQ.init();
    await Settings.init();

    // Setup Navigation
    setupNavigation();

    // Load initial section (Dashboard)
    loadSection('dashboard');

    // Global buttons
    const btnGoHome = el('#btn-admin-home'); // Fixed ID
    const btnLogout = el('#btn-admin-logout'); // Fixed ID

    if (btnGoHome) {
        btnGoHome.addEventListener('click', () => {
            window.location.href = '../html/index.html'; // Go up one level
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            try {
                await window.supabase.auth.signOut();
                window.location.href = '../html/login.html'; // Go up one level
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
                showToast('Error al cerrar sesión', 'error');
            }
        });
    }
});

function updateUserInterface(user) {
    const adminEmailEl = el('#admin-user-email'); // Fixed ID
    // Role is static for now or fetched separately

    if (adminEmailEl) adminEmailEl.textContent = user.email;
}

function setupNavigation() {
    const navLinks = els('.admin-nav-btn'); // Fixed class
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            if (section) {
                loadSection(section);
                // Update active link
                navLinks.forEach(l => l.classList.remove('admin-nav-btn-active')); // Fixed class
                link.classList.add('admin-nav-btn-active'); // Fixed class
            }
        });
    });
}

async function loadSection(sectionName) {
    state.currentSection = sectionName;

    // Hide all sections
    const sections = els('.admin-section');
    sections.forEach(sec => {
        sec.hidden = true; // Use hidden attribute
        sec.style.display = 'none';
    });

    // Show selected section
    const activeSection = el(`section[data-admin-section="${sectionName}"]`); // Fixed selector
    if (activeSection) {
        activeSection.hidden = false;
        activeSection.style.display = 'block';
    }

    // Load data for the section
    switch (sectionName) {
        case 'dashboard':
            await Dashboard.loadDashboard();
            break;
        case 'products':
            await Products.loadProducts();
            break;
        case 'orders':
            await Orders.loadOrders();
            break;
        case 'users':
            await Users.loadUsers();
            break;
        case 'categories':
            await Categories.loadCategories();
            break;
        case 'collections':
            await Collections.loadCollections();
            break;
        case 'coupons':
            await Coupons.loadCoupons();
            break;
        case 'reviews':
            await Reviews.loadReviews();
            break;
        case 'messages':
            await Messages.loadMessages();
            break;
        case 'faq':
            await FAQ.loadFAQs();
            break;
        case 'settings':
            await Settings.loadSettings();
            break;
    }
}
