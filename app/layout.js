// Importaciones necesarias para el layout principal
import NavWrapper from './components/layout/navWrapper'; // Componente de navegación
import './globals.css'; // Estilos globales de la aplicación

// Metadatos de la aplicación
export const metadata = {
  title: 'SOLARE - Brazilian Fashion', // Título de la página
  description: 'Descubre la moda brasileña con SOLARE', // Descripción para SEO
};

// Layout principal de la aplicación
export default function RootLayout({ children }) {
  return (
    <html>
       <body>
        {/* Componente de navegación (header) */}
        <NavWrapper />
        {/* Contenido principal de la página */}
        {children}
      </body>
    </html>
     
  );
}
