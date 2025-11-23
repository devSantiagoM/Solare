import { el, showToast, generateSlug } from './utils.js';
import { state } from './state.js';

export async function init() {
    // Modal de Categoría FAQ
    const faqCategoryModal = el('#faq-category-modal');
    const faqCategoryForm = el('#faq-category-form');
    const btnAddFaqCategory = el('#btn-add-faq-category');
    const btnCloseFaqCategoryModal = el('#btn-close-faq-category-modal');
    const btnCancelFaqCategory = el('#btn-cancel-faq-category');

    if (btnAddFaqCategory) {
        btnAddFaqCategory.addEventListener('click', () => {
            state.editingFaqCategoryId = null;
            openFaqCategoryModal();
        });
    }

    if (btnCloseFaqCategoryModal) btnCloseFaqCategoryModal.addEventListener('click', closeFaqCategoryModal);
    if (btnCancelFaqCategory) btnCancelFaqCategory.addEventListener('click', closeFaqCategoryModal);

    if (faqCategoryForm) {
        faqCategoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = faqCategoryForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Guardando...';

            try {
                const formData = new FormData(faqCategoryForm);
                const data = {
                    name: formData.get('name'),
                    slug: formData.get('slug') || generateSlug(formData.get('name')),
                    is_active: formData.get('is_active') === 'on'
                };

                let error;
                if (state.editingFaqCategoryId) {
                    ({ error } = await window.supabase
                        .from('faq_categories')
                        .update(data)
                        .eq('id', state.editingFaqCategoryId));
                } else {
                    ({ error } = await window.supabase
                        .from('faq_categories')
                        .insert([data]));
                }

                if (error) throw error;

                showToast(state.editingFaqCategoryId ? 'Categoría actualizada' : 'Categoría creada', 'success');
                closeFaqCategoryModal();
                await loadFaqCategories();
                await loadFAQs();

            } catch (err) {
                console.error('Error guardando categoría FAQ:', err);
                showToast('Error al guardar: ' + err.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    // Modal de FAQ (Pregunta)
    const faqModal = el('#faq-modal');
    const faqForm = el('#faq-form');
    const btnAddFaq = el('#btn-add-faq');
    const btnCloseFaqModal = el('#btn-close-faq-modal');
    const btnCancelFaq = el('#btn-cancel-faq');

    if (btnAddFaq) {
        btnAddFaq.addEventListener('click', () => {
            state.editingFaqId = null;
            openFaqModal();
        });
    }

    if (btnCloseFaqModal) btnCloseFaqModal.addEventListener('click', closeFaqModal);
    if (btnCancelFaq) btnCancelFaq.addEventListener('click', closeFaqModal);

    if (faqForm) {
        faqForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = faqForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Guardando...';

            try {
                const formData = new FormData(faqForm);
                const data = {
                    question: formData.get('question'),
                    answer: formData.get('answer'),
                    category_id: formData.get('category_id') || null,
                    is_active: formData.get('is_active') === 'on'
                };

                let error;
                if (state.editingFaqId) {
                    ({ error } = await window.supabase
                        .from('faqs')
                        .update(data)
                        .eq('id', state.editingFaqId));
                } else {
                    ({ error } = await window.supabase
                        .from('faqs')
                        .insert([data]));
                }

                if (error) throw error;

                showToast(state.editingFaqId ? 'Pregunta actualizada' : 'Pregunta creada', 'success');
                closeFaqModal();
                await loadFAQs();

            } catch (err) {
                console.error('Error guardando FAQ:', err);
                showToast('Error al guardar: ' + err.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
}

export async function loadFaqCategories() {
    const container = el('#faq-categories-list');
    if (!container) return;

    try {
        container.innerHTML = '<p class="admin-loading">Cargando categorías...</p>';

        const { data: categories, error } = await window.supabase
            .from('faq_categories')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) throw error;

        if (!categories || categories.length === 0) {
            container.innerHTML = '<p class="admin-empty-state">No hay categorías</p>';
            return;
        }

        container.innerHTML = categories.map(cat => `
      <div class="admin-list-item">
        <div class="admin-list-item-content">
          <strong>${cat.name}</strong>
          <small>${cat.slug}</small>
        </div>
        <div class="admin-list-item-actions">
          <button class="admin-action-btn admin-action-btn-edit" onclick="admin.editFaqCategory('${cat.id}')" title="Editar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="admin-action-btn admin-action-btn-delete" onclick="admin.deleteFaqCategory('${cat.id}')" title="Eliminar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `).join('');
    } catch (error) {
        console.error('Error cargando categorías FAQ:', error);
        container.innerHTML = '<p class="admin-error">Error al cargar categorías</p>';
    }
}

export async function loadFAQs() {
    const container = el('#faqs-list');
    const countEl = el('#faqs-count');
    if (!container) return;

    // Cargar categorías primero para el filtro/display
    await loadFaqCategories();

    try {
        container.innerHTML = '<p class="admin-loading">Cargando preguntas...</p>';

        const { data: faqs, error } = await window.supabase
            .from('faqs')
            .select(`
        *,
        faq_categories (name)
      `)
            .order('sort_order', { ascending: true });

        if (error) throw error;

        if (!faqs || faqs.length === 0) {
            container.innerHTML = '<p class="admin-empty-state">No hay preguntas frecuentes</p>';
            if (countEl) countEl.textContent = '0 preguntas';
            return;
        }

        container.innerHTML = faqs.map(faq => {
            const categoryName = faq.faq_categories?.name || 'Sin categoría';
            const statusClass = faq.is_active ? 'admin-badge-active' : 'admin-badge-inactive';

            return `
        <div class="admin-faq-item">
          <div class="admin-faq-header">
            <div class="admin-faq-title">
              <strong>${faq.question}</strong>
              <span class="admin-badge ${statusClass}">${faq.is_active ? 'Activa' : 'Inactiva'}</span>
            </div>
            <div class="admin-faq-actions">
              <button class="admin-action-btn admin-action-btn-edit" onclick="admin.editFaq('${faq.id}')" title="Editar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="admin-action-btn admin-action-btn-delete" onclick="admin.deleteFaq('${faq.id}')" title="Eliminar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
          <div class="admin-faq-meta">
            <span>Categoría: ${categoryName}</span>
          </div>
          <div class="admin-faq-body">
            ${faq.answer}
          </div>
        </div>
      `;
        }).join('');

        if (countEl) countEl.textContent = `${faqs.length} pregunta${faqs.length !== 1 ? 's' : ''}`;
    } catch (error) {
        console.error('Error cargando FAQs:', error);
        container.innerHTML = '<p class="admin-error">Error al cargar preguntas</p>';
    }
}

function openFaqCategoryModal(categoryId = null) {
    state.editingFaqCategoryId = categoryId;
    const title = el('#faq-category-modal-title');
    const faqCategoryModal = el('#faq-category-modal');
    const faqCategoryForm = el('#faq-category-form');

    if (title) title.textContent = categoryId ? 'Editar Categoría FAQ' : 'Nueva Categoría FAQ';

    if (faqCategoryModal) {
        faqCategoryModal.hidden = false;
        if (!categoryId && faqCategoryForm) {
            faqCategoryForm.reset();
            if (el('#faq-category-is-active')) el('#faq-category-is-active').checked = true;
        }
    }
}

function closeFaqCategoryModal() {
    const faqCategoryModal = el('#faq-category-modal');
    const faqCategoryForm = el('#faq-category-form');
    if (faqCategoryModal) faqCategoryModal.hidden = true;
    state.editingFaqCategoryId = null;
    if (faqCategoryForm) faqCategoryForm.reset();
}

async function openFaqModal(faqId = null) {
    state.editingFaqId = faqId;
    const title = el('#faq-modal-title');
    const faqModal = el('#faq-modal');
    const faqForm = el('#faq-form');

    if (title) title.textContent = faqId ? 'Editar Pregunta' : 'Nueva Pregunta';

    // Cargar categorías en el select
    const categorySelect = el('#faq-category');
    if (categorySelect) {
        try {
            const { data: categories } = await window.supabase
                .from('faq_categories')
                .select('id, name')
                .eq('is_active', true)
                .order('name');

            categorySelect.innerHTML = '<option value="">Sin categoría</option>' +
                (categories || []).map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        } catch (e) {
            console.error('Error cargando categorías para select:', e);
        }
    }

    if (faqModal) {
        faqModal.hidden = false;
        if (faqId) {
            try {
                const { data: faq, error } = await window.supabase
                    .from('faqs')
                    .select('*')
                    .eq('id', faqId)
                    .single();

                if (error) throw error;

                if (el('#faq-question')) el('#faq-question').value = faq.question;
                if (el('#faq-answer')) el('#faq-answer').value = faq.answer;
                if (el('#faq-category')) el('#faq-category').value = faq.category_id || '';
                if (el('#faq-is-active')) el('#faq-is-active').checked = faq.is_active;

            } catch (error) {
                console.error('Error cargando FAQ:', error);
                showToast('Error al cargar la pregunta', 'error');
            }
        } else {
            if (faqForm) faqForm.reset();
            if (el('#faq-is-active')) el('#faq-is-active').checked = true;
        }
    }
}

function closeFaqModal() {
    const faqModal = el('#faq-modal');
    const faqForm = el('#faq-form');
    if (faqModal) faqModal.hidden = true;
    state.editingFaqId = null;
    if (faqForm) faqForm.reset();
}

// Global actions
export async function editFaqCategory(id) {
    try {
        const { data: cat, error } = await window.supabase
            .from('faq_categories')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        openFaqCategoryModal(id);
        if (el('#faq-category-name')) el('#faq-category-name').value = cat.name;
        if (el('#faq-category-slug')) el('#faq-category-slug').value = cat.slug;
        if (el('#faq-category-is-active')) el('#faq-category-is-active').checked = cat.is_active;

    } catch (e) {
        console.error('Error cargando categoría:', e);
        showToast('Error al cargar categoría', 'error');
    }
}

export async function deleteFaqCategory(id) {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;

    try {
        const { error } = await window.supabase
            .from('faq_categories')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showToast('Categoría eliminada', 'success');
        await loadFaqCategories();
        await loadFAQs();
    } catch (e) {
        console.error('Error eliminando categoría:', e);
        showToast('Error al eliminar: ' + e.message, 'error');
    }
}

export function editFaq(id) {
    openFaqModal(id);
}

export async function deleteFaq(id) {
    if (!confirm('¿Estás seguro de eliminar esta pregunta?')) return;

    try {
        const { error } = await window.supabase
            .from('faqs')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showToast('Pregunta eliminada', 'success');
        await loadFAQs();
    } catch (e) {
        console.error('Error eliminando pregunta:', e);
        showToast('Error al eliminar: ' + e.message, 'error');
    }
}
