import { el, showToast, generateSlug } from './utils.js';
import { state } from './state.js';

let selectedCategoryFile = null;

export async function init() {
    // Event listener for slug generation
    const categoryNameInput = el('#category-name');
    if (categoryNameInput) {
        categoryNameInput.addEventListener('blur', () => {
            const slugInput = el('#category-slug');
            if (slugInput && !slugInput.value) {
                slugInput.value = generateSlug(categoryNameInput.value);
            }
        });
    }

    // Category Image Handling
    const categoryImageInput = el('#category-image');
    const categoryImagePreview = el('#category-image-preview');

    if (categoryImageInput) {
        categoryImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                showToast('Solo se permiten archivos de imagen', 'error');
                return;
            }

            selectedCategoryFile = file;
            const reader = new FileReader();
            reader.onload = (event) => {
                if (categoryImagePreview) {
                    categoryImagePreview.innerHTML = `<img src="${event.target.result}" alt="Preview" />`;
                }
            };
            reader.readAsDataURL(file);
        });
    }

    // Category Form Submit
    const categoryForm = el('#category-form');
    if (categoryForm) {
        categoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = categoryForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Guardando...';

            try {
                const formData = new FormData(categoryForm);

                // Upload image if selected
                let imageUrl = null;
                if (selectedCategoryFile) {
                    const fileExt = selectedCategoryFile.name.split('.').pop();
                    const fileName = `category_${Date.now()}.${fileExt}`;
                    const { error: uploadError } = await window.supabase.storage
                        .from('categories') // Ensure this bucket exists
                        .upload(fileName, selectedCategoryFile);

                    if (uploadError) throw uploadError;

                    const { data } = window.supabase.storage
                        .from('categories')
                        .getPublicUrl(fileName);

                    imageUrl = data.publicUrl;
                }

                const data = {
                    name: formData.get('name'),
                    slug: formData.get('slug') || generateSlug(formData.get('name')),
                    description: formData.get('description') || null,
                    parent_id: formData.get('parent_id') || null,
                    is_active: formData.get('is_active') === 'on'
                };

                if (imageUrl) {
                    data.image_url = imageUrl; // Adjust column name if different
                }

                let error;
                if (state.editingCategoryId) {
                    ({ error } = await window.supabase
                        .from('categories')
                        .update(data)
                        .eq('id', state.editingCategoryId));
                } else {
                    ({ error } = await window.supabase
                        .from('categories')
                        .insert([data]));
                }

                if (error) throw error;

                showToast(state.editingCategoryId ? 'Categoría actualizada' : 'Categoría creada', 'success');

                // Reset form
                categoryForm.reset();
                state.editingCategoryId = null;
                selectedCategoryFile = null;
                if (categoryImagePreview) categoryImagePreview.innerHTML = '';
                if (el('#category-id')) el('#category-id').value = '';

                await loadCategories();
                await loadParentCategories(); // Refresh parent options

            } catch (err) {
                console.error('Error guardando categoría:', err);
                showToast('Error al guardar la categoría: ' + err.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    // Cancel button
    const btnCancelCategory = el('#btn-cancel-category');
    if (btnCancelCategory) {
        btnCancelCategory.addEventListener('click', () => {
            if (categoryForm) categoryForm.reset();
            state.editingCategoryId = null;
            selectedCategoryFile = null;
            if (categoryImagePreview) categoryImagePreview.innerHTML = '';
            if (el('#category-id')) el('#category-id').value = '';
        });
    }
}

export async function loadCategories() {
    const tbody = el('#categories-table-body');
    const countEl = el('#categories-count');
    if (!tbody) return;

    try {
        tbody.innerHTML = '<tr><td colspan="5" class="admin-table-empty"><p>Cargando categorías...</p></td></tr>';

        const { data: categories, error } = await window.supabase
            .from('categories')
            .select('*, parent:categories!parent_id(name)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!categories || categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="admin-table-empty"><p>No hay categorías</p></td></tr>';
            if (countEl) countEl.textContent = '0 categorías';
            return;
        }

        tbody.innerHTML = categories.map(category => {
            const statusClass = category.is_active !== false ? 'admin-badge-active' : 'admin-badge-inactive';
            const parentName = category.parent?.name || '—';

            return `
    <tr>
      <td><strong>${category.name}</strong></td>
      <td>${category.slug}</td>
      <td>${parentName}</td>
      <td><span class="admin-badge ${statusClass}">${category.is_active !== false ? 'Activa' : 'Inactiva'}</span></td>
      <td class="admin-th-actions">
        <div class="admin-table-actions">
          <button class="admin-action-btn admin-action-btn-edit" onclick="admin.editCategory('${category.id}')" title="Editar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="admin-action-btn admin-action-btn-delete" onclick="admin.deleteCategory('${category.id}')" title="Eliminar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `;
        }).join('');

        if (countEl) countEl.textContent = `${categories.length} categoría${categories.length !== 1 ? 's' : ''}`;

        // Cargar categorías padre para el formulario
        await loadParentCategories();
    } catch (error) {
        console.error('Error cargando categorías:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="admin-table-empty"><p>Error al cargar categorías</p></td></tr>';
        showToast('Error al cargar categorías', 'error');
    }
}

async function loadParentCategories() {
    const select = el('#category-parent');
    if (!select) return;

    try {
        let query = window.supabase
            .from('categories')
            .select('id, name')
            .eq('is_active', true)
            .order('name');

        // If editing, exclude self to avoid cycles
        if (state.editingCategoryId) {
            query = query.neq('id', state.editingCategoryId);
        }

        const { data: categories, error } = await query;

        if (error) throw error;

        const currentValue = select.value;
        select.innerHTML = '<option value="">Sin categoría padre</option>' +
            (categories || []).map(cat =>
                `<option value="${cat.id}" ${currentValue === cat.id ? 'selected' : ''}>${cat.name}</option>`
            ).join('');
    } catch (error) {
        console.error('Error cargando categorías padre:', error);
    }
}

// Global actions
export async function editCategory(id) {
    try {
        const { data: category, error } = await window.supabase
            .from('categories')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        state.editingCategoryId = id;

        // Populate form
        if (el('#category-id')) el('#category-id').value = category.id;
        if (el('#category-name')) el('#category-name').value = category.name;
        if (el('#category-slug')) el('#category-slug').value = category.slug;
        if (el('#category-description')) el('#category-description').value = category.description || '';
        if (el('#category-parent')) el('#category-parent').value = category.parent_id || '';
        if (el('#category-is-active')) el('#category-is-active').checked = category.is_active !== false;

        // Scroll to form
        const form = el('#category-form');
        if (form) form.scrollIntoView({ behavior: 'smooth' });

        // Update parent categories to exclude self
        await loadParentCategories();

    } catch (error) {
        console.error('Error cargando categoría:', error);
        showToast('Error al cargar la categoría', 'error');
    }
}

export async function deleteCategory(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría?')) return;

    try {
        const { error } = await window.supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
        showToast('Categoría eliminada correctamente', 'success');
        await loadCategories();
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        showToast('Error al eliminar la categoría', 'error');
    }
}
