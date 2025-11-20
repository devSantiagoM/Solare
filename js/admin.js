document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('admin-status');
  const emailEl = document.getElementById('admin-user-email');
  const roleEl = document.getElementById('admin-user-role');
  const btnHome = document.getElementById('btn-go-home');
  const btnLogout = document.getElementById('btn-logout');

  const supabase = window.supabase;

  const setStatus = (text) => {
    if (statusEl) statusEl.textContent = text;
  };

  const setUserInfo = (user) => {
    if (!user) return;
    if (emailEl) emailEl.textContent = user.email || 'Sin email';
    const role =
      user.user_metadata?.role ||
      user.app_metadata?.role ||
      user.user_metadata?.rol ||
      user.app_metadata?.rol ||
      'usuario';
    if (roleEl) roleEl.textContent = `Rol: ${role}`;
  };

  const ensureAdminSession = async () => {
    if (!supabase) {
      setStatus('Error: cliente de autenticación no disponible.');
      return;
    }

    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      setStatus('No hay sesión activa. Redirigiendo al inicio de sesión...');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
      return;
    }

    const user = data.session.user;
    setUserInfo(user);

    const role =
      user.user_metadata?.role ||
      user.app_metadata?.role ||
      user.user_metadata?.rol ||
      user.app_metadata?.rol;
    if (role !== 'admin') {
      setStatus('No tienes permisos para acceder a este panel.');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
      return;
    }

    setStatus('Acceso concedido. Bienvenido al panel de administración.');
  };

  if (btnHome) {
    btnHome.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      try {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
      } catch (e) {
        console.error('Error al cerrar sesión desde admin:', e);
        alert('No se pudo cerrar sesión. Intenta nuevamente.');
      }
    });
  }

  ensureAdminSession();
});
