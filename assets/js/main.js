/* Clínica Dra. Maria Eduarda Veiga Moura — comportamento do site (sem dependências) */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Abertura animada (~2 s, 1x por sessão) ---------- */
  var introEl = document.getElementById('intro');
  var started = false;

  function revealSite() {
    body.classList.add('ready');
    document.dispatchEvent(new Event('site-ready'));
  }

  function endIntro() {
    if (root.classList.contains('intro-done')) return;
    root.classList.add('intro-exit');
    setTimeout(function () {
      root.classList.remove('intro-on', 'intro-go', 'intro-exit');
      root.classList.add('intro-done');
      if (introEl) introEl.remove();
    }, 760);
    setTimeout(revealSite, 380); // hero começa a surgir enquanto a cortina sobe
  }

  function startIntro() {
    if (started) return;
    started = true;
    try { sessionStorage.setItem('intro-seen', '1'); } catch (e) {}
    root.classList.add('intro-go');
    setTimeout(endIntro, 1850);
    if (introEl) introEl.addEventListener('click', endIntro, { once: true }); // permite pular
  }

  if (root.classList.contains('intro-on') && introEl) {
    // espera as fontes (no máximo 700 ms) para o texto não "piscar" durante a abertura
    var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 700); })]).then(startIntro);
    setTimeout(function () { if (!root.classList.contains('intro-done')) { startIntro(); endIntro(); } }, 4500); // rede de segurança
  } else {
    if (introEl) introEl.remove();
    root.classList.add('intro-done');
    requestAnimationFrame(function () { requestAnimationFrame(revealSite); });
  }

  /* ---------- Header sólido ao rolar + botão topo ---------- */
  var header = document.getElementById('header');
  var toTop = document.getElementById('toTop');
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle('is-solid', y > 24 || navOpen());
    toTop.classList.toggle('is-visible', y > 700);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ---------- Menu mobile ---------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  var mq = window.matchMedia('(max-width: 1179px)');

  function navOpen() { return nav.classList.contains('is-open'); }
  function setNav(open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    body.style.overflow = open ? 'hidden' : '';
    nav.inert = mq.matches && !open;   // links do menu fechado não entram na ordem de tabulação
    onScroll();
  }
  burger.addEventListener('click', function () { setNav(!navOpen()); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setNav(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && navOpen()) { setNav(false); burger.focus(); } });
  (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(function () { setNav(false); });
  setNav(false);

  /* ---------- Revelação ao rolar ---------- */
  var revealEls = [].slice.call(document.querySelectorAll('[data-reveal]'));
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Link ativo no menu ---------- */
  var links = [].slice.call(nav.querySelectorAll('ul a'));
  var map = {};
  links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (l) { l.classList.remove('is-active'); l.removeAttribute('aria-current'); });
          map[en.target.id].classList.add('is-active');
          map[en.target.id].setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------- Galeria + lightbox ---------- */
  var gallery = document.getElementById('gallery');
  var lb = document.getElementById('lightbox');
  if (gallery && lb && typeof lb.showModal === 'function') {
    var items = [].slice.call(gallery.querySelectorAll('button[data-full]'));
    var lbImg = document.getElementById('lb-img');
    var lbCap = document.getElementById('lb-cap');
    var idx = 0;

    function show(i) {
      idx = (i + items.length) % items.length;
      var b = items[idx];
      lbImg.src = b.dataset.full;
      lbImg.alt = b.querySelector('img').alt;
      lbCap.textContent = b.dataset.cap + '  ·  ' + (idx + 1) + '/' + items.length;
    }
    function open(i) { show(i); lb.showModal(); body.style.overflow = 'hidden'; }
    function close() { lb.close(); }

    items.forEach(function (b, i) { b.addEventListener('click', function () { open(i); }); });
    lb.querySelector('.lb__prev').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('.lb__next').addEventListener('click', function () { show(idx + 1); });
    lb.querySelector('.lb__close').addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    lb.addEventListener('close', function () { body.style.overflow = navOpen() ? 'hidden' : ''; items[idx].focus({ preventScroll: true }); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'ArrowLeft') show(idx - 1);
    });
    // gesto de arrastar no celular
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  /* ---------- Ano do rodapé ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  onScroll();
})();
