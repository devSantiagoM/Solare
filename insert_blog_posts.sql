-- Add category column safely
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Insert Sample Data (Featured Articles)
-- Using 'true' as a string literal to ensure correct boolean casting
INSERT INTO public.blog_posts (title, slug, excerpt, content, featured_image, published_at, category, is_active)
VALUES
(
    'Nueva Colección Otoño-Invierno 2024', 
    'nueva-coleccion-otono-invierno-2024', 
    'Descubre nuestra nueva colección inspirada en la elegancia atemporal y la sofisticación urbana. Piezas únicas que definen el estilo contemporáneo.', 
    '<p>Nuestra nueva colección Otoño-Invierno 2024 llega para redefinir la elegancia contemporánea. Inspirada en la arquitectura moderna y los tonos tierra de la temporada, cada prenda ha sido diseñada pensando en la mujer actual.</p>
    <h2>Elegancia Atemporal</h2>
    <p>Los abrigos de lana estructurados y los tejidos de punto suave son los protagonistas de esta temporada. Hemos seleccionado cuidadosamente materiales que no solo aportan calidez, sino que también garantizan una durabilidad excepcional.</p>
    <blockquote>"La moda es arquitectura: es una cuestión de proporciones." - Coco Chanel</blockquote>
    <p>Esta colección busca el equilibrio perfecto entre comodidad y estilo, permitiéndote transitar del día a la noche con total naturalidad.</p>',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2020&auto=format&fit=crop', 
    '2024-01-15 10:00:00+00', 
    'coleccion',
    'true'
),
(
    'Compromiso con la Moda Sostenible', 
    'compromiso-moda-sostenible', 
    'Nuestro compromiso con el medio ambiente a través de materiales eco-friendly y procesos responsables.', 
    '<p>En Solare, creemos que la moda no debe costar el planeta. Por eso, nos enorgullece anunciar nuestros nuevos estándares de sostenibilidad para 2024.</p>
    <h2>Materiales Eco-Friendly</h2>
    <p>Hemos incrementado el uso de algodón orgánico y poliéster reciclado en un 40% en todas nuestras líneas. Nuestros proveedores cuentan con certificaciones internacionales que garantizan prácticas éticas y responsables.</p>
    <p>El camino hacia la sostenibilidad es largo, pero cada paso cuenta. Te invitamos a ser parte de este cambio eligiendo prendas que respetan el medio ambiente.</p>',
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1974&auto=format&fit=crop', 
    '2024-01-12 14:30:00+00', 
    'sostenibilidad',
    'true'
),
(
    '5 Tendencias que Marcarán el 2024', 
    '5-tendencias-2024', 
    'Las tendencias más importantes que definirán la moda este año según nuestros expertos.', 
    '<p>El 2024 se perfila como un año de contrastes en el mundo de la moda. Desde el regreso del minimalismo de los 90 hasta la explosión de colores vibrantes, aquí te presentamos lo que no puede faltar en tu armario.</p>
    <h3>1. El Nuevo Minimalismo</h3>
    <p>Líneas limpias, colores neutros y cortes impecables. Menos es definitivamente más esta temporada.</p>
    <h3>2. Sostenibilidad Visible</h3>
    <p>Prendas que cuentan una historia sobre su origen y fabricación. La transparencia es la nueva tendencia.</p>
    <h3>3. Accesorios Oversize</h3>
    <p>Bolsos grandes y joyería llamativa para complementar looks sencillos.</p>',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop', 
    '2024-01-10 09:15:00+00', 
    'tendencias',
    'true'
);
