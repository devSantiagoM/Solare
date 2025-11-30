# Guía de Configuración de Netlify y Supabase

## 📋 Configuración de Netlify

### 1. Despliegue Inicial

1. **Conectar repositorio a Netlify:**
   - Ve a [Netlify](https://app.netlify.com/)
   - Click en "Add new site" > "Import an existing project"
   - Conecta tu repositorio de GitHub/GitLab/Bitbucket

2. **Configuración de Build:**
   - **Build command:** `echo 'No build command needed for static site'`
   - **Publish directory:** `.` (punto, para publicar desde la raíz)
   - **Branch to deploy:** `main` (o tu rama principal)

### 2. Variables de Entorno en Netlify

Ve a **Site settings > Environment variables** y añade:

```
SUPABASE_URL = https://ntendpncnxxrozblooaj.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50ZW5kcG5jbnh4cm96Ymxvb2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NzQwMzQsImV4cCI6MjA3OTM1MDAzNH0.L3eF7v4u1eqa0E1eVskTgS7R-WYxMZPf2lzDtcnj2Ls
```

> ⚠️ **IMPORTANTE:** Estas son tus credenciales actuales. Si cambias de proyecto Supabase, actualiza estos valores.

### 3. Configuración del archivo netlify.toml

El archivo `netlify.toml` ya está configurado con:

- ✅ Redirects para todas las páginas HTML
- ✅ Redirect de la raíz (/) a /html/index.html
- ✅ Headers de seguridad (CSP, X-Frame-Options, etc.)
- ✅ Cache optimizado para assets estáticos
- ✅ Configuración de Content-Security-Policy para Supabase

### 4. Rutas del Proyecto

Tu proyecto tiene la siguiente estructura:
```
/
├── html/           # Archivos HTML
│   ├── index.html
│   ├── productos.html
│   ├── carrito.html
│   └── ...
├── css/            # Hojas de estilo
├── js/             # Scripts JavaScript
└── assets/         # Imágenes y recursos
```

**Rutas configuradas:**
- `/` → `/html/index.html`
- `/productos.html` → `/html/productos.html`
- `/carrito.html` → `/html/carrito.html`
- Y así para todas las páginas...

## 🗄️ Configuración de Supabase

### 1. Credenciales Actuales

Tu proyecto está usando:
- **URL:** `https://ntendpncnxxrozblooaj.supabase.co`
- **Anon Key:** (ver en `js/supabase.js`)

### 2. Configuración en Supabase Dashboard

1. **Authentication:**
   - Ve a Authentication > Settings
   - Añade tu dominio de Netlify a "Site URL": `https://tu-sitio.netlify.app`
   - Añade también a "Redirect URLs": `https://tu-sitio.netlify.app/**`

2. **Storage (si usas almacenamiento):**
   - Ve a Storage > Policies
   - Configura las políticas RLS según tus necesidades

3. **Database:**
   - Asegúrate de que las políticas RLS estén configuradas
   - Verifica que las tablas tengan los permisos correctos

### 3. Tablas Principales

Tu base de datos incluye:
- `products` - Productos
- `categories` - Categorías
- `collections` - Colecciones
- `product_reviews` - Reseñas
- `orders` - Pedidos
- `profiles` - Perfiles de usuario
- `coupons` - Cupones de descuento

## 🚀 Despliegue

### Despliegue Automático

Cada vez que hagas push a tu rama principal, Netlify desplegará automáticamente.

### Despliegue Manual

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Desplegar
netlify deploy --prod
```

## 🔍 Verificación

### 1. Verificar que el sitio carga correctamente:
- Visita `https://tu-sitio.netlify.app`
- Debería cargar `/html/index.html`

### 2. Verificar rutas:
- `/productos.html` → Debe cargar la página de productos
- `/carrito.html` → Debe cargar el carrito
- Etc.

### 3. Verificar Supabase:
- Abre la consola del navegador (F12)
- Deberías ver: "Supabase client initialized successfully"
- No deberías ver errores de CORS

### 4. Verificar autenticación:
- Intenta registrarte/iniciar sesión
- Verifica que funcione correctamente

## 🐛 Solución de Problemas

### Error: "Failed to load resource: 404"
- Verifica que las rutas en `netlify.toml` estén correctas
- Asegúrate de que los archivos existan en la carpeta `html/`

### Error: "CORS policy"
- Verifica que el dominio esté añadido en Supabase > Authentication > Settings
- Revisa el Content-Security-Policy en `netlify.toml`

### Error: "Supabase client not initialized"
- Verifica que `js/supabase.js` se cargue correctamente
- Revisa las credenciales en las variables de entorno

### Las rutas relativas no funcionan
- Asegúrate de que `publish = "."` esté en `netlify.toml`
- Verifica que las rutas en HTML usen `../` correctamente (ej: `../css/global.css`)

## 📝 Notas Adicionales

1. **Seguridad:**
   - Las credenciales de Supabase (anon key) son seguras para usar en el frontend
   - Las políticas RLS en Supabase protegen tus datos
   - Nunca expongas la service_role_key en el frontend

2. **Performance:**
   - Los assets CSS/JS tienen cache de 1 año (inmutable)
   - Las imágenes también están cacheadas
   - Considera usar WebP para imágenes

3. **SEO:**
   - Añade meta tags apropiados en cada página HTML
   - Considera añadir un sitemap.xml
   - Configura redirects 301 para URLs antiguas si las hay

## 🔗 Enlaces Útiles

- [Netlify Docs](https://docs.netlify.com/)
- [Supabase Docs](https://supabase.com/docs)
- [Tu Dashboard de Netlify](https://app.netlify.com/)
- [Tu Dashboard de Supabase](https://supabase.com/dashboard)
