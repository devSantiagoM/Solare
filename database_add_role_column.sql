-- Script para agregar columna 'role' a la tabla profiles
-- Ejecutar este script en el SQL Editor de Supabase

-- Agregar columna role si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN role VARCHAR(20) DEFAULT 'usuario' 
        CHECK (role IN ('usuario', 'admin', 'administrador'));
        
        -- Crear índice para búsquedas rápidas por role
        CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
        
        -- Comentario en la columna
        COMMENT ON COLUMN public.profiles.role IS 'Rol del usuario: usuario, admin o administrador';
    END IF;
END $$;

-- Actualizar usuarios existentes sin role
UPDATE public.profiles 
SET role = 'usuario' 
WHERE role IS NULL;

-- Opcional: Asignar role de admin a un usuario específico
-- Reemplaza 'email@ejemplo.com' con el email del usuario que quieres hacer admin
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE email = 'email@ejemplo.com';

