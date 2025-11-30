# Configuración de Variables de Entorno para Netlify

Este archivo documenta cómo configurar las variables de entorno en Netlify para tu proyecto Solare.

## 🔑 Variables de Entorno Requeridas

### En Netlify Dashboard

1. Ve a tu sitio en Netlify
2. Navega a **Site settings** > **Environment variables**
3. Añade las siguientes variables:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `SUPABASE_URL` | `https://ntendpncnxxrozblooaj.supabase.co` | URL de tu proyecto Supabase |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Clave anónima de Supabase |

### Valores Actuales

**SUPABASE_URL:**
```
https://ntendpncnxxrozblooaj.supabase.co
```

**SUPABASE_ANON_KEY:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50ZW5kcG5jbnh4cm96Ymxvb2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NzQwMzQsImV4cCI6MjA3OTM1MDAzNH0.L3eF7v4u1eqa0E1eVskTgS7R-WYxMZPf2lzDtcnj2Ls
```

## 📝 Notas Importantes

1. **Seguridad:** La `SUPABASE_ANON_KEY` es segura para usar en el frontend. Supabase usa Row Level Security (RLS) para proteger tus datos.

2. **Actualización:** Si cambias de proyecto Supabase, actualiza estas variables en:
   - Netlify Dashboard (Environment variables)
   - Archivo `js/supabase.js` (para desarrollo local)

3. **Desarrollo Local:** Para desarrollo local, puedes:
   - Usar directamente las credenciales en `js/supabase.js`
   - O crear un archivo `.env` (no se subirá a Git)

## 🚀 Después de Configurar

1. **Redeploy:** Después de añadir las variables, haz un redeploy del sitio:
   - Netlify > Deploys > Trigger deploy > Deploy site

2. **Verificar:** Abre tu sitio y verifica en la consola del navegador:
   - Deberías ver: "Supabase client initialized successfully"
   - No deberías ver errores de autenticación

## 🔗 Enlaces Rápidos

- [Netlify Environment Variables Docs](https://docs.netlify.com/environment-variables/overview/)
- [Supabase Dashboard](https://supabase.com/dashboard/project/ntendpncnxxrozblooaj)
- [Obtener credenciales de Supabase](https://supabase.com/dashboard/project/ntendpncnxxrozblooaj/settings/api)
