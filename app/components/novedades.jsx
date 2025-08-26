// Importaciones necesarias para el componente Novedades
import FlowingMenu from "./flowingMenu"; // Componente de menú interactivo
import '../components/style/novedades.css'; // Estilos específicos del componente

// Datos de ejemplo para las categorías de productos
const demoItems = [
    { link: '#', text: 'Mujeres', image: 'https://picsum.photos/600/400?random=1' }, // Categoría mujeres
    { link: '#', text: 'Niñas/os', image: 'https://picsum.photos/600/400?random=2' }, // Categoría niños
    { link: '#', text: 'Hombres', image: 'https://picsum.photos/600/400?random=3' }   // Categoría hombres
];

// Componente Novedades - Sección de categorías de productos
export default function Novedades() {
    return(
        // Contenedor principal de la sección novedades
        <div id="novedades" className="novedades-container">
            {/* Título de la sección */}
            <h2 className="novedades-title">Novedades</h2>
            
            {/* Contenedor del menú interactivo */}
            <div className="flowing-menu-wrapper">
                {/* Componente de menú con efectos de hover y animaciones */}
                <FlowingMenu items={demoItems} />
            </div>
        </div>
    );
}

