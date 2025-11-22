// FAQ logic - tabs, search, and render
(function () {
  'use strict';

  const el = (s, c = document) => c.querySelector(s);
  const els = (s, c = document) => Array.from(c.querySelectorAll(s));

  let faqData = {};

  async function loadFaqData() {
    try {
      if (!window.supabase) return;

      // 1. Cargar categorías
      const { data: categories, error: catError } = await window.supabase
        .from('faq_categories')
        .select('slug, name')
        .order('display_order');

      if (catError) throw catError;

      // 2. Cargar FAQs activas
      const { data: faqs, error: faqError } = await window.supabase
        .from('faqs')
        .select('question, answer, category_slug')
        .eq('is_active', true)
        .order('display_order');

      if (faqError) throw faqError;

      // 3. Organizar datos
      faqData = {};
      categories.forEach(cat => {
        faqData[cat.slug] = [];
      });

      faqs.forEach(item => {
        if (!faqData[item.category_slug]) {
          faqData[item.category_slug] = [];
        }
        faqData[item.category_slug].push({
          q: item.question,
          a: item.answer
        });
      });

    } catch (error) {
      console.error('Error loading FAQs:', error);
    }
  }

  function renderList(cat, query = '') {
    const list = el('#faqList');
    const tpl = el('#faq-item-template');
    if (!list || !tpl) return;

    list.innerHTML = '';
    list.dataset.cat = cat;

    const items = (faqData[cat] || []).filter(item => {
      if (!query) return true;
      const q = query.toLowerCase();
      return item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
    });

    if (!items.length) {
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

      // Add toggle functionality
      const question = node.querySelector('.faq-question');
      question.addEventListener('click', () => {
        root.classList.toggle('active');
      });

      frag.appendChild(node);
    });
    list.appendChild(frag);
  }

  function setActiveTab(btn) {
    els('.tab').forEach(b => b.classList.toggle('active', b === btn));
  }

  async function init() {
    // Wait for Supabase
    if (!window.supabase) {
      setTimeout(init, 100);
      return;
    }

    await loadFaqData();

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
    if (search) {
      search.addEventListener('input', () => {
        const active = el('.tab.active')?.dataset.cat || defaultCat;
        renderList(active, search.value.trim());
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
