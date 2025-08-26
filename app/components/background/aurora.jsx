'use client'; // Directiva para indicar que es un componente del lado del cliente

// Importaciones necesarias para el componente Aurora
import { Renderer, Program, Mesh, Color, Triangle } from "ogl"; // Biblioteca WebGL
import { useEffect, useRef } from "react"; // Hooks de React

import './aurora.css'; // Estilos específicos del componente

// ===== SHADERS GLSL =====

// Vertex Shader - Define la posición de los vértices
const VERT = `#version 300 es
in vec2 position; // Posición de entrada del vértice
void main() {
  gl_Position = vec4(position, 0.0, 1.0); // Posición de salida (x, y, z, w)
}
`;

// Fragment Shader - Define el color y efectos visuales
const FRAG = `#version 300 es
precision highp float; // Precisión alta para cálculos

// Uniforms (variables globales del shader)
uniform float uTime; // Tiempo para animaciones
uniform float uAmplitude; // Amplitud del efecto aurora
uniform vec3 uColorStops[3]; // Colores del gradiente
uniform vec2 uResolution; // Resolución de la pantalla
uniform float uBlend; // Nivel de mezcla

out vec4 fragColor; // Color de salida del fragmento

// Función de permutación para ruido
vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

// Función de ruido Simplex (Simplex Noise)
float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy)); // Coordenadas de la celda
  vec2 x0 = v - i + dot(i, C.xx); // Posición relativa dentro de la celda
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0); // Dirección del gradiente
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  // Generación de gradientes
  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  // Cálculo de contribuciones
  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ), 
      0.0
  );
  m = m * m; // Cuadrado para suavizar
  m = m * m; // Cuadrado nuevamente para más suavizado

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  // Cálculo final del ruido
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Estructura para definir paradas de color en el gradiente
struct ColorStop {
  vec3 color; // Color RGB
  float position; // Posición en el gradiente (0.0 a 1.0)
};

// Macro para interpolación de colores
#define COLOR_RAMP(colors, factor, finalColor) {              \
  int index = 0;                                            \
  for (int i = 0; i < 2; i++) {                               \
     ColorStop currentColor = colors[i];                    \
     bool isInBetween = currentColor.position <= factor;    \
     index = int(mix(float(index), float(i), float(isInBetween))); \
  }                                                         \
  ColorStop currentColor = colors[index];                   \
  ColorStop nextColor = colors[index + 1];                  \
  float range = nextColor.position - currentColor.position; \
  float lerpFactor = (factor - currentColor.position) / range; \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
}

// Función principal del fragment shader
void main() {
  vec2 uv = gl_FragCoord.xy / uResolution; // Coordenadas UV normalizadas
  
  // Configuración de los colores del gradiente
  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0); // Color inicial
  colors[1] = ColorStop(uColorStops[1], 0.5); // Color medio
  colors[2] = ColorStop(uColorStops[2], 1.0); // Color final
  
  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor); // Interpolación de colores
  
  // Generación del efecto aurora usando ruido
  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height); // Función exponencial para intensificar
  height = (uv.y * 2.0 - height + 0.2); // Posición vertical con offset
  float intensity = 0.6 * height; // Intensidad del efecto
  
  // Suavizado del borde del aurora
  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  
  vec3 auroraColor = intensity * rampColor; // Color final del aurora
  
  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha); // Color con transparencia
}
`;

// Componente Aurora - Efecto visual de aurora boreal usando WebGL
export default function Aurora(props) {
  // Extracción de props con valores por defecto
  const {
    colorStops = ["#5227FF", "#7cff67", "#5227FF"], // Colores del gradiente
    amplitude = 1.0, // Amplitud del efecto
    blend = 0.5 // Nivel de mezcla
  } = props;
  
  // Referencia para mantener las props actualizadas
  const propsRef = useRef(props);
  propsRef.current = props;

  // Referencia al contenedor DOM
  const ctnDom = useRef(null);

  // Efecto principal que inicializa WebGL y las animaciones
  useEffect(() => {
    const ctn = ctnDom.current;
    if (!ctn) return;

    // Configuración del renderer WebGL
    const renderer = new Renderer({
      alpha: true, // Habilita transparencia
      premultipliedAlpha: true, // Alpha premultiplicado
      antialias: true // Antialiasing
    });
    const gl = renderer.gl;
    
    // Configuración del contexto WebGL
    gl.clearColor(0, 0, 0, 0); // Color de fondo transparente
    gl.enable(gl.BLEND); // Habilita mezcla
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // Función de mezcla
    gl.canvas.style.backgroundColor = 'transparent'; // Fondo transparente del canvas

    let program; // Programa de shaders

    // Función para redimensionar el canvas
    function resize() {
      if (!ctn) return;
      const width = ctn.offsetWidth;
      const height = ctn.offsetHeight;
      renderer.setSize(width, height);
      if (program) {
        program.uniforms.uResolution.value = [width, height]; // Actualiza resolución
      }
    }
    window.addEventListener("resize", resize);

    // Geometría del triángulo (cubre toda la pantalla)
    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      delete geometry.attributes.uv; // Elimina atributos UV innecesarios
    }

    // Conversión de colores hexadecimales a RGB
    const colorStopsArray = colorStops.map((hex) => {
      const c = new Color(hex);
      return [c.r, c.g, c.b];
    });

    // Creación del programa de shaders
    program = new Program(gl, {
      vertex: VERT, // Vertex shader
      fragment: FRAG, // Fragment shader
      uniforms: {
        uTime: { value: 0 }, // Tiempo inicial
        uAmplitude: { value: amplitude }, // Amplitud
        uColorStops: { value: colorStopsArray }, // Colores
        uResolution: { value: [ctn.offsetWidth, ctn.offsetHeight] }, // Resolución
        uBlend: { value: blend } // Nivel de mezcla
      }
    });

    // Creación del mesh (malla) con geometría y programa
    const mesh = new Mesh(gl, { geometry, program });
    ctn.appendChild(gl.canvas); // Agrega el canvas al DOM

    // Función de animación
    let animateId = 0;
    const update = (t) => {
      animateId = requestAnimationFrame(update); // Loop de animación
      
      // Actualización de uniforms desde las props
      const { time = t * 0.01, speed = 1.0 } = propsRef.current;
      program.uniforms.uTime.value = time * speed * 0.1; // Tiempo animado
      program.uniforms.uAmplitude.value = propsRef.current.amplitude ?? 1.0; // Amplitud
      program.uniforms.uBlend.value = propsRef.current.blend ?? blend; // Mezcla
      
      // Actualización de colores
      const stops = propsRef.current.colorStops ?? colorStops;
      program.uniforms.uColorStops.value = stops.map((hex) => {
        const c = new Color(hex);
        return [c.r, c.g, c.b];
      });
      
      renderer.render({ scene: mesh }); // Renderizado
    };
    animateId = requestAnimationFrame(update);

    resize(); // Redimensionamiento inicial

    // Función de limpieza
    return () => {
      cancelAnimationFrame(animateId); // Cancela la animación
      window.removeEventListener("resize", resize); // Remueve event listener
      if (ctn && gl.canvas.parentNode === ctn) {
        ctn.removeChild(gl.canvas); // Remueve el canvas
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext(); // Libera contexto WebGL
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amplitude]);

  // Contenedor del efecto aurora
  return <div ref={ctnDom} className="aurora-container" />;
}
