import { supabase } from './supabase.js';
import { formatDate } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
    const postsContainer = document.querySelector('#blog-posts-grid');
    const postDetailContainer = document.querySelector('#post-detail-container');

    // Check if we are on the list page or detail page
    if (postsContainer) {
        await loadBlogPosts(postsContainer);
    } else if (postDetailContainer) {
        await loadPostDetail(postDetailContainer);
    }
});

async function loadBlogPosts(container) {
    try {
        container.innerHTML = '<div class="loading-spinner"></div>';

        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }

        const { data: posts, error } = await supabase
            .from('blog_posts')
            .select('id, title, slug, excerpt, featured_image, published_at')
            .eq('is_active', true)
            .order('published_at', { ascending: false });

        if (error) throw error;

        if (!posts || posts.length === 0) {
            container.innerHTML = '<p class="empty-state">No hay novedades publicadas aún.</p>';
            return;
        }

        container.innerHTML = posts.map(post => `
            <article class="blog-card">
                <a href="post.html?id=${post.id}" class="blog-card-link">
                    <div class="blog-card-image">
                        <img src="${post.featured_image || '../assets/placeholder-blog.jpg'}" alt="${post.title}" loading="lazy">
                    </div>
                    <div class="blog-card-content">
                        <span class="blog-date">${formatDate(post.published_at)}</span>
                        <h3 class="blog-title">${post.title}</h3>
                        <p class="blog-excerpt">${post.excerpt || ''}</p>
                        <span class="blog-read-more">Leer más &rarr;</span>
                    </div>
                </a>
            </article>
        `).join('');

    } catch (error) {
        console.error('Error loading blog posts:', error);
        container.innerHTML = '<p class="error-message">Error al cargar las novedades. Por favor, intenta de nuevo más tarde.</p>';
    }
}

async function loadPostDetail(container) {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    if (!postId) {
        window.location.href = 'novedades.html';
        return;
    }

    try {
        container.innerHTML = '<div class="loading-spinner"></div>';

        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }

        const { data: post, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('id', postId)
            .eq('is_active', true)
            .single();

        if (error) throw error;

        if (!post) {
            container.innerHTML = '<div class="error-message"><h1>Entrada no encontrada</h1><a href="novedades.html" class="back-link">Volver a Novedades</a></div>';
            return;
        }

        // Update page title
        document.title = `${post.title} | Solare`;

        container.innerHTML = `
            <article class="blog-post-full">
                <header class="blog-post-header">
                    <a href="novedades.html" class="back-link">&larr; Volver a Novedades</a>
                    <span class="blog-post-date">${formatDate(post.published_at)}</span>
                    <h1 class="blog-post-title">${post.title}</h1>
                </header>
                
                ${post.featured_image ? `
                <div class="blog-post-image">
                    <img src="${post.featured_image}" alt="${post.title}">
                </div>
                ` : ''}

                <div class="blog-post-content">
                    ${post.content}
                </div>
            </article>
        `;

    } catch (error) {
        console.error('Error loading post detail:', error);
        container.innerHTML = '<div class="error-message"><p>Error al cargar la entrada.</p><a href="novedades.html" class="back-link">Volver a Novedades</a></div>';
    }
}
