// Solare State Manager - Centralized State Management
// Single source of truth for auth, cart, and favorites state
(function () {
    'use strict';

    // ============================================================================
    // EVENT SYSTEM
    // ============================================================================

    class EventEmitter {
        constructor() {
            this.events = {};
        }

        on(event, callback) {
            if (!this.events[event]) this.events[event] = [];
            this.events[event].push(callback);

            // Return unsubscribe function
            return () => this.off(event, callback);
        }

        off(event, callback) {
            if (!this.events[event]) return;
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }

        emit(event, data) {
            if (!this.events[event]) return;
            this.events[event].forEach(callback => callback(data));
        }
    }

    // ============================================================================
    // STATE MODULES
    // ============================================================================

    // Auth State Module
    class AuthState {
        constructor(emitter) {
            this.emitter = emitter;
            this.user = null;
            this.session = null;
            this.isReady = this._initialize();
        }

        async _initialize() {
            console.log('[State] Initializing auth state...');

            if (!window.supabase) {
                await new Promise(resolve => setTimeout(resolve, 100));
                if (!window.supabase) {
                    console.error('[State] Supabase not available');
                    return;
                }
            }

            try {
                const { data: { session }, error } = await window.supabase.auth.getSession();

                if (error) {
                    console.error('[State] Error getting session:', error);
                } else {
                    this.session = session;
                    this.user = session?.user || null;
                    console.log('[State] Auth initialized:', this.user ? `User ${this.user.id}` : 'Not authenticated');
                }

                // Listen for auth changes
                window.supabase.auth.onAuthStateChange((event, session) => {
                    console.log('[State] Auth state changed:', event);
                    this.session = session;
                    this.user = session?.user || null;
                    this.emitter.emit('auth:changed', { user: this.user, session: this.session, event });
                });

            } catch (error) {
                console.error('[State] Auth initialization error:', error);
            }
        }

        getUser() {
            return this.user;
        }

        getSession() {
            return this.session;
        }

        isAuthenticated() {
            return !!this.user && !!this.session;
        }
    }

    // Cart State Module
    class CartState {
        constructor(emitter, authState) {
            this.emitter = emitter;
            this.authState = authState;
            this.items = [];
            this.cartId = null;
            this.STORAGE_KEY = 'solare-cart';
            this.SESSION_KEY = 'solare_session_id';

            this._initialize();
        }

        async _initialize() {
            console.log('[State] Initializing cart state...');

            // Ensure session ID for guests
            if (!localStorage.getItem(this.SESSION_KEY)) {
                localStorage.setItem(this.SESSION_KEY, this._generateUUID());
            }

            // Wait for auth to be ready
            await this.authState.isReady;

            // Load cart from database
            await this._loadCart();

            // Listen for auth changes to reload cart
            this.emitter.on('auth:changed', async () => {
                console.log('[State] Reloading cart due to auth change');
                this.items = [];
                await this._loadCart();
            });

            // Listen for storage changes (cross-tab sync)
            window.addEventListener('storage', (e) => {
                if (e.key === this.STORAGE_KEY) {
                    console.log('[State] Cart updated from another tab');
                    try {
                        this.items = e.newValue ? JSON.parse(e.newValue) : [];
                        this.emitter.emit('cart:changed', { items: this.items, totals: this.getTotals() });
                    } catch (err) {
                        console.error('[State] Error parsing cart from storage:', err);
                    }
                }
            });
        }

        async _loadCart() {
            if (!window.supabase) return;

            try {
                const ctx = this._getContext();
                let query = window.supabase
                    .from('shopping_carts')
                    .select(`
            id,
            cart_items (
              id,
              product_id,
              quantity,
              products (
                id,
                name,
                price,
                slug,
                categories (slug),
                product_images (url)
              )
            )
          `);

                if (ctx.type === 'user') {
                    query = query.eq('user_id', ctx.id);
                } else {
                    query = query.eq('session_id', ctx.id);
                }

                const { data: carts, error } = await query;

                if (error) throw error;

                const cart = carts?.[0] || null;

                if (cart) {
                    this.cartId = cart.id;
                    this.items = (cart.cart_items || []).map(item => ({
                        id: item.products.id,
                        cart_item_id: item.id,
                        name: item.products.name,
                        price: item.products.price,
                        image: item.products.product_images?.[0]?.url || null,
                        category: item.products.categories?.slug || 'producto',
                        quantity: item.quantity
                    }));
                } else {
                    await this._createCart(ctx);
                }

                this._syncToStorage();
                this.emitter.emit('cart:changed', { items: this.items, totals: this.getTotals() });
                console.log('[State] Cart loaded:', this.items.length, 'items');

            } catch (error) {
                console.error('[State] Error loading cart:', error);
            }
        }

        async _createCart(ctx) {
            const payload = ctx.type === 'user' ? { user_id: ctx.id } : { session_id: ctx.id };
            const { data, error } = await window.supabase
                .from('shopping_carts')
                .insert([payload])
                .select()
                .single();

            if (error) {
                console.error('[State] Error creating cart:', error);
                return;
            }

            this.cartId = data.id;
            this.items = [];
        }

        _getContext() {
            const user = this.authState.getUser();
            if (user) return { type: 'user', id: user.id };
            return { type: 'session', id: localStorage.getItem(this.SESSION_KEY) };
        }

        _generateUUID() {
            return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
        }

        _syncToStorage() {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items));
        }

        getItems() {
            return [...this.items];
        }

        async addItem(product) {
            if (!this.cartId) await this._loadCart();

            const existing = this.items.find(item => item.id === product.id);

            try {
                if (existing) {
                    await this.updateQuantity(product.id, existing.quantity + 1);
                } else {
                    const { data, error } = await window.supabase
                        .from('cart_items')
                        .insert([{
                            cart_id: this.cartId,
                            product_id: product.id,
                            quantity: 1
                        }])
                        .select()
                        .single();

                    if (error) throw error;

                    this.items.push({
                        id: product.id,
                        cart_item_id: data.id,
                        name: product.name,
                        price: parseFloat(product.price) || 0,
                        image: product.image || product.primary_image,
                        category: product.category_slug || product.category || 'producto',
                        quantity: 1
                    });

                    this._syncToStorage();
                    this.emitter.emit('cart:changed', { items: this.items, totals: this.getTotals() });
                }
            } catch (error) {
                console.error('[State] Error adding item:', error);
                throw error;
            }
        }

        async removeItem(productId) {
            const item = this.items.find(i => i.id === productId);
            if (!item) return;

            try {
                const { error } = await window.supabase
                    .from('cart_items')
                    .delete()
                    .eq('id', item.cart_item_id);

                if (error) throw error;

                this.items = this.items.filter(i => i.id !== productId);
                this._syncToStorage();
                this.emitter.emit('cart:changed', { items: this.items, totals: this.getTotals() });
            } catch (error) {
                console.error('[State] Error removing item:', error);
                throw error;
            }
        }

        async updateQuantity(productId, quantity) {
            const item = this.items.find(i => i.id === productId);
            if (!item) return;

            try {
                const { error } = await window.supabase
                    .from('cart_items')
                    .update({ quantity })
                    .eq('id', item.cart_item_id);

                if (error) throw error;

                item.quantity = quantity;
                this._syncToStorage();
                this.emitter.emit('cart:changed', { items: this.items, totals: this.getTotals() });
            } catch (error) {
                console.error('[State] Error updating quantity:', error);
                throw error;
            }
        }

        async clear() {
            try {
                if (this.cartId) {
                    const { error } = await window.supabase
                        .from('cart_items')
                        .delete()
                        .eq('cart_id', this.cartId);

                    if (error) throw error;
                }

                this.items = [];
                this._syncToStorage();
                this.emitter.emit('cart:changed', { items: this.items, totals: this.getTotals() });
            } catch (error) {
                console.error('[State] Error clearing cart:', error);
                throw error;
            }
        }

        getTotals() {
            const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const tax = subtotal * 0.21;
            const shipping = subtotal >= 100 ? 0 : 10;
            const total = subtotal + tax + shipping;
            const itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);

            return { subtotal, tax, shipping, total, itemCount };
        }
    }

    // Favorites State Module
    class FavoritesState {
        constructor(emitter, authState) {
            this.emitter = emitter;
            this.authState = authState;
            this.favorites = [];
            this.STORAGE_KEY = 'solare-favs';

            this._initialize();
        }

        async _initialize() {
            console.log('[State] Initializing favorites state...');

            // Load from localStorage first
            try {
                const raw = localStorage.getItem(this.STORAGE_KEY);
                this.favorites = raw ? JSON.parse(raw) : [];
            } catch (e) {
                console.error('[State] Error loading local favorites:', e);
                this.favorites = [];
            }

            // Wait for auth
            await this.authState.isReady;

            // Load from DB if authenticated
            const user = this.authState.getUser();
            if (user) {
                await this._loadFromDB(user.id);
                await this._syncToDB(user.id);
            }

            this.emitter.emit('favorites:changed', { favorites: this.favorites });

            // Listen for auth changes
            this.emitter.on('auth:changed', async ({ user }) => {
                if (user) {
                    await this._loadFromDB(user.id);
                    await this._syncToDB(user.id);
                } else {
                    // Load from localStorage only
                    const raw = localStorage.getItem(this.STORAGE_KEY);
                    this.favorites = raw ? JSON.parse(raw) : [];
                    this.emitter.emit('favorites:changed', { favorites: this.favorites });
                }
            });

            // Listen for storage changes (cross-tab sync)
            window.addEventListener('storage', (e) => {
                if (e.key === this.STORAGE_KEY) {
                    console.log('[State] Favorites updated from another tab');
                    try {
                        this.favorites = e.newValue ? JSON.parse(e.newValue) : [];
                        this.emitter.emit('favorites:changed', { favorites: this.favorites });
                    } catch (err) {
                        console.error('[State] Error parsing favorites from storage:', err);
                    }
                }
            });
        }

        async _loadFromDB(userId) {
            if (!window.supabase) return;

            try {
                const { data, error } = await window.supabase
                    .from('user_favorites')
                    .select('product_id, products(id, name, price, slug, categories(slug), product_images(url))')
                    .eq('user_id', userId);

                if (error) throw error;

                const dbFavs = (data || []).map(item => ({
                    id: item.products.id,
                    name: item.products.name,
                    price: item.products.price,
                    image: item.products.product_images?.[0]?.url || null,
                    category: item.products.categories?.slug || 'producto'
                }));

                // Merge with local favorites (prefer DB)
                const dbIds = new Set(dbFavs.map(f => f.id));
                const localOnly = this.favorites.filter(f => !dbIds.has(f.id));

                this.favorites = [...dbFavs, ...localOnly];
                this._syncToStorage();
                this.emitter.emit('favorites:changed', { favorites: this.favorites });

            } catch (error) {
                console.error('[State] Error loading favorites from DB:', error);
            }
        }

        async _syncToDB(userId) {
            if (!window.supabase) return;

            const localIds = this.favorites.map(f => f.id);

            // Get DB favorites
            const { data: dbData } = await window.supabase
                .from('user_favorites')
                .select('product_id')
                .eq('user_id', userId);

            const dbIds = new Set((dbData || []).map(item => item.product_id));

            // Add local favorites to DB
            const toAdd = localIds.filter(id => !dbIds.has(id));

            if (toAdd.length > 0) {
                const inserts = toAdd.map(id => ({ user_id: userId, product_id: id }));

                for (const insert of inserts) {
                    const { error } = await window.supabase
                        .from('user_favorites')
                        .select('product_id')
                        .eq('user_id', userId)
                        .eq('product_id', insert.product_id)
                        .maybeSingle();

                    if (!error) {
                        await window.supabase
                            .from('user_favorites')
                            .insert([insert]);
                    }
                }
            }
        }

        _syncToStorage() {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.favorites));
        }

        getAll() {
            return [...this.favorites];
        }

        async add(product) {
            const exists = this.favorites.some(f => f.id === product.id);
            if (exists) return;

            const fav = {
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image || product.primary_image,
                category: product.category_slug || product.category || 'producto'
            };

            this.favorites.push(fav);
            this._syncToStorage();

            // Add to DB if authenticated
            const user = this.authState.getUser();
            if (user) {
                try {
                    await window.supabase
                        .from('user_favorites')
                        .insert([{ user_id: user.id, product_id: product.id }]);
                } catch (error) {
                    console.error('[State] Error adding favorite to DB:', error);
                }
            }

            this.emitter.emit('favorites:changed', { favorites: this.favorites });
        }

        async remove(productId) {
            this.favorites = this.favorites.filter(f => f.id !== productId);
            this._syncToStorage();

            // Remove from DB if authenticated
            const user = this.authState.getUser();
            if (user) {
                try {
                    await window.supabase
                        .from('user_favorites')
                        .delete()
                        .eq('user_id', user.id)
                        .eq('product_id', productId);
                } catch (error) {
                    console.error('[State] Error removing favorite from DB:', error);
                }
            }

            this.emitter.emit('favorites:changed', { favorites: this.favorites });
        }

        async toggle(product) {
            if (this.isFavorite(product.id)) {
                await this.remove(product.id);
            } else {
                await this.add(product);
            }
        }

        isFavorite(productId) {
            return this.favorites.some(f => f.id === productId);
        }
    }

    // ============================================================================
    // STATE MANAGER
    // ============================================================================

    class StateManager {
        constructor() {
            this.emitter = new EventEmitter();
            this.auth = new AuthState(this.emitter);
            this.cart = new CartState(this.emitter, this.auth);
            this.favorites = new FavoritesState(this.emitter, this.auth);

            console.log('[State] State Manager initialized');
        }

        on(event, callback) {
            return this.emitter.on(event, callback);
        }

        off(event, callback) {
            this.emitter.off(event, callback);
        }
    }

    // ============================================================================
    // EXPORT
    // ============================================================================

    window.SolareState = new StateManager();

})();
