/* =============================================================
   RASTREAMENTO — GTM Data Layer + Eventos de Funil
   landing-page.js

   ⚠️ Dependências (já no HTML):
      - GTM snippet no <head> com seu GTM-XXXXXXX
      - Meta Pixel snippet no <head> com seu SEU_PIXEL_ID
============================================================= */

window.dataLayer = window.dataLayer || [];

/* ─────────────────────────────────────────────────────────
   PRODUTO — objeto reutilizável em todos os eventos
───────────────────────────────────────────────────────── */
var PRODUTO = {
  item_id:       'metodo-foco-total-completo',
  item_name:     'Método Foco Total — Edição Completa',
  item_category: 'Curso Digital',
  price:         197.00,
  quantity:      1
};

/* ─────────────────────────────────────────────────────────
   1. PAGE VIEW + VIEW_ITEM + ViewContent
   Dispara imediatamente ao carregar a página
───────────────────────────────────────────────────────── */
dataLayer.push({ ecommerce: null });
dataLayer.push({
  event: 'view_item',
  ecommerce: {
    currency: 'BRL',
    value: PRODUTO.price,
    items: [PRODUTO]
  }
});

// Meta Pixel: ViewContent
if (typeof fbq !== 'undefined') {
  fbq('track', 'ViewContent', {
    content_ids:  [PRODUTO.item_id],
    content_name: PRODUTO.item_name,
    content_type: 'product',
    value:        PRODUTO.price,
    currency:     'BRL'
  });
}

/* ─────────────────────────────────────────────────────────
   2. CTA CLICKS — begin_checkout por botão
   Identifica qual CTA foi clicado via data-cta
───────────────────────────────────────────────────────── */
document.querySelectorAll('.btn-primary[data-cta]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var ctaPosition = this.getAttribute('data-cta'); // hero | quick-wins | offer | final

    // GA4 via dataLayer
    dataLayer.push({ ecommerce: null });
    dataLayer.push({
      event: 'begin_checkout',
      cta_position: ctaPosition,
      ecommerce: {
        currency: 'BRL',
        value: PRODUTO.price,
        items: [PRODUTO]
      }
    });

    // Meta Pixel: InitiateCheckout
    if (typeof fbq !== 'undefined') {
      fbq('track', 'InitiateCheckout', {
        content_ids:  [PRODUTO.item_id],
        content_name: PRODUTO.item_name,
        value:        PRODUTO.price,
        currency:     'BRL',
        num_items:    1
      });
    }
  });
});

/* ─────────────────────────────────────────────────────────
   3. SCROLL DEPTH — 25%, 50%, 75%, 90%
   Mede quanto o visitante rola a página
───────────────────────────────────────────────────────── */
var scrollMarks = [25, 50, 75, 90];
var scrollFired = {};

window.addEventListener('scroll', function() {
  var scrolled = Math.round(
    (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
  );
  scrollMarks.forEach(function(mark) {
    if (scrolled >= mark && !scrollFired[mark]) {
      scrollFired[mark] = true;
      dataLayer.push({
        event:        'scroll',
        scroll_depth: mark
      });
    }
  });
}, { passive: true });

/* ─────────────────────────────────────────────────────────
   4. VISIBILIDADE DAS SEÇÕES CRÍTICAS
   Dispara quando o elemento entra na viewport
   Seções: oferta (#oferta), depoimentos (.testimonials), faq (.faq)
───────────────────────────────────────────────────────── */
var sectionMap = [
  { selector: '#oferta',       eventName: 'view_offer',       pixelEvent: 'ViewContent' },
  { selector: '.testimonials', eventName: 'view_testimonials', pixelEvent: null },
  { selector: '.faq',          eventName: 'view_faq',          pixelEvent: null }
];

if ('IntersectionObserver' in window) {
  sectionMap.forEach(function(section) {
    var el = document.querySelector(section.selector);
    if (!el) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          dataLayer.push({ event: section.eventName });

          if (section.pixelEvent && typeof fbq !== 'undefined') {
            fbq('track', section.pixelEvent, {
              content_ids:  [PRODUTO.item_id],
              content_name: PRODUTO.item_name,
              value:        PRODUTO.price,
              currency:     'BRL'
            });
          }
          observer.unobserve(el); // dispara só uma vez
        }
      });
    }, { threshold: 0.3 }); // 30% do elemento visível

    observer.observe(el);
  });
}

/* ─────────────────────────────────────────────────────────
   5. FAQ — interações (qual pergunta o visitante abriu)
   Ajuda a identificar objeções não resolvidas na página
───────────────────────────────────────────────────────── */
document.querySelectorAll('.faq-list details').forEach(function(detail, index) {
  detail.addEventListener('toggle', function() {
    if (this.open) {
      var question = this.querySelector('summary')
        ? this.querySelector('summary').textContent.trim()
        : 'FAQ #' + (index + 1);

      dataLayer.push({
        event:        'select_content',
        content_type: 'faq',
        content_id:   'faq_' + (index + 1),
        faq_question: question.substring(0, 100)
      });
    }
  });
});

/* ─────────────────────────────────────────────────────────
   6. EXIT INTENT — cursor saiu da janela (intenção de fechar)
   Sinaliza visitante que está prestes a sair sem converter
───────────────────────────────────────────────────────── */
var exitFired = false;
document.addEventListener('mouseleave', function(e) {
  if (e.clientY <= 0 && !exitFired) {
    exitFired = true;
    dataLayer.push({ event: 'exit_intent' });
  }
});

/* ─────────────────────────────────────────────────────────
   7. TEMPO NA PÁGINA — engajamento por tempo
   Dispara em 30s, 60s e 120s de permanência
───────────────────────────────────────────────────────── */
[30, 60, 120].forEach(function(seconds) {
  setTimeout(function() {
    dataLayer.push({
      event:           'user_engagement',
      engagement_time: seconds
    });
  }, seconds * 1000);
});

/* ─────────────────────────────────────────────────────────
   8. TROCA DE ABA / MINIMIZAR JANELA
   Detecta quando o usuário sai da aba da landing page
───────────────────────────────────────────────────────── */
document.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'hidden') {
    dataLayer.push({ event: 'page_hide' });
  }
});

/* ─────────────────────────────────────────────────────────
   9. ERROS DE JAVASCRIPT — monitoramento de exceções
───────────────────────────────────────────────────────── */
window.addEventListener('error', function(e) {
  dataLayer.push({
    event:         'exception',
    error_message: e.message  ? e.message.substring(0, 150)  : 'unknown',
    error_file:    e.filename ? e.filename.substring(0, 150) : 'unknown',
    error_line:    e.lineno   || 0
  });
});

/* ─────────────────────────────────────────────────────────
   10. CORE WEB VITALS — performance da página
   LCP e CLS enviados ao GA4 via dataLayer
───────────────────────────────────────────────────────── */
if ('PerformanceObserver' in window) {
  // LCP — Largest Contentful Paint
  try {
    new PerformanceObserver(function(list) {
      var entries = list.getEntries();
      if (entries.length) {
        var lcp = entries[entries.length - 1];
        dataLayer.push({
          event:        'timing_complete',
          metric_name:  'LCP',
          metric_value: Math.round(lcp.startTime)
        });
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch(e) {}

  // CLS — Cumulative Layout Shift
  try {
    var clsValue = 0;
    new PerformanceObserver(function(list) {
      list.getEntries().forEach(function(entry) {
        if (!entry.hadRecentInput) clsValue += entry.value;
      });
    }).observe({ type: 'layout-shift', buffered: true });

    window.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') {
        dataLayer.push({
          event:        'timing_complete',
          metric_name:  'CLS',
          metric_value: Math.round(clsValue * 1000) / 1000
        });
      }
    }, { once: true });
  } catch(e) {}
}
