// Utilidades compartidas

export const el = (selector) => document.querySelector(selector);
export const els = (selector) => document.querySelectorAll(selector);

export const formatCurrency = (value) => {
    try {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0,
        }).format(value);
    } catch (e) {
        return `$${value}`;
    }
};

export const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-AR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(date);
    } catch (e) {
        return dateString;
    }
};

export const showToast = (message, type = 'info') => {
    if (window.SolareToast) {
        if (type === 'success') window.SolareToast.success(message);
        else if (type === 'error') window.SolareToast.error(message);
        else window.SolareToast.info(message);
    } else {
        alert(message);
    }
};

export const generateSlug = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-')   // Replace multiple - with single -
        .replace(/^-+/, '')       // Trim - from start of text
        .replace(/-+$/, '');      // Trim - from end of text
};
