import { el, showToast, generateSlug, formatDate } from './utils.js';
import { state } from './state.js';

// ===== Blog Module =====

export async function init() {
    const btnAddPost = el('#btn-add-post');
    const btnClosePostModal = el('#btn-close-post-modal');
    const btnCancelPost = el('#btn-cancel-post');
    const postForm = el('#post-form');
    const postTitleInput = el('#post-title');

    if (btnAddPost) {
        btnAddPost.addEventListener('click', () => {
            state.editingBlogPostId = null;
            openPostModal();
        });
    }

    if (btnClosePostModal) btnClosePostModal.addEventListener('click', closePostModal);
    if (btnCancelPost) btnCancelPost.addEventListener('click', closePostModal);

    if (postForm) {
        postForm.addEventListener('submit', handlePostSubmit);
    }

    // Auto-generate slug
    if (postTitleInput) {
        postTitleInput.addEventListener('blur', () => {
            const slugInput = el('#post-slug');
            if (slugInput && !slugInput.value) {
                slugInput.value = generateSlug(postTitleInput.value);
            }
        });
    }
}

export async function loadBlogPosts() {
    const container = el('#posts-table-body');
    const countEl = el('#posts-count');
    if (!container) return;

    try {
        container.innerHTML = '<tr><td colspan="5" class="admin-table-empty"><p>Cargando entradas...</p></td></tr>';

        const { data: posts, error } = await window.supabase
            .from('blog_posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!posts || posts.length === 0) {
            container.innerHTML = '<tr><td colspan="5" class="admin-table-empty"><p>No hay entradas de blog</p></td></tr>';
            if (countEl) countEl.textContent = '0 entradas';
            return;
        }

        container.innerHTML = posts.map(post => {
            const statusClass = post.is_active ? 'admin-badge-active' : 'admin-badge-inactive';
            return `
                <tr>
                    <td><strong>${post.title}</strong></td>
                    <td>${post.slug}</td>
                    <td><span class="admin-badge ${statusClass}">${post.is_active ? 'Publicada' : 'Borrador'}</span></td>
                    <td>${formatDate(post.created_at)}</td>
                    <td class="admin-th-actions">
                        <div class="admin-table-actions">
                            <button class="admin-action-btn admin-action-btn-edit" onclick="admin.editBlogPost('${post.id}')" title="Editar">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="admin-action-btn admin-action-btn-delete" onclick="admin.deleteBlogPost('${post.id}')" title="Eliminar">
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

        if (countEl) countEl.textContent = `${posts.length} entrada${posts.length !== 1 ? 's' : ''}`;

    } catch (error) {
        console.error('Error loading blog posts:', error);
        container.innerHTML = '<tr><td colspan="5" class="admin-error">Error al cargar entradas</td></tr>';
        showToast('Error al cargar entradas', 'error');
    }
}

async function openPostModal(postId = null) {
    state.editingBlogPostId = postId;
    const modal = el('#post-modal');
    const form = el('#post-form');
    const title = el('#post-modal-title');

    if (title) title.textContent = postId ? 'Editar Entrada' : 'Nueva Entrada';

    if (modal) {
        modal.hidden = false;
        modal.style.display = 'flex';

        if (postId) {
            try {
                const { data: post, error } = await window.supabase
                    .from('blog_posts')
                    .select('*')
                    .eq('id', postId)
                    .single();

                if (error) throw error;

                if (el('#post-title')) el('#post-title').value = post.title;
                if (el('#post-slug')) el('#post-slug').value = post.slug;
                if (el('#post-excerpt')) el('#post-excerpt').value = post.excerpt || '';
                if (el('#post-content')) el('#post-content').value = post.content || '';
                if (el('#post-image')) el('#post-image').value = post.featured_image || '';
                if (el('#post-is-active')) el('#post-is-active').checked = post.is_active;

            } catch (error) {
                console.error('Error loading post:', error);
                showToast('Error al cargar la entrada', 'error');
                closePostModal();
            }
        } else {
            if (form) form.reset();
            if (el('#post-is-active')) el('#post-is-active').checked = true;
        }
    }
}

function closePostModal() {
    const modal = el('#post-modal');
    if (modal) {
        modal.hidden = true;
        modal.style.display = 'none';
    }
    state.editingBlogPostId = null;
    const form = el('#post-form');
    if (form) form.reset();
}

async function handlePostSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';

    try {
        const formData = new FormData(form);
        const data = {
            title: formData.get('title'),
            slug: formData.get('slug') || generateSlug(formData.get('title')),
            excerpt: formData.get('excerpt'),
            content: formData.get('content'),
            featured_image: formData.get('featured_image'),
            is_active: formData.get('is_active') === 'on'
        };

        let error;
        if (state.editingBlogPostId) {
            ({ error } = await window.supabase
                .from('blog_posts')
                .update(data)
                .eq('id', state.editingBlogPostId));
        } else {
            ({ error } = await window.supabase
                .from('blog_posts')
                .insert([data]));
        }

        if (error) throw error;

        showToast(state.editingBlogPostId ? 'Entrada actualizada' : 'Entrada creada', 'success');
        closePostModal();
        await loadBlogPosts();

    } catch (error) {
        console.error('Error saving post:', error);
        showToast('Error al guardar: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Global actions
export function editBlogPost(id) {
    openPostModal(id);
}

export async function deleteBlogPost(id) {
    if (!confirm('¿Estás seguro de eliminar esta entrada?')) return;

    try {
        const { error } = await window.supabase
            .from('blog_posts')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showToast('Entrada eliminada', 'success');
        await loadBlogPosts();
    } catch (error) {
        console.error('Error deleting post:', error);
        showToast('Error al eliminar: ' + error.message, 'error');
    }
}
