import { el, els, formatCurrency, showToast, generateSlug } from './utils.js';
import { state } from './state.js';
import { loadDashboard } from './dashboard.js';

let selectedProductFiles = [];

export async function init() {
    // Búsqueda y filtros de productos
    const productsSearch = el('#products-search');
    const productsFilterCategory = el('#products-filter-category');
    const productsFilterStatus = el('#products-filter-status');

    if (productsSearch) {
        let searchTimeout;
        productsSearch.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterProducts();
            }, 300);
        });
    }

    if (productsFilterCategory) {
        productsFilterCategory.addEventListener('change', filterProducts);
    }

    if (productsFilterStatus) {
        productsFilterStatus.addEventListener('change', filterProducts);
    }

    // Modal de producto
    const productModal = el('#product-modal');
    const productForm = el('#product-form');
    const btnAddProduct = el('#btn-add-product');
    const btnCloseProductModal = el('#btn-close-product-modal');
    const btnCancelProduct = el('#btn-cancel-product');

    if (btnAddProduct) {
        btnAddProduct.addEventListener('click', () => {
            state.editingProductId = null;
            openProductModal();
        });
    }

    if (btnCloseProductModal) {
        btnCloseProductModal.addEventListener('click', closeProductModal);
    }

    if (btnCancelProduct) {
        btnCancelProduct.addEventListener('click', closeProductModal);
    }

    // Cerrar modal al hacer clic fuera
    if (productModal) {
        productModal.addEventListener('click', (e) => {
            if (e.target === productModal) {
                closeProductModal();
            }
        });
    }

    // Tabs del formulario de producto
    const productFormTabs = els('.admin-form-tab[data-tab]');
    productFormTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchProductTab(tabName);
        });
    });

    // Manejo de imágenes de producto
    const productImagesInput = el('#product-images');
    if (productImagesInput) {
        productImagesInput.addEventListener('change', handleProductImages);
    }

    // Auto-generar slug desde el nombre
    const productNameInput = el('#product-name');
    if (productNameInput) {
        productNameInput.addEventListener('blur', () => {
            const slugInput = el('#product-slug');
            if (slugInput && !slugInput.value) {
                slugInput.value = generateSlug(productNameInput.value);
            }
        });
    }

    // Guardar producto
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
}

export async function loadProducts() {
    const tbody = el('#products-table-body');
    const countEl = el('#products-count');
    if (!tbody) return;

    try {
        tbody.innerHTML = '<tr><td colspan="7" class="admin-table-empty"><p>Cargando productos...</p></td></tr>';

        const { data: products, error } = await window.supabase
            .from('products')
            .select(`
        *,
        categories(name),
        brands(name)
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!products || products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="admin-table-empty"><p>No hay productos</p></td></tr>';
            if (countEl) countEl.textContent = '0 productos';
            return;
        }

        tbody.innerHTML = products.map(product => {
            const imageUrl = product.images && product.images[0] ? product.images[0] : '';
            const categoryName = product.categories?.name || 'Sin categoría';
            const statusClass = product.is_active ? 'admin-badge-active' : 'admin-badge-inactive';
            const statusText = product.is_active ? 'Activo' : 'Inactivo';

            return `
        <tr>
          <td>
            ${imageUrl ? `<img src="${imageUrl}" alt="${product.name}" class="admin-table-image" />` : '<span class="admin-table-empty">Sin imagen</span>'}
          </td>
          <td>
            <strong>${product.name || 'Sin nombre'}</strong>
            ${product.sku ? `<br><small style="color: var(--admin-muted);">SKU: ${product.sku}</small>` : ''}
          </td>
          <td>${categoryName}</td>
          <td>${formatCurrency(product.price || 0)}</td>
          <td>${product.inventory_quantity || 0}</td>
          <td><span class="admin-badge ${statusClass}">${statusText}</span></td>
          <td class="admin-th-actions">
            <div class="admin-table-actions">
              <button class="admin-action-btn admin-action-btn-edit" onclick="admin.editProduct('${product.id}')" title="Editar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="admin-action-btn admin-action-btn-delete" onclick="admin.deleteProduct('${product.id}')" title="Eliminar">
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

        if (countEl) countEl.textContent = `${products.length} producto${products.length !== 1 ? 's' : ''}`;

        // Cargar categorías para el filtro
        await loadCategoriesForFilter();
    } catch (error) {
        console.error('Error cargando productos:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="admin-table-empty"><p>Error al cargar productos</p></td></tr>';
        showToast('Error al cargar productos', 'error');
    }
}

async function loadCategoriesForFilter() {
    const select = el('#products-filter-category');
    if (!select) return;

    try {
        const { data: categories, error } = await window.supabase
            .from('categories')
            .select('id, name')
            .eq('is_active', true)
            .order('name');

        if (error) throw error;

        const currentValue = select.value;
        select.innerHTML = '<option value="">Todas las categorías</option>' +
            (categories || []).map(cat =>
                `<option value="${cat.id}" ${currentValue === cat.id ? 'selected' : ''}>${cat.name}</option>`
            ).join('');
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

async function filterProducts() {
    // Implementación de filtrado (simplificada - se puede mejorar)
    await loadProducts();
}

function switchProductTab(tabName) {
    const productFormTabs = els('.admin-form-tab[data-tab]');
    // Desactivar todos los tabs
    productFormTabs.forEach(tab => {
        tab.classList.remove('active');
        const name = tab.getAttribute('data-tab');
        const content = el(`[data-tab-content="${name}"]`);
        if (content) content.classList.remove('active');
    });

    // Activar el tab seleccionado
    const activeTab = el(`.admin-form-tab[data-tab="${tabName}"]`);
    const activeContent = el(`[data-tab-content="${tabName}"]`);
    if (activeTab) activeTab.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
}

async function openProductModal(productId = null) {
    state.editingProductId = productId;
    const title = el('#product-modal-title');
    const productForm = el('#product-form');
    const productModal = el('#product-modal');

    if (title) {
        title.textContent = productId ? 'Editar Producto' : 'Nuevo Producto';
    }

    // Cargar categorías y marcas
    await loadProductFormData();

    if (productId) {
        await loadProductData(productId);
    } else {
        if (productForm) productForm.reset();
        // Establecer valores por defecto
        const isActiveCheckbox = el('#product-is-active');
        if (isActiveCheckbox) isActiveCheckbox.checked = true;
        displayProductImages([]);
    }

    if (productModal) {
        productModal.hidden = false;
        productModal.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
    }
}

export async function loadProductFormData() {
    console.log('Loading product form data...');
    // Cargar categorías
    const categorySelect = el('#product-category');
    if (categorySelect) {
        try {
            const { data: categories, error } = await window.supabase
                .from('categories')
                .select('id, name')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;

            categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>' +
                (categories || []).map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
        } catch (error) {
            console.error('Error cargando categorías:', error);
        }
    }

    // Cargar marcas
    const brandSelect = el('#product-brand');
    if (brandSelect) {
        try {
            const { data: brands } = await window.supabase
                .from('brands')
                .select('id, name')
                .eq('is_active', true)
                .order('name');

            brandSelect.innerHTML = '<option value="">Sin marca</option>' +
                (brands || []).map(brand => `<option value="${brand.id}">${brand.name}</option>`).join('');
        } catch (error) {
            console.error('Error cargando marcas:', error);
        }
    }

    // Cargar colecciones (Checkboxes)
    const collectionsList = el('#product-collections-list');
    if (collectionsList) {
        try {
            const { data: collections, error } = await window.supabase
                .from('collections')
                .select('id, title')
                .eq('is_active', true)
                .order('title');

            if (error) throw error;

            if (!collections || collections.length === 0) {
                collectionsList.innerHTML = '<p class="admin-empty-state">No hay colecciones activas</p>';
            } else {
                collectionsList.innerHTML = collections.map(col => `
          <div class="admin-checkbox-item">
            <label class="admin-checkbox-label">
              <input type="checkbox" name="collections" value="${col.id}" id="col-${col.id}">
              <span class="admin-checkmark"></span>
              ${col.title}
            </label>
          </div>
        `).join('');
            }
        } catch (error) {
            console.error('Error cargando colecciones:', error);
            collectionsList.innerHTML = '<p class="admin-error">Error al cargar colecciones</p>';
        }
    }
}

async function loadProductData(productId) {
    try {
        const { data: product, error } = await window.supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (error) throw error;

        // Llenar formulario
        if (el('#product-name')) el('#product-name').value = product.name || '';
        if (el('#product-slug')) el('#product-slug').value = product.slug || '';
        if (el('#product-sku')) el('#product-sku').value = product.sku || '';
        if (el('#product-short-description')) el('#product-short-description').value = product.short_description || '';
        if (el('#product-description')) el('#product-description').value = product.description || '';
        if (el('#product-category')) el('#product-category').value = product.category_id || '';
        if (el('#product-brand')) el('#product-brand').value = product.brand_id || '';
        if (el('#product-price')) el('#product-price').value = product.price || '';
        if (el('#product-compare-price')) el('#product-compare-price').value = product.compare_price || '';
        if (el('#product-cost-price')) el('#product-cost-price').value = product.cost_price || '';
        if (el('#product-inventory')) el('#product-inventory').value = product.inventory_quantity || 0;
        if (el('#product-low-stock')) el('#product-low-stock').value = product.low_stock_threshold || 5;
        if (el('#product-weight')) el('#product-weight').value = product.weight || '';
        if (el('#product-tags')) el('#product-tags').value = product.tags ? product.tags.join(', ') : '';
        if (el('#product-meta-title')) el('#product-meta-title').value = product.meta_title || '';
        if (el('#product-meta-description')) el('#product-meta-description').value = product.meta_description || '';
        if (el('#product-is-active')) el('#product-is-active').checked = product.is_active !== false;
        if (el('#product-is-featured')) el('#product-is-featured').checked = product.is_featured === true;
        if (el('#product-track-inventory')) el('#product-track-inventory').checked = product.track_inventory !== false;
        if (el('#product-requires-shipping')) el('#product-requires-shipping').checked = product.requires_shipping !== false;
        if (el('#product-taxable')) el('#product-taxable').checked = product.taxable !== false;

        // Cargar imágenes
        if (product.images && product.images.length > 0) {
            displayProductImages(product.images);
        }
    } catch (error) {
        console.error('Error cargando producto:', error);
        showToast('Error al cargar el producto', 'error');
    }
}

function closeProductModal() {
    const productModal = el('#product-modal');
    const productForm = el('#product-form');
    if (productModal) {
        productModal.hidden = true;
        productModal.setAttribute('hidden', '');
        document.body.style.overflow = '';
    }
    state.editingProductId = null;
    if (productForm) productForm.reset();
}

function handleProductImages(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach(file => {
        if (!file.type.startsWith('image/')) {
            showToast('Solo se permiten archivos de imagen', 'error');
            return;
        }

        // Add to selected files
        selectedProductFiles.push(file);

        const reader = new FileReader();
        reader.onload = (event) => {
            const imageUrl = event.target.result;
            addProductImagePreview(imageUrl, file);
        };
        reader.readAsDataURL(file);
    });

    // Reset input to allow selecting same files again
    e.target.value = '';
}

function addProductImagePreview(imageUrl, file) {
    const productImagesPreview = el('#product-images-preview');
    if (!productImagesPreview) return;

    const item = document.createElement('div');
    item.className = 'admin-image-preview-item';
    item.innerHTML = `
    <img src="${imageUrl}" alt="Preview" />
    <button type="button" class="admin-action-btn admin-image-remove" title="Eliminar">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

    // Add remove handler
    const removeBtn = item.querySelector('.admin-image-remove');
    removeBtn.addEventListener('click', () => {
        item.remove();
        // Remove from selectedProductFiles if it's a new file
        if (file) {
            const index = selectedProductFiles.indexOf(file);
            if (index > -1) selectedProductFiles.splice(index, 1);
        }
    });

    productImagesPreview.appendChild(item);
}

function displayProductImages(images) {
    const productImagesPreview = el('#product-images-preview');
    if (!productImagesPreview) return;
    productImagesPreview.innerHTML = '';
    selectedProductFiles = []; // Reset new files

    images.forEach(imageUrl => {
        // For existing images, we don't pass a File object
        addProductImagePreview(imageUrl, null);
    });
}

async function handleProductSubmit(e) {
    e.preventDefault();
    const productForm = el('#product-form');
    const submitBtn = productForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';

    async function uploadImage(file, bucket = 'products') {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await window.supabase.storage
            .from(bucket)
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = window.supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return data.publicUrl;
    }

    try {
        const formData = new FormData(productForm);
        const data = {
            name: formData.get('name') || '',
            slug: formData.get('slug') || generateSlug(formData.get('name')),
            sku: formData.get('sku') || null,
            short_description: formData.get('short_description') || null,
            description: formData.get('description') || null,
            category_id: formData.get('category_id') || null,
            brand_id: formData.get('brand_id') || null,
            price: parseFloat(formData.get('price')) || 0,
            compare_price: formData.get('compare_price') ? parseFloat(formData.get('compare_price')) : null,
            cost_price: formData.get('cost_price') ? parseFloat(formData.get('cost_price')) : null,
            inventory_quantity: parseInt(formData.get('inventory_quantity')) || 0,
            low_stock_threshold: parseInt(formData.get('low_stock_threshold')) || 5,
            weight: formData.get('weight') ? parseFloat(formData.get('weight')) : null,
            tags: formData.get('tags') ? formData.get('tags').split(',').map(t => t.trim()).filter(t => t) : [],
            meta_title: formData.get('meta_title') || null,
            meta_description: formData.get('meta_description') || null,
            is_active: formData.get('is_active') === 'on',
            is_featured: formData.get('is_featured') === 'on',
            track_inventory: formData.get('track_inventory') === 'on',
            requires_shipping: formData.get('requires_shipping') === 'on',
            taxable: formData.get('taxable') === 'on',
        };

        if (data.compare_price !== null && data.compare_price < data.price) {
            showToast('El precio de comparación debe ser mayor o igual al precio normal', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }

        const existingImages = Array.from(els('#product-images-preview img'))
            .map(img => img.src)
            .filter(src => src.startsWith('http'));

        const newImageUrls = [];
        if (selectedProductFiles.length > 0) {
            for (const file of selectedProductFiles) {
                try {
                    const url = await uploadImage(file, 'products');
                    newImageUrls.push(url);
                } catch (err) {
                    console.error('Failed to upload image:', file.name, err);
                    showToast(`Error al subir imagen ${file.name}`, 'error');
                }
            }
        }

        const allImages = [...existingImages, ...newImageUrls];
        let productId = state.editingProductId;

        if (state.editingProductId) {
            const { error } = await window.supabase
                .from('products')
                .update(data)
                .eq('id', state.editingProductId);

            if (error) throw error;
        } else {
            const { data: newProduct, error } = await window.supabase
                .from('products')
                .insert([data])
                .select()
                .single();

            if (error) throw error;
            productId = newProduct.id;
        }

        if (productId) {
            const { error: deleteError } = await window.supabase
                .from('product_images')
                .delete()
                .eq('product_id', productId);

            if (deleteError) throw deleteError;

            if (allImages.length > 0) {
                const imagesToInsert = allImages.map((url, index) => ({
                    product_id: productId,
                    url: url,
                    sort_order: index,
                    is_primary: index === 0
                }));

                const { error: insertError } = await window.supabase
                    .from('product_images')
                    .insert(imagesToInsert);

                if (insertError) throw insertError;
            }
        }

        showToast(state.editingProductId ? 'Producto actualizado correctamente' : 'Producto creado correctamente', 'success');

        selectedProductFiles = [];
        if (el('#product-images')) el('#product-images').value = '';

        closeProductModal();
        await loadProducts();
        await loadDashboard();
    } catch (error) {
        console.error('Error guardando producto:', error);
        showToast('Error al guardar el producto: ' + (error.message || 'Error desconocido'), 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Exported actions for global access
export function editProduct(id) {
    openProductModal(id);
}

export async function deleteProduct(id) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
        const { error } = await window.supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showToast('Producto eliminado', 'success');
        await loadProducts();
        await loadDashboard();
    } catch (error) {
        console.error('Error eliminando producto:', error);
        showToast('Error al eliminar producto', 'error');
    }
}
