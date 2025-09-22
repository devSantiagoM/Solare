// Contacto page interactions and form validation
(function() {
  'use strict';

  const el = (s, c=document) => c.querySelector(s);
  const els = (s, c=document) => Array.from(c.querySelectorAll(s));

  function init() {
    const form = el('#contactForm');
    if (!form) return;

    form.addEventListener('submit', onSubmit);

    // live validation
    ['name','email','topic','message'].forEach(id => {
      const input = el('#' + id);
      if (input) input.addEventListener('input', () => validateField(input));
      if (input && input.tagName === 'SELECT') input.addEventListener('change', () => validateField(input));
    });

    // message counter
    const message = el('#message');
    const counter = el('#messageCounter');
    if (message && counter) {
      const updateCounter = () => {
        const max = Number(message.getAttribute('maxlength')) || 1000;
        counter.textContent = `${message.value.length}/${max}`;
      };
      message.addEventListener('input', updateCounter);
      updateCounter();
    }

    // disable submit until privacy is checked
    const privacy = el('#privacy');
    const submitBtn = el('.btn-submit', form);
    if (privacy && submitBtn) {
      const toggleBtn = () => { submitBtn.disabled = !privacy.checked; };
      privacy.addEventListener('change', toggleBtn);
      toggleBtn();
    }
  }

  function validateField(input) {
    const field = input.closest('.form-field');
    const errorBox = el('#error-' + input.id);
    let msg = '';

    if (input.id === 'name') {
      if (!input.value.trim()) msg = 'Ingresa tu nombre.';
      else if (input.value.trim().length < 2) msg = 'El nombre es muy corto.';
    }

    if (input.id === 'email') {
      if (!input.value.trim()) msg = 'Ingresa tu email.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) msg = 'Email inválido.';
    }

    if (input.id === 'topic') {
      if (!input.value) msg = 'Selecciona un motivo.';
    }

    if (input.id === 'message') {
      if (!input.value.trim()) msg = 'Escribe tu mensaje.';
      else if (input.value.trim().length < 10) msg = 'Agrega más detalle a tu consulta.';
    }

    if (errorBox) errorBox.textContent = msg;
    if (field) field.classList.toggle('field-error', Boolean(msg));
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');

    return !msg;
  }

  function validate(form) {
    const requiredIds = ['name','email','topic','message'];
    let ok = true;
    requiredIds.forEach(id => {
      const input = el('#' + id);
      if (input) ok = validateField(input) && ok;
    });

    const privacy = el('#privacy');
    if (privacy && !privacy.checked) {
      ok = false;
      alert('Debes aceptar la política de privacidad.');
    }

    // focus and scroll to first error field
    const firstError = el('.field-error input, .field-error select, .field-error textarea');
    if (!ok && firstError) {
      firstError.focus({ preventScroll: true });
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return ok;
  }

  function setLoading(form, loading) {
    const btn = el('.btn-submit', form);
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? 'Enviando…' : 'Enviar Mensaje';
  }

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const feedback = el('#formFeedback');
    if (!validate(form)) return;

    setLoading(form, true);
    if (feedback) {
      feedback.hidden = false;
      feedback.className = 'form-feedback';
      feedback.textContent = 'Enviando tu mensaje…';
    }

    try {
      // Simulación de envío. Aquí se podría integrar un backend o servicio (Supabase/Email API)
      await new Promise(res => setTimeout(res, 1500));

      if (feedback) {
        feedback.className = 'form-feedback success';
        feedback.textContent = '¡Gracias! Tu mensaje fue enviado. Te responderemos pronto.';
      }
      form.reset();
    } catch (err) {
      console.error(err);
      if (feedback) {
        feedback.className = 'form-feedback error';
        feedback.textContent = 'Ocurrió un error al enviar el mensaje. Intenta nuevamente.';
      }
    } finally {
      setLoading(form, false);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
