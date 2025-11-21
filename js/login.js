// Auth functionality - Login and Signup
document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const loginToggle = document.getElementById('loginToggle');
    const signupToggle = document.getElementById('signupToggle');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginFormElement = document.getElementById('login-form');
    const signupFormElement = document.getElementById('signup-form');
    const loginMessage = document.getElementById('login-message');
    const signupMessage = document.getElementById('signup-message');

    // Wait for Supabase client to be available
    let supabaseReady = false;
    const checkSupabase = () => {
        if (window.supabase) {
            supabaseReady = true;
            console.log('Supabase client is ready');
        } else {
            setTimeout(checkSupabase, 100);
        }
    };
    checkSupabase();

    // Authentication functions
    const auth = {
        user: null,
        session: null,

        // Inicializar y verificar sesión existente
        async init() {
            try {
                const { data: { session }, error } = await window.supabase.auth.getSession()
                if (error) throw error
                
                this.session = session
                this.user = session?.user || null
                
                // Si hay una sesión activa, actualizar el estado en la navbar
                if (this.session && this.user) {
                    this.updateNavbarAuthState(this.user)
                }
                
                // Escuchar cambios en el estado de autenticación
                window.supabase.auth.onAuthStateChange((event, session) => {
                    console.log('Auth state changed:', event)
                    this.session = session
                    this.user = session?.user || null
                    this.handleAuthStateChange(event, session)
                    
                    // Actualizar navbar cuando cambia el estado
                    if (this.user) {
                        this.updateNavbarAuthState(this.user)
                    } else {
                        this.updateNavbarAuthState(null)
                    }
                })
                
            } catch (error) {
                console.error('Error initializing auth:', error)
            }
        },
        
        // Actualizar el estado de autenticación en la navbar
        updateNavbarAuthState(user) {
            // Usar el módulo global de autenticación si está disponible
            if (window.SolareAuth) {
                window.SolareAuth.updateNavbar(user);
            } else {
                // Fallback: actualizar enlaces de cuenta en la navbar
                const accountLinks = document.querySelectorAll('.account-icon-desktop, .login-icon-mobile')
                accountLinks.forEach(link => {
                    if (user) {
                        // Cambiar el href a perfil o dashboard si existe
                        link.href = link.href.replace('login.html', 'perfil.html') || 'perfil.html'
                        link.title = 'Mi Cuenta'
                    } else {
                        link.href = 'login.html'
                        link.title = 'Iniciar Sesión'
                    }
                })
            }
        },

        // Manejar cambios en el estado de autenticación
        handleAuthStateChange(event, session) {
            switch (event) {
                case 'SIGNED_IN':
                    console.log('User signed in:', session.user)
                    this.redirectAfterLogin()
                    break
                case 'SIGNED_OUT':
                    console.log('User signed out')
                    this.redirectAfterLogout()
                    break
                case 'TOKEN_REFRESHED':
                    console.log('Token refreshed')
                    break
            }
        },

        // Iniciar sesión con email y contraseña
        async signIn(email, password) {
            try {
                const { data, error } = await window.supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                })

                if (error) throw error

                return {
                    success: true,
                    user: data.user,
                    session: data.session,
                    message: 'Inicio de sesión exitoso'
                }
            } catch (error) {
                console.error('Error signing in:', error)
                return {
                    success: false,
                    error: error.message,
                    message: this.getErrorMessage(error.message)
                }
            }
        },

        // Registrar nuevo usuario
        async signUp(email, password, userData = {}) {
            try {
                const { data, error } = await window.supabase.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            first_name: userData.firstName || '',
                            last_name: userData.lastName || '',
                            ...userData
                        }
                    }
                })

                if (error) throw error

                // Si el email no está confirmado, mostrar mensaje de confirmación
                const needsConfirmation = !data.user?.email_confirmed_at;
                
                return {
                    success: true,
                    user: data.user,
                    session: data.session,
                    needsConfirmation: needsConfirmation,
                    message: needsConfirmation ? 
                        'Revisa tu email para confirmar tu cuenta' : 
                        'Cuenta creada exitosamente'
                }
            } catch (error) {
                console.error('Error signing up:', error)
                return {
                    success: false,
                    error: error.message,
                    message: this.getErrorMessage(error.message)
                }
            }
        },

        // Cerrar sesión
        async signOut() {
            try {
                const { error } = await window.supabase.auth.signOut()
                if (error) throw error

                return {
                    success: true,
                    message: 'Sesión cerrada exitosamente'
                }
            } catch (error) {
                console.error('Error signing out:', error)
                return {
                    success: false,
                    error: error.message,
                    message: 'Error al cerrar sesión'
                }
            }
        },

        // Iniciar sesión con Google
        async signInWithGoogle() {
            try {
                const { data, error } = await window.supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: `${window.location.origin}/html/index.html`
                    }
                })

                if (error) throw error
                return { success: true }
            } catch (error) {
                console.error('Error signing in with Google:', error)
                return {
                    success: false,
                    error: error.message,
                    message: 'Error al iniciar sesión con Google'
                }
            }
        },

        // Iniciar sesión con Facebook
        async signInWithFacebook() {
            try {
                const { data, error } = await window.supabase.auth.signInWithOAuth({
                    provider: 'facebook',
                    options: {
                        redirectTo: `${window.location.origin}/html/index.html`
                    }
                })

                if (error) throw error
                return { success: true }
            } catch (error) {
                console.error('Error signing in with Facebook:', error)
                return {
                    success: false,
                    error: error.message,
                    message: 'Error al iniciar sesión con Facebook'
                }
            }
        },

        // Restablecer contraseña
        async resetPassword(email) {
            try {
                const { error } = await window.supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/html/reset-password.html`
                })

                if (error) throw error

                return {
                    success: true,
                    message: 'Se ha enviado un enlace de recuperación a tu email'
                }
            } catch (error) {
                console.error('Error resetting password:', error)
                return {
                    success: false,
                    error: error.message,
                    message: 'Error al enviar el enlace de recuperación'
                }
            }
        },

        // Obtener usuario actual
        getCurrentUser() {
            return this.user
        },

        // Verificar si el usuario está autenticado
        isAuthenticated() {
            return !!this.user && !!this.session
        },

        // Redireccionar después del login
        redirectAfterLogin() {
            if (!this.user || !this.session) return

            const role =
                this.user.user_metadata?.role ||
                this.user.app_metadata?.role ||
                this.user.user_metadata?.rol ||
                this.user.app_metadata?.rol

            if (role === 'admin') {
                // Si el usuario es admin, lo llevamos al panel de administración
                window.location.href = 'admin.html'
                return
            }

            // Resto de usuarios van a la página de inicio
            if (window.location.pathname.includes('login.html')) {
                window.location.href = 'index.html'
            }
        },

        // Redireccionar después del logout
        redirectAfterLogout() {
            const protectedPages = ['dashboard.html', 'profile.html']
            const currentPage = window.location.pathname.split('/').pop()
            
            if (protectedPages.includes(currentPage)) {
                window.location.href = 'login.html'
            }
        },

        // Traducir mensajes de error
        getErrorMessage(errorMessage) {
            const errorMessages = {
                'Invalid login credentials': 'Credenciales de inicio de sesión inválidas',
                'Email not confirmed': 'Email no confirmado',
                'User already registered': 'El usuario ya está registrado',
                'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
                'Invalid email': 'Email inválido',
                'Signup requires a valid password': 'El registro requiere una contraseña válida',
                'Email rate limit exceeded': 'Límite de emails excedido, intenta más tarde',
                'Too many requests': 'Demasiadas solicitudes, intenta más tarde'
            }

            return errorMessages[errorMessage] || errorMessage
        }
    };

    // Inicializar autenticación cuando Supabase esté listo
    const initAuth = () => {
        if (supabaseReady) {
            auth.init();
        } else {
            setTimeout(initAuth, 100);
        }
    };
    initAuth();

    // Toggle between login and signup forms
    function showLogin() {
        loginToggle.classList.add('active');
        signupToggle.classList.remove('active');
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
    }

    function showSignup() {
        signupToggle.classList.add('active');
        loginToggle.classList.remove('active');
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
    }

    // Event listeners for toggle buttons
    loginToggle.addEventListener('click', showLogin);
    signupToggle.addEventListener('click', showSignup);

    // Message display function
    function showMessage(element, text, type = 'error') {
        element.textContent = text;
        element.className = `message ${type}`;
        element.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }

    // Set loading state for buttons
    function setLoading(button, isLoading, originalText) {
        button.disabled = isLoading;
        button.textContent = isLoading ? 'Cargando...' : originalText;
    }

    // Email validation
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Password validation
    function isValidPassword(password) {
        return password.length >= 8;
    }

    // Login form handler
    loginFormElement.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!supabaseReady) {
            showMessage(loginMessage, 'Sistema de autenticación cargando...');
            return;
        }
        
        const formData = new FormData(loginFormElement);
        const email = formData.get('email');
        const password = formData.get('password');
        const submitButton = loginFormElement.querySelector('button[type="submit"]');

        // Basic validation
        if (!email || !password) {
            showMessage(loginMessage, 'Por favor, complete todos los campos.');
            return;
        }

        if (!isValidEmail(email)) {
            showMessage(loginMessage, 'Por favor, ingrese un email válido.');
            return;
        }

        setLoading(submitButton, true, 'Iniciar Sesión');

        try {
            const result = await auth.signIn(email, password);
            
            if (result.success) {
                showMessage(loginMessage, result.message, 'success');
                // Actualizar estado de navbar
                auth.updateNavbarAuthState(result.user);
                // La redirección ahora la maneja redirectAfterLogin según el rol
            } else {
                showMessage(loginMessage, result.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage(loginMessage, 'Error al iniciar sesión. Intente nuevamente.');
        } finally {
            setLoading(submitButton, false, 'Iniciar Sesión');
        }
    });

    // Signup form handler
    signupFormElement.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!supabaseReady) {
            showMessage(signupMessage, 'Sistema de autenticación cargando...');
            return;
        }
        
        const formData = new FormData(signupFormElement);
        const firstname = formData.get('firstname');
        const lastname = formData.get('lastname');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const submitButton = signupFormElement.querySelector('button[type="submit"]');

        // Basic validation
        if (!firstname || !lastname || !email || !password || !confirmPassword) {
            showMessage(signupMessage, 'Por favor, complete todos los campos obligatorios.');
            return;
        }

        if (!isValidEmail(email)) {
            showMessage(signupMessage, 'Por favor, ingrese un email válido.');
            return;
        }

        if (!isValidPassword(password)) {
            showMessage(signupMessage, 'La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            showMessage(signupMessage, 'Las contraseñas no coinciden.');
            return;
        }

        setLoading(submitButton, true, 'Crear Cuenta');

        try {
            const userData = {
                firstName: firstname,
                lastName: lastname
            };
            
            const result = await auth.signUp(email, password, userData);
            
            if (result.success) {
                showMessage(signupMessage, result.message, 'success');
                
                // Mostrar toast de confirmación de email si es necesario
                if (result.needsConfirmation && window.SolareToast) {
                    window.SolareToast.info('Se envió un correo al email, esperando confirmación', 6000);
                }
                
                // Switch to login form after successful registration
                setTimeout(() => {
                    showLogin();
                    // Pre-fill email in login form
                    document.getElementById('login-email').value = email;
                    showMessage(loginMessage, 'Cuenta creada. Ahora puede iniciar sesión.', 'success');
                }, 2000);
            } else {
                showMessage(signupMessage, result.message);
            }
        } catch (error) {
            console.error('Signup error:', error);
            showMessage(signupMessage, 'Error al crear la cuenta. Intente nuevamente.');
        } finally {
            setLoading(submitButton, false, 'Crear Cuenta');
        }
    });

    // Clear messages when user starts typing
    function setupMessageClear(form, messageElement) {
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                if (messageElement.style.display === 'block') {
                    messageElement.style.display = 'none';
                }
            });
        });
    }

    setupMessageClear(loginFormElement, loginMessage);
    setupMessageClear(signupFormElement, signupMessage);

    // Social button handlers
    const socialButtons = document.querySelectorAll('.btn-social');
    socialButtons.forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            
            if (!supabaseReady) {
                alert('Sistema de autenticación cargando...');
                return;
            }
            
            const provider = this.textContent.trim().toLowerCase();
            
            try {
                let result;
                if (provider === 'google') {
                    result = await auth.signInWithGoogle();
                } else if (provider === 'facebook') {
                    result = await auth.signInWithFacebook();
                }
                
                if (result && !result.success) {
                    showMessage(loginMessage, result.message);
                }
            } catch (error) {
                console.error(`${provider} login error:`, error);
                showMessage(loginMessage, `Error al iniciar sesión con ${provider}`);
            }
        });
    });

    // Password visibility toggle functionality
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            const eyeIcon = this.querySelector('.eye-icon');
            const eyeOffIcon = this.querySelector('.eye-off-icon');
            
            if (passwordInput.type === 'password') {
                // Show password
                passwordInput.type = 'text';
                eyeIcon.style.display = 'none';
                eyeOffIcon.style.display = 'block';
            } else {
                // Hide password
                passwordInput.type = 'password';
                eyeIcon.style.display = 'block';
                eyeOffIcon.style.display = 'none';
            }
        });
    });

    // Initialize with login form active
    showLogin();
});
