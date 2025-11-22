-- Políticas RLS corregidas para evitar recursión infinita
-- Ejecuta esto en el Editor SQL de Supabase

-- PRIMERO: Eliminar políticas anteriores si existen
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can view all categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage discount codes" ON public.discount_codes;
DROP POLICY IF EXISTS "Public can view active collections" ON public.collections;
DROP POLICY IF EXISTS "Admins can manage collections" ON public.collections;

-- Crear función helper para verificar si el usuario es admin (evita recursión)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role IN ('admin', 'staff')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- POLÍTICAS PARA PROFILES (Usuarios)
-- =====================================================

-- Permitir a admins ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT
USING (public.is_admin());

-- Permitir a admins actualizar cualquier perfil
CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE
USING (public.is_admin());

-- =====================================================
-- POLÍTICAS PARA CATEGORIES
-- =====================================================

-- Habilitar RLS en categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Permitir a todos ver categorías activas (para el frontend)
CREATE POLICY "Public can view active categories" ON public.categories
FOR SELECT
USING (is_active = true);

-- Permitir a admins ver todas las categorías
CREATE POLICY "Admins can view all categories" ON public.categories
FOR SELECT
USING (public.is_admin());

-- Permitir a admins crear categorías
CREATE POLICY "Admins can insert categories" ON public.categories
FOR INSERT
WITH CHECK (public.is_admin());

-- Permitir a admins actualizar categorías
CREATE POLICY "Admins can update categories" ON public.categories
FOR UPDATE
USING (public.is_admin());

-- Permitir a admins eliminar categorías
CREATE POLICY "Admins can delete categories" ON public.categories
FOR DELETE
USING (public.is_admin());

-- =====================================================
-- POLÍTICAS PARA PRODUCTS
-- =====================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública de productos activos
CREATE POLICY "Public can view active products" ON public.products
FOR SELECT
USING (is_active = true);

-- Permitir a admins gestionar todos los productos
CREATE POLICY "Admins can manage products" ON public.products
FOR ALL
USING (public.is_admin());

-- =====================================================
-- POLÍTICAS PARA DISCOUNT CODES
-- =====================================================

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage discount codes" ON public.discount_codes
FOR ALL
USING (public.is_admin());

-- =====================================================
-- POLÍTICAS PARA COLLECTIONS
-- =====================================================

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active collections" ON public.collections
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage collections" ON public.collections
FOR ALL
USING (public.is_admin());

-- =====================================================
-- POLÍTICAS PARA OTRAS TABLAS
-- =====================================================

-- Brands: Lectura pública, escritura admins
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active brands" ON public.brands
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage brands" ON public.brands
FOR ALL
USING (public.is_admin());

-- FAQs: Lectura pública de activos, escritura admins
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active faqs" ON public.faqs
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage faqs" ON public.faqs
FOR ALL
USING (public.is_admin());

-- FAQ Categories
ALTER TABLE public.faq_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active faq categories" ON public.faq_categories
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage faq categories" ON public.faq_categories
FOR ALL
USING (public.is_admin());
