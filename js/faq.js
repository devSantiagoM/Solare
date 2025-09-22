// FAQ logic - tabs, search, and render
(function(){
  'use strict';

  const el = (s, c=document) => c.querySelector(s);
  const els = (s, c=document) => Array.from(c.querySelectorAll(s));

  const DATA = {
    general: [
      { q: '¿Cuál es la política de garantía?', a: 'Todos nuestros productos cuentan con garantía por defectos de fabricación durante 6 meses desde la compra.' },
      { q: '¿Emitís factura?', a: 'Sí, emitimos factura A o B. Podés solicitarla respondiendo al mail de confirmación de compra con tus datos fiscales.' },
    ],
    envios: [
      { q: '¿Cuánto demora el envío?', a: 'CABA: 24-48 hs. Interior: 3 a 7 días hábiles.' },
      { q: '¿Tienen envío gratis?', a: 'Sí, en compras desde $100 el envío es gratis a todo el país.' },
    ],
    pagos: [
      { q: '¿Qué medios de pago aceptan?', a: 'Tarjetas de crédito/débito, transferencia y plataformas locales.' },
      { q: '¿Puedo pagar en cuotas?', a: 'Sí, ofrecemos cuotas según promociones vigentes.' },
    ],
    cambios: [
      { q: '¿Cómo realizo un cambio?', a: 'Podés gestionarlo dentro de los 30 días de tu compra. Escribinos con tu número de orden y te enviamos las instrucciones.' },
      { q: '¿Tienen costo las devoluciones?', a: 'Si es por falla, no. Por disconformidad, el costo del envío corre por cuenta del comprador.' },
    ],
    cuentas: [
      { q: 'Olvidé mi contraseña', a: 'Ingresá a Iniciar Sesión y hacé click en “Olvidé mi contraseña” para restablecerla.' },
      { q: '¿Cómo actualizo mis datos?', a: 'Desde tu cuenta, sección Perfil, podés actualizar tus datos y direcciones.' },
    ]
  };

  function renderList(cat, query=''){
    const list = el('#faqList');
    const tpl = el('#faq-item-template');
    if (!list || !tpl) return;

    list.innerHTML = '';
    list.dataset.cat = cat;

    const items = (DATA[cat] || []).filter(item => {
      if (!query) return true;
      const q = query.toLowerCase();
      return item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
    });

    if (!items.length){
      const empty = document.createElement('p');
      empty.textContent = 'No se encontraron resultados para tu búsqueda.';
      empty.style.color = '#666';
      list.appendChild(empty);
      return;
    }

    const frag = document.createDocumentFragment();
    items.forEach((it, i) => {
      const node = tpl.content.cloneNode(true);
      const root = node.querySelector('.faq-item');
      node.querySelector('.faq-question').textContent = it.q;
      node.querySelector('.faq-answer').textContent = it.a;
      root.dataset.id = `${cat}-${i}`;
      frag.appendChild(node);
    });
    list.appendChild(frag);
  }

  function setActiveTab(btn){
    els('.tab').forEach(b => b.classList.toggle('active', b === btn));
  }

  function init(){
    const defaultCat = 'general';
    renderList(defaultCat);

    // Tabs
    els('.tab').forEach(btn => {
      btn.addEventListener('click', () => {
        setActiveTab(btn);
        const cat = btn.dataset.cat;
        const q = el('#faqSearch')?.value || '';
        renderList(cat, q);
      });
    });

    // Search
    const search = el('#faqSearch');
    if (search){
      search.addEventListener('input', () => {
        const active = el('.tab.active')?.dataset.cat || defaultCat;
        renderList(active, search.value.trim());
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
