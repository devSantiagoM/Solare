// Importaciones necesarias para el componente Hero
import Aurora from './background/aurora'; // Componente de efecto aurora animado
import '../components/style/hero.css'; // Estilos específicos del hero
import Link from 'next/link'; // Componente de enlace de Next.js

// Componente Hero - Banner principal de la página
export default function Hero() {
  return (
    // Contenedor principal del hero con altura completa de pantalla
    <div className="hero-container">
      {/* Fondo con gradiente azul que cubre desde el top hasta el final del hero */}
      <div className="hero-gradient-bg"></div>
      
      {/* Efecto aurora animado con colores azules y púrpuras */}
      <Aurora
        colorStops={["#22049A", "#3C00FF", "#03104F"]} // Colores del gradiente aurora
        blend={0} // Nivel de mezcla
        amplitude={1.0} // Amplitud de la animación
        speed={0.5} // Velocidad de la animación
      />

      {/* Contenido principal centrado */}
      <div className="hero-content">
        {/* Título principal de la marca */}
        <h1 className="hero-title">
          SOLARE
        </h1>
        
        {/* Subtítulo descriptivo */}
        <p className="hero-subtitle">
          BRAZILIAN FASHION
        </p>

        {/* Botón de llamada a la acción */}
        <Link
          href="#novedades"
          className="hero-button"
        >
          <span>Explorar</span>
          <span className="text-xl">→</span>
        </Link>
      </div>
    </div>
  );
}
