-- Seed initial collections (Corrected column name: title)
INSERT INTO public.collections (title, slug, description, is_active)
VALUES 
  ('Nuevos Llegados', 'nuevos-llegados', 'Lo último en tendencias', true),
  ('Invierno Otoño', 'invierno-otono', 'Colección para el frío', true),
  ('Primavera Verano', 'primavera-verano', 'Estilos frescos para el calor', true)
ON CONFLICT (slug) DO NOTHING;
