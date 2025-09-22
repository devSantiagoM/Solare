// Novedades Page Functionality - Solare
(function() {
  'use strict';

  // Utility functions
  const el = (selector, context = document) => context.querySelector(selector);
  const els = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  // News data
  const newsData = [
    {
      id: 1,
      title: 'Lanzamiento Colección Primavera 2024',
      excerpt: 'Descubre nuestra nueva línea de prendas frescas y elegantes para la temporada primaveral.',
      category: 'coleccion',
      date: '2024-01-20',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop',
      badge: 'Nuevo',
      featured: false
    },
    {
      id: 2,
      title: 'Tendencias Minimalistas en Auge',
      excerpt: 'El minimalismo se consolida como una de las tendencias más fuertes del año.',
      category: 'tendencias',
      date: '2024-01-18',
      image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=800&auto=format&fit=crop',
      badge: '',
      featured: false
    },
    {
      id: 3,
      title: 'Desfile Solare en Fashion Week',
      excerpt: 'Revive los mejores momentos de nuestra participación en la semana de la moda.',
      category: 'eventos',
      date: '2024-01-16',
      image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=800&auto=format&fit=crop',
      badge: 'Destacado',
      featured: false
    },
    {
      id: 4,
      title: 'Materiales Eco-Friendly en Nuestras Prendas',
      excerpt: 'Conoce nuestro compromiso con la sostenibilidad y los materiales responsables.',
      category: 'sostenibilidad',
      date: '2024-01-14',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop',
      badge: '',
      featured: false
    },
    {
      id: 5,
      title: 'Colaboración con Artistas Locales',
      excerpt: 'Una colección única creada en colaboración con talentosos artistas de nuestra región.',
      category: 'coleccion',
      date: '2024-01-12',
      image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=800&auto=format&fit=crop',
      badge: 'Edición Limitada',
      featured: false
    },
    {
      id: 6,
      title: 'Guía de Estilo: Looks de Oficina',
      excerpt: 'Tips y consejos para crear outfits profesionales sin perder el estilo personal.',
      category: 'tendencias',
      date: '2024-01-10',
      image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=800&auto=format&fit=crop',
      badge: '',
      featured: false
    },
    {
      id: 7,
      title: 'Proceso de Producción Responsable',
      excerpt: 'Transparencia total en nuestros procesos de fabricación y cadena de suministro.',
      category: 'sostenibilidad',
      date: '2024-01-08',
      image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=800&auto=format&fit=crop',
      badge: '',
      featured: false
    },
    {
      id: 8,
      title: 'Pop-up Store en el Centro de la Ciudad',
      excerpt: 'Visítanos en nuestra tienda temporal con experiencias exclusivas y productos únicos.',
      category: 'eventos',
      date: '2024-01-06',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop',
      badge: 'Evento',
      featured: false
    }
  ];

  // Social media posts data
  const socialPosts = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop',
      likes: 1247,
      comments: 89
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=400&auto=format&fit=crop',
      likes: 892,
      comments: 56
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=400&auto=format&fit=crop',
      likes: 2103,
      comments: 134
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=400&auto=format&fit=crop',
      likes: 756,
      comments: 42
    },
    {
      id: 5,
      image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=400&auto=format&fit=crop',
      likes: 1456,
      comments: 78
    },
    {
      id: 6,
      image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=400&auto=format&fit=crop',
      likes: 934,
      comments: 67
    }
  ];

  // State
  let currentFilter = 'all';
  let displayedArticles = 6;
  let filteredNews = [...newsData];

  // DOM elements
  let elements = {};

  // Initialize
  function init() {
    // Cache DOM elements
    elements = {
      newsGrid: el('#newsGrid'),
      categoryFilters: els('.category-filter'),
      loadMoreBtn: el('#loadMoreBtn'),
      newsletterForm: el('#newsletterForm'),
      socialGrid: el('#socialGrid'),
      articleTemplate: el('#article-template'),
      socialPostTemplate: el('#social-post-template')
    };

    // Bind events
    bindEvents();

    // Initial render
    renderNews();
    renderSocialPosts();

    // Initialize animations
    initScrollAnimations();
  }

  // Bind event listeners
  function bindEvents() {
    // Category filters
    elements.categoryFilters.forEach(filter => {
      filter.addEventListener('click', () => {
        const category = filter.dataset.category;
        setActiveFilter(category);
        filterNews(category);
      });
    });

    // Load more button
    if (elements.loadMoreBtn) {
      elements.loadMoreBtn.addEventListener('click', loadMoreArticles);
    }

    // Newsletter form
    if (elements.newsletterForm) {
      elements.newsletterForm.addEventListener('submit', handleNewsletterSubmit);
    }
  }

  // Set active filter
  function setActiveFilter(category) {
    elements.categoryFilters.forEach(filter => {
      filter.classList.toggle('active', filter.dataset.category === category);
    });
    currentFilter = category;
  }

  // Filter news by category
  function filterNews(category) {
    if (category === 'all') {
      filteredNews = [...newsData];
    } else {
      filteredNews = newsData.filter(article => article.category === category);
    }
    
    displayedArticles = 6;
    renderNews();
    updateLoadMoreButton();
  }

  // Render news articles
  function renderNews() {
    if (!elements.newsGrid || !elements.articleTemplate) return;

    elements.newsGrid.innerHTML = '';
    
    const articlesToShow = filteredNews.slice(0, displayedArticles);
    
    articlesToShow.forEach(article => {
      const articleElement = createArticleElement(article);
      elements.newsGrid.appendChild(articleElement);
    });

    // Trigger animations
    setTimeout(() => {
      const articles = els('.news-article', elements.newsGrid);
      articles.forEach((article, index) => {
        setTimeout(() => {
          article.style.opacity = '1';
          article.style.transform = 'translateY(0)';
        }, index * 100);
      });
    }, 50);
  }

  // Create article element
  function createArticleElement(article) {
    const template = elements.articleTemplate.content.cloneNode(true);
    const articleElement = template.querySelector('.news-article');
    
    // Set data attributes
    articleElement.dataset.category = article.category;
    
    // Set content
    const img = template.querySelector('.article-image img');
    const badge = template.querySelector('.article-badge');
    const category = template.querySelector('.article-category');
    const date = template.querySelector('.article-date');
    const title = template.querySelector('.article-title');
    const excerpt = template.querySelector('.article-excerpt');
    const link = template.querySelector('.article-link');
    
    if (img) {
      img.src = article.image;
      img.alt = article.title;
    }
    
    if (badge) {
      if (article.badge) {
        badge.textContent = article.badge;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
    }
    
    if (category) category.textContent = getCategoryName(article.category);
    if (date) {
      date.textContent = formatDate(article.date);
      date.setAttribute('datetime', article.date);
    }
    if (title) title.textContent = article.title;
    if (excerpt) excerpt.textContent = article.excerpt;
    
    // Add click handler
    if (link) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openArticle(article);
      });
    }

    // Set initial animation state
    articleElement.style.opacity = '0';
    articleElement.style.transform = 'translateY(30px)';
    articleElement.style.transition = 'all 0.6s ease';

    return articleElement;
  }

  // Get category display name
  function getCategoryName(category) {
    const categoryNames = {
      'coleccion': 'Colección',
      'tendencias': 'Tendencias',
      'eventos': 'Eventos',
      'sostenibilidad': 'Sostenibilidad'
    };
    return categoryNames[category] || category;
  }

  // Format date
  function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
  }

  // Load more articles
  function loadMoreArticles() {
    displayedArticles += 6;
    renderNews();
    updateLoadMoreButton();
    
    // Add loading animation
    elements.loadMoreBtn.classList.add('loading');
    setTimeout(() => {
      elements.loadMoreBtn.classList.remove('loading');
    }, 1000);
  }

  // Update load more button
  function updateLoadMoreButton() {
    if (!elements.loadMoreBtn) return;
    
    if (displayedArticles >= filteredNews.length) {
      elements.loadMoreBtn.style.display = 'none';
    } else {
      elements.loadMoreBtn.style.display = 'inline-block';
      elements.loadMoreBtn.textContent = `Cargar Más Artículos (${filteredNews.length - displayedArticles} restantes)`;
    }
  }

  // Open article (simulate)
  function openArticle(article) {
    // In a real application, this would navigate to the full article
    alert(`Abriendo artículo: "${article.title}"\n\nEn una aplicación real, esto navegaría a la página completa del artículo.`);
  }

  // Handle newsletter submit
  function handleNewsletterSubmit(e) {
    e.preventDefault();
    
    const emailInput = el('#email');
    const email = emailInput.value.trim();
    
    if (!email) {
      showNotification('Por favor ingresa tu email', 'error');
      return;
    }
    
    if (!isValidEmail(email)) {
      showNotification('Por favor ingresa un email válido', 'error');
      return;
    }
    
    // Simulate API call
    const submitBtn = el('.btn-newsletter');
    const originalText = submitBtn.textContent;
    
    submitBtn.textContent = 'Suscribiendo...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
      showNotification('¡Gracias por suscribirte! Recibirás nuestras novedades pronto.', 'success');
      emailInput.value = '';
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }, 2000);
  }

  // Validate email
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Render social media posts
  function renderSocialPosts() {
    if (!elements.socialGrid || !elements.socialPostTemplate) return;

    elements.socialGrid.innerHTML = '';
    
    socialPosts.forEach(post => {
      const postElement = createSocialPostElement(post);
      elements.socialGrid.appendChild(postElement);
    });
  }

  // Create social post element
  function createSocialPostElement(post) {
    const template = elements.socialPostTemplate.content.cloneNode(true);
    const postElement = template.querySelector('.social-post');
    
    // Set content
    const img = template.querySelector('.social-image img');
    const likesCount = template.querySelector('.likes-count');
    const commentsCount = template.querySelector('.comments-count');
    
    if (img) {
      img.src = post.image;
      img.alt = `Social post ${post.id}`;
    }
    
    if (likesCount) likesCount.textContent = formatNumber(post.likes);
    if (commentsCount) commentsCount.textContent = formatNumber(post.comments);
    
    // Add click handler
    postElement.addEventListener('click', () => {
      // In a real app, this would open Instagram
      window.open('#', '_blank');
    });

    return postElement;
  }

  // Format numbers (1247 -> 1.2K)
  function formatNumber(num) {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  // Initialize scroll animations
  function initScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = els('.featured-article, .newsletter-section, .social-feed');
    animateElements.forEach(el => observer.observe(el));
  }

  // Show notification
  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span>${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;

    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 16px 20px;
      border-radius: 6px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideInRight 0.3s ease;
      max-width: 350px;
    `;

    // Add animation styles if not already added
    if (!document.querySelector('#notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .notification-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .notification-close {
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);

    // Close button
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => notification.remove());
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
