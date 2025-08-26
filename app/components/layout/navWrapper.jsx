'use client'; // Directiva para indicar que es un componente del lado del cliente

// Importaciones necesarias para el componente NavWrapper
import { usePathname } from 'next/navigation'; // Hook para obtener la ruta actual
import Link from 'next/link'; // Componente de enlace de Next.js
import { ShoppingCart, LogIn } from 'lucide-react'; // Iconos de Lucide React
import CardNav from './cardnav'; // Componente de navegación con tarjetas
import next from '../../../public/next.svg'; // Logo de la empresa
import './navWrapper.css'; // Estilos específicos del navWrapper

// Componente NavWrapper - Header principal de la aplicación
export default function NavWrapper() {
  // Hook para obtener la ruta actual
  const pathname = usePathname();

  // Rutas donde NO debe mostrarse el navbar (páginas de autenticación y admin)
  const noNavRoutes = ['/login', '/register', '/auth/reset', '/admin'];

  // Verifica si debe ocultar el navbar basado en la ruta actual
  const shouldHideNav = noNavRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Detectar si estamos en la página principal para aplicar el fondo del hero
  const isHomePage = pathname === '/';

  // Configuración de los elementos del menú de navegación
  const items = [
    {
      label: "About", // Etiqueta del menú
      bgColor: "#0D0716", // Color de fondo de la tarjeta
      textColor: "#fff", // Color del texto
      links: [
        { label: "Company", ariaLabel: "About Company",href:"/login" }, // Enlace a información de la empresa
        { label: "Careers", ariaLabel: "About Careers",href:"/login" }, // Enlace a carreras
        {label: "FAQ's",ariaLabel:"About FAQ's",href:"/login"} // Enlace a preguntas frecuentes
      ]
    },
    {
      label: "Projects", // Etiqueta del menú
      bgColor: "#170D27", // Color de fondo de la tarjeta
      textColor: "#fff", // Color del texto
      links: [
        { label: "Featured", ariaLabel: "Featured Projects",href:"/login" }, // Enlace a proyectos destacados
        { label: "Case Studies", ariaLabel: "Project Case Studies",href:"/login" } // Enlace a casos de estudio
      ]
    },
    {
      label: "Contact", // Etiqueta del menú
      bgColor: "#271E37", // Color de fondo de la tarjeta
      textColor: "#fff", // Color del texto
      links: [
        { label: "Email", ariaLabel: "Email us",href:"/login" }, // Enlace para enviar email
        { label: "Twitter", ariaLabel: "Twitter",href:"/login" }, // Enlace a Twitter
        { label: "LinkedIn", ariaLabel: "LinkedIn",href:"/login" } // Enlace a LinkedIn
      ]
    }
  ];

  // Si debe ocultar el navbar, no renderiza nada
  if (shouldHideNav) return null;

  return (
    // Contenedor principal del navbar con clase condicional para el fondo del hero
    <div className={`nav-wrapper-container z-20 ${isHomePage ? 'hero-bg' : ''}`}>
      {/* Botón de Login a la izquierda */}
      <div className="nav-side-button nav-left">
        <Link href="/login" className="nav-button">
          <LogIn size={20} /> {/* Icono de login */}
          <span>Login</span> {/* Texto del botón */}
        </Link>
      </div>

      {/* CardNav en el centro - Navegación principal */}
      <div className="nav-center">
        <CardNav
          logo={next} // Logo de la empresa
          logoAlt="Company Logo" // Texto alternativo del logo
          items={items} // Elementos del menú
          baseColor="#fff" // Color base
          menuColor="#000" // Color del menú
          buttonBgColor="#111" // Color de fondo del botón
          buttonTextColor="#fff" // Color del texto del botón
          ease="power3.out" // Tipo de animación
        />
      </div>

      {/* Botón de Carrito a la derecha */}
      <div className="nav-side-button nav-right">
        <button className="nav-button">
          <ShoppingCart size={20} /> {/* Icono del carrito */}
          <span>Carrito</span> {/* Texto del botón */}
        </button>
      </div>
    </div>
  );
}
