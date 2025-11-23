import { el, showToast, generateSlug } from './utils.js';
import { state } from './state.js';
import { loadProductFormData } from './products.js';

export async function init() {
    // Modal de Colección
    const collectionModal = el('#collection-modal');
    const collectionForm = el('#collection-form');
    const btnAddCollection = el('#btn-add-collection');
    const btnCloseCollectionModal = el('#btn-close-collection-modal');
    const btnCancelCollection = el('#btn-cancel-collection');

    if (btnAddCollection) {
        btnAddCollection.addEventListener('click', () => {
            state.editingCollectionId = null;
            openCollectionModal();
        });
    }

    if (btnCloseCollectionModal) btnCloseCollectionModal.addEventListener('click', closeCollectionModal);
    if (btnCancelCollection) btnCancelCollection.addEventListener('click', closeCollectionModal);

    // Collection Form Submit
    if (collectionForm) {
        collectionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = collectionForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Guardando...';

            try {
                const formData = new FormData(collectionForm);
                const data = {
                    title: formData.get('title'),
                    slug: formData.get('slug') || generateSlug(formData.get('title')),
                    description: formData.get('description') || null,
                    is_active: formData.get('is_active') === 'on'
                };

                let error;
                let collectionId = state.editingCollectionId;

                if (state.editingCollectionId) {
                    ({ error } = await window.supabase
                        .from('collections')
                        .update(data)
                        .eq('id', state.editingCollectionId));
                } else {
                    const { data: newCollection, error: insertError } = await window.supabase
                        .from('collections')
                        .insert([data])
                        .select()
                        .single();

                    error = insertError;
                    if (newCollection) collectionId = newCollection.id;
                }

                if (error) throw error;

                // Save Product Associations
                if (collectionId) {
                    // 1. Get selected products
                    const selectedProducts = Array.from(collectionForm.querySelectorAll('input[name="collection_products"]:checked'))
                        .map(input => input.value);

                    // 2. Delete existing associations
                    const { error: deleteError } = await window.supabase
                        .from('collection_products')
                        .delete()
                        .eq('collection_id', collectionId);

                    if (deleteError) throw deleteError;

                    // 3. Insert new associations
                    if (selectedProducts.length > 0) {
                        const associations = selectedProducts.map(productId => ({
                            collection_id: collectionId,
                            product_id: productId
                        }));

                        const { error: insertAssocError } = await window.supabase
                            .from('collection_products')
                            .insert(associations);

                        if (insertAssocError) throw insertAssocError;
                    }
                }

                showToast(state.editingCollectionId ? 'Colección actualizada' : 'Colección creada', 'success');
                closeCollectionModal();
                await loadCollections();
                // Reload product form data to update collections checkboxes
                // Note: This might cause a circular dependency issue if not handled carefully.
                // Assuming loadProductFormData is exported from products.js
                try {
                    await loadProductFormData();
                } catch (e) {
                    console.warn("Could not reload product form data", e);
                }

            } catch (err) {
                console.error('Error guardando colección:', err);
                const errorMsg = err.message || err.hint || 'Error desconocido';
                showToast('Error al guardar la colección: ' + errorMsg, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    // Slug generation for collections
    const collectionTitleInput = el('#collection-title');
    if (collectionTitleInput) {
        collectionTitleInput.addEventListener('blur', () => {
            const slugInput = el('#collection-slug');
            if (slugInput && !slugInput.value) {
                slugInput.value = generateSlug(collectionTitleInput.value);
            }
        });
    }
}

export async function loadCollections() {
    const tbody = el('#collections-table-body');
    const countEl = el('#collections-count');
    if (!tbody) return;

    try {
        tbody.innerHTML = '<tr><td colspan="5" class="admin-table-empty"><p>Cargando colecciones...</p></td></tr>';

        const { data: collections, error } = await window.supabase
            .from('collections')
            .select(`
        *,
        collection_products (
          products (
            name
          )
        )
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!collections || collections.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="admin-table-empty"><p>No hay colecciones</p></td></tr>';
            if (countEl) countEl.textContent = '0 colecciones';
            return;
        }

        tbody.innerHTML = collections.map(collection => {
            const statusClass = collection.is_active !== false ? 'admin-badge-active' : 'admin-badge-inactive';

            // Extract product names
            const products = collection.collection_products
                ? collection.collection_products.map(cp => cp.products?.name).filter(Boolean)
                : [];

            const productsText = products.length > 0
                ? (products.length > 3
                    ? `${products.slice(0, 3).join(', ')} (+${products.length - 3})`
                    : products.join(', '))
                : 'Sin productos';

            return `
        <tr>
          <td><strong>${collection.title || 'Sin título'}</strong></td>
          <td>${collection.slug || '—'}</td>
          <td><small>${productsText}</small></td>
          <td><span class="admin-badge ${statusClass}">${collection.is_active !== false ? 'Activa' : 'Inactiva'}</span></td>
          <td class="admin-th-actions">
            <div class="admin-table-actions">
              <button class="admin-action-btn admin-action-btn-edit" onclick="admin.editCollection('${collection.id}')" title="Editar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="admin-action-btn admin-action-btn-delete" onclick="admin.deleteCollection('${collection.id}')" title="Eliminar">
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

        if (countEl) countEl.textContent = `${collections.length} colección${collections.length !== 1 ? 'es' : ''}`;
    } catch (error) {
        console.error('Error cargando colecciones:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="admin-table-empty"><p>Error al cargar colecciones</p></td></tr>';
        showToast('Error al cargar colecciones', 'error');
    }
}

export function openCollectionModal(collectionId = null) {
    state.editingCollectionId = collectionId;
    const title = el('#collection-modal-title');
    const collectionModal = el('#collection-modal');
    const collectionForm = el('#collection-form');

    if (title) title.textContent = collectionId ? 'Editar Colección' : 'Nueva Colección';

    if (collectionModal) {
        collectionModal.hidden = false;
        // Reset form if adding
        if (!collectionId && collectionForm) {
            collectionForm.reset();
            if (el('#collection-is-active')) el('#collection-is-active').checked = true;
        }
        loadCollectionProducts(collectionId);
    }
}

function closeCollectionModal() {
    const collectionModal = el('#collection-modal');
    const collectionForm = el('#collection-form');
    if (collectionModal) collectionModal.hidden = true;
    state.editingCollectionId = null;
    if (collectionForm) collectionForm.reset();
}

async function loadCollectionProducts(collectionId = null) {
    const container = el('#collection-products-list');
    if (!container) return;

    try {
        container.innerHTML = '<p class="admin-loading">Cargando productos...</p>';

        // 1. Fetch all active products
        const { data: products, error: productsError } = await window.supabase
            .from('products')
            .select('id, name, sku')
            .eq('is_active', true)
            .order('name');

        if (productsError) throw productsError;

        if (!products || products.length === 0) {
            container.innerHTML = '<p class="admin-empty-state">No hay productos activos disponibles</p>';
            return;
        }

        // 2. If editing, fetch existing associations
        let selectedProductIds = new Set();
        if (collectionId) {
            const { data: associations, error: assocError } = await window.supabase
                .from('collection_products')
                .select('product_id')
                .eq('collection_id', collectionId);

            if (assocError) {
                console.warn('Error fetching collection products:', assocError);
            } else if (associations) {
                associations.forEach(a => selectedProductIds.add(a.product_id));
            }
        }

        // 3. Render checkboxes
        container.innerHTML = products.map(product => {
            const isChecked = selectedProductIds.has(product.id);
            return `
        <div class="admin-checkbox-item">
          <label class="admin-checkbox-label">
            <input type="checkbox" name="collection_products" value="${product.id}" ${isChecked ? 'checked' : ''}>
            <span class="admin-checkmark"></span>
            <span class="admin-product-name">${product.name}</span>
            <span class="admin-product-sku">${product.sku || ''}</span>
          </label>
        </div>
      `;
        }).join('');

    } catch (error) {
        console.error('Error loading collection products:', error);
        container.innerHTML = '<p class="admin-error">Error al cargar productos</p>';
    }
}

// Global actions
export async function editCollection(id) {
    try {
        const { data: collection, error } = await window.supabase
            .from('collections')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        openCollectionModal(id);

        // Populate form
        if (el('#collection-title')) el('#collection-title').value = collection.title;
        if (el('#collection-slug')) el('#collection-slug').value = collection.slug;
        if (el('#collection-description')) el('#collection-description').value = collection.description || '';
        if (el('#collection-type')) el('#collection-type').value = collection.type || 'manual';
        if (el('#collection-is-active')) el('#collection-is-active').checked = collection.is_active !== false;
        if (el('#collection-is-featured')) el('#collection-is-featured').checked = collection.is_featured === true;

    } catch (error) {
        console.error('Error cargando colección:', error);
        showToast('Error al cargar la colección', 'error');
    }
}

export async function deleteCollection(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta colección?')) return;

    try {
        const { error } = await window.supabase
            .from('collections')
            .delete()
            .eq('id', id);

        if (error) throw error;
        showToast('Colección eliminada correctamente', 'success');
        await loadCollections();
    } catch (error) {
        console.error('Error eliminando colección:', error);
        showToast('Error al eliminar la colección', 'error');
    }
}
