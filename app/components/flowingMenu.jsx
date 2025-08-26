'use client'; // Directiva para indicar que es un componente del lado del cliente
import React from 'react'; // Importación de React
import { gsap } from 'gsap'; // Biblioteca de animaciones

import '../components/style/flowingMenu.css'; // Estilos específicos del menú

// Componente principal FlowingMenu - Menú interactivo con efectos de hover
function FlowingMenu({ items = [] }) {
  return (
    // Contenedor principal del menú
    <div className="menu-wrap">
      {/* Navegación que contiene todos los elementos del menú */}
      <nav className="menu">
        {/* Renderizado de cada elemento del menú */}
        {items.map((item, idx) => (
          <MenuItem key={idx} {...item} />
        ))}
      </nav>
    </div>
  );
}

// Componente individual de cada elemento del menú
function MenuItem({ link, text, image }) {
  // Referencias para manipulación del DOM
  const itemRef = React.useRef(null); // Referencia al contenedor del elemento
  const marqueeRef = React.useRef(null); // Referencia al marquee (efecto deslizante)
  const marqueeInnerRef = React.useRef(null); // Referencia al contenido interno del marquee

  // Configuración por defecto para las animaciones GSAP
  const animationDefaults = { duration: 0.6, ease: 'expo' };

  // Función para encontrar el borde más cercano al cursor
  const findClosestEdge = (mouseX, mouseY, width, height) => {
    // Calcula la distancia al borde superior
    const topEdgeDist = distMetric(mouseX, mouseY, width / 2, 0);
    // Calcula la distancia al borde inferior
    const bottomEdgeDist = distMetric(mouseX, mouseY, width / 2, height);
    // Retorna el borde más cercano
    return topEdgeDist < bottomEdgeDist ? 'top' : 'bottom';
  };

  // Función para calcular la distancia euclidiana entre dos puntos
  const distMetric = (x, y, x2, y2) => {
    const xDiff = x - x2;
    const yDiff = y - y2;
    return xDiff * xDiff + yDiff * yDiff; // Distancia al cuadrado (más eficiente)
  };

  // Manejador del evento mouse enter
  const handleMouseEnter = (ev) => {
    // Verificación de que todas las referencias existen
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    
    // Obtiene las dimensiones y posición del elemento
    const rect = itemRef.current.getBoundingClientRect();
    const x = ev.clientX - rect.left; // Posición X relativa al elemento
    const y = ev.clientY - rect.top;  // Posición Y relativa al elemento
    const edge = findClosestEdge(x, y, rect.width, rect.height); // Borde más cercano

    // Animación de entrada del marquee
    gsap.timeline({ defaults: animationDefaults })
      .set(marqueeRef.current, { y: edge === 'top' ? '-101%' : '101%' }, 0) // Posición inicial
      .set(marqueeInnerRef.current, { y: edge === 'top' ? '101%' : '-101%' }, 0) // Posición inicial
      .to([marqueeRef.current, marqueeInnerRef.current], { y: '0%' }, 0); // Animación a posición final
  };

  // Manejador del evento mouse leave
  const handleMouseLeave = (ev) => {
    // Verificación de que todas las referencias existen
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    
    // Obtiene las dimensiones y posición del elemento
    const rect = itemRef.current.getBoundingClientRect();
    const x = ev.clientX - rect.left; // Posición X relativa al elemento
    const y = ev.clientY - rect.top;  // Posición Y relativa al elemento
    const edge = findClosestEdge(x, y, rect.width, rect.height); // Borde más cercano

    // Animación de salida del marquee
    gsap.timeline({ defaults: animationDefaults })
      .to(marqueeRef.current, { y: edge === 'top' ? '-101%' : '101%' }, 0) // Animación a posición inicial
      .to(marqueeInnerRef.current, { y: edge === 'top' ? '101%' : '-101%' }, 0); // Animación a posición inicial
  };

  // Genera el contenido repetido del marquee (4 veces para efecto continuo)
  const repeatedMarqueeContent = Array.from({ length: 4 }).map((_, idx) => (
    <React.Fragment key={idx}>
      {/* Texto del elemento */}
      <span>{text}</span>
      {/* Imagen del elemento */}
      <div
        className="marquee__img"
        style={{ backgroundImage: `url(${image})` }}
      />
    </React.Fragment>
  ));

  return (
    // Contenedor individual de cada elemento del menú
    <div className="menu__item" ref={itemRef}>
      {/* Enlace principal del elemento */}
      <a
        className="menu__item-link"
        href={link}
        onMouseEnter={handleMouseEnter} // Evento de entrada del mouse
        onMouseLeave={handleMouseLeave}  // Evento de salida del mouse
      >
        {text}
      </a>
      
      {/* Contenedor del efecto marquee (deslizante) */}
      <div className="marquee" ref={marqueeRef}>
        {/* Contenedor interno del marquee */}
        <div className="marquee__inner-wrap" ref={marqueeInnerRef}>
          {/* Contenido interno con animación continua */}
          <div className="marquee__inner" aria-hidden="true">
            {repeatedMarqueeContent}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlowingMenu;
