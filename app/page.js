// Importación de componentes principales
import Hero from "./components/hero";
import Novedades from "./components/novedades";
import { Footer } from "./components/layout/footer";

// Componente principal de la página de inicio
export default function Home() {
  return (
    <>
      {/* Sección Hero - Banner principal con título y botón de acción */}
      <Hero />
      {/* Sección Novedades - Menú interactivo con categorías de productos */}
      <Novedades/>
       {/* Sección Footer  */}
       <Footer/>
    </>
  );
}
