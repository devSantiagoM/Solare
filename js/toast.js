// Sistema de Toast Reutilizable - Solare
(function() {
  'use strict';

  // Crear contenedor de toasts si no existe
  function getToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(container);
    }
    return container;
  }

  // Agregar estilos si no existen
  function ensureToastStyles() {
    if (document.getElementById('toast-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      #toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
      }

      .toast {
        background: #fff;
        color: #111;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1);
        min-width: 300px;
        max-width: 400px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        pointer-events: auto;
        animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border-left: 4px solid #111;
        font-family: 'Arial', sans-serif;
        font-size: 14px;
        line-height: 1.5;
      }

      .toast.toast-success {
        border-left-color: #10b981;
      }

      .toast.toast-error {
        border-left-color: #ef4444;
      }

      .toast.toast-info {
        border-left-color: #3b82f6;
      }

      .toast.toast-warning {
        border-left-color: #f59e0b;
      }

      .toast-content {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .toast-icon {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .toast-message {
        flex: 1;
      }

      .toast-close {
        background: none;
        border: none;
        color: #666;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      .toast-close:hover {
        background: rgba(0, 0, 0, 0.05);
        color: #111;
      }

      .toast-close:active {
        transform: scale(0.95);
      }

      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      .toast.removing {
        animation: slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }

      @media (max-width: 768px) {
        #toast-container {
          top: 16px;
          right: 16px;
          left: 16px;
        }

        .toast {
          min-width: auto;
          max-width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Iconos SVG para los toasts
  const icons = {
    success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
    info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
    warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`
  };

  // Función principal para mostrar toast
  function showToast(message, type = 'info', duration = 5000) {
    ensureToastStyles();
    const container = getToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    
    const icon = icons[type] || icons.info;
    
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Cerrar notificación" type="button">&times;</button>
    `;
    
    container.appendChild(toast);
    
    // Función para remover el toast
    const removeToast = () => {
      toast.classList.add('removing');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    };
    
    // Botón de cerrar
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', removeToast);
    
    // Auto-remover después de la duración
    if (duration > 0) {
      setTimeout(removeToast, duration);
    }
    
    return toast;
  }

  // API pública
  window.SolareToast = {
    show: showToast,
    success: (message, duration) => showToast(message, 'success', duration),
    error: (message, duration) => showToast(message, 'error', duration),
    info: (message, duration) => showToast(message, 'info', duration),
    warning: (message, duration) => showToast(message, 'warning', duration)
  };
})();

