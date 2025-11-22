// Supabase Configuration
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ⚠️ IMPORTANTE: Reemplaza con tus credenciales de Supabase
const SUPABASE_URL = 'https://ntendpncnxxrozblooaj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50ZW5kcG5jbnh4cm96Ymxvb2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NzQwMzQsImV4cCI6MjA3OTM1MDAzNH0.L3eF7v4u1eqa0E1eVskTgS7R-WYxMZPf2lzDtcnj2Ls'

// Crear cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Exportar cliente para uso en otros archivos
window.supabase = supabase

console.log('Supabase client initialized successfully')

export { supabase }