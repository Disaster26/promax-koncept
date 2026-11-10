(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* menu mobilne */
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu-mob');
  function zamknij() { menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Otwórz menu'); }
  burger.addEventListener('click', function () {
    var otw = menu.hidden;
    menu.hidden = !otw;
    burger.setAttribute('aria-expanded', String(otw));
    burger.setAttribute('aria-label', otw ? 'Zamknij menu' : 'Otwórz menu');
  });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) zamknij(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { zamknij(); burger.focus(); } });
  window.addEventListener('resize', function () { if (window.innerWidth > 1020 && !menu.hidden) zamknij(); });

  /* aktywna pozycja menu = dokładnie bieżąca sekcja */
  var navLinki = [].slice.call(document.querySelectorAll('.nav a'));
  var sekcje = navLinki.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  function aktywna() {
    var y = window.scrollY + Math.min(window.innerHeight * 0.4, 360), idx = -1;
    sekcje.forEach(function (s, i) { if (s && s.offsetTop <= y) idx = i; });
    var funkcje = document.getElementById('funkcje');
    if (funkcje && funkcje.offsetTop <= y) idx = -1;
    navLinki.forEach(function (a, i) { a.classList.toggle('on', i === idx); if (i === idx) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }
  window.addEventListener('scroll', function () { window.requestAnimationFrame(aktywna); }, { passive: true });
  aktywna();

  /* przeciąganie myszą dla torów przewijanych */
  function przeciagaj(tor, krok, snap) {
    var p0 = null, sl = 0, ruch = false;
    tor.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      p0 = e.clientX; sl = tor.scrollLeft; ruch = false;
    });
    tor.addEventListener('pointermove', function (e) {
      if (p0 === null) return;
      var dx = e.clientX - p0;
      if (!ruch && Math.abs(dx) > 4) { ruch = true; tor.classList.add('ciag'); try { tor.setPointerCapture(e.pointerId); } catch (x) {} }
      if (ruch) tor.scrollLeft = sl - dx;
    });
    function koniec() {
      if (p0 === null) return;
      var dx = tor.scrollLeft - sl; p0 = null;
      if (ruch) {
        tor.classList.remove('ciag');
        var k = krok(), start = Math.round(sl / k);
        var cel = Math.abs(dx) > k * 0.15 ? start + (dx > 0 ? 1 : -1) : start;
        tor.scrollTo({ left: Math.max(0, cel) * k, behavior: reduce ? 'auto' : 'smooth' });
        setTimeout(function () { ruch = false; }, 0);
      }
    }
    tor.addEventListener('pointerup', koniec);
    tor.addEventListener('pointercancel', koniec);
    tor.addEventListener('click', function (e) { if (ruch) { e.preventDefault(); e.stopPropagation(); } }, true);
  }

  /* karuzele w kartach */
  [].forEach.call(document.querySelectorAll('[data-karuzela]'), function (k) {
    var tor = k.querySelector('.kar-tor');
    var n = tor.querySelectorAll('img').length;
    var l = k.querySelector('.kar-l'), p = k.querySelector('.kar-p'), licz = k.querySelector('.kar-licz');
    if (n < 2) { l.remove(); p.remove(); licz.remove(); tor.removeAttribute('tabindex'); tor.style.cursor = 'default'; return; }
    function idx() { return Math.round(tor.scrollLeft / (tor.clientWidth || 1)); }
    function stan() { var i = idx(); licz.textContent = (i + 1) + ' / ' + n; l.disabled = i <= 0; p.disabled = i >= n - 1; }
    function idz(d) { var i = Math.max(0, Math.min(n - 1, idx() + d)); tor.scrollTo({ left: i * tor.clientWidth, behavior: reduce ? 'auto' : 'smooth' }); }
    l.addEventListener('click', function () { idz(-1); });
    p.addEventListener('click', function () { idz(1); });
    tor.addEventListener('scroll', function () { window.requestAnimationFrame(stan); }, { passive: true });
    tor.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); idz(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); idz(-1); }
    });
    przeciagaj(tor, function () { return tor.clientWidth; });
    window.addEventListener('resize', stan);
    stan();
  });

  /* pas zdjęć */
  [].forEach.call(document.querySelectorAll('[data-pas]'), function (pas) {
    var tor = pas.querySelector('.pas-tor'), l = pas.querySelector('.pas-l'), p = pas.querySelector('.pas-p');
    function krok() { var f = tor.querySelector('figure'); return f ? f.getBoundingClientRect().width + 16 : tor.clientWidth; }
    function stan() { l.disabled = tor.scrollLeft < 4; p.disabled = tor.scrollLeft + tor.clientWidth >= tor.scrollWidth - 4; }
    l.addEventListener('click', function () { tor.scrollBy({ left: -krok(), behavior: reduce ? 'auto' : 'smooth' }); });
    p.addEventListener('click', function () { tor.scrollBy({ left: krok(), behavior: reduce ? 'auto' : 'smooth' }); });
    tor.addEventListener('scroll', function () { window.requestAnimationFrame(stan); }, { passive: true });
    tor.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); tor.scrollBy({ left: krok() }); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); tor.scrollBy({ left: -krok() }); }
    });
    przeciagaj(tor, krok);
    window.addEventListener('resize', stan);
    stan();
  });

  /* zakładki realizacji */
  var tabs = [].slice.call(document.querySelectorAll('.zakladki [role=tab]'));
  function wybierz(t) {
    tabs.forEach(function (x) {
      var on = x === t;
      x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1;
      document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { wybierz(t); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); var n = tabs[(i + d + tabs.length) % tabs.length]; wybierz(n); n.focus(); }
    });
  });

  /* billboardy: lista z filtrem (dane publiczne z oferty, bez najemców) */
  var lista = document.getElementById('bill-lista');
  if (lista) {
    var fSzukaj = document.getElementById('bill-szukaj'), fWymiar = document.getElementById('bill-wymiar'), fWolne = document.getElementById('bill-wolne');
    var dane = [];
    function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l'); }
    function data(d) { var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(d); return m ? m[3] + '.' + m[2] + '.' + m[1] : d; }
    function rysuj() {
      var q = norm(fSzukaj.value.trim()), w = fWymiar.value, tylko = fWolne.checked;
      var wynik = dane.filter(function (b) {
        if (tylko && b.s !== 'wolna') return false;
        if (w && b.w !== w) return false;
        if (q && norm(b.n + ' ' + b.d).indexOf(q) === -1) return false;
        return true;
      });
      lista.textContent = '';
      if (!wynik.length) { var li0 = document.createElement('li'); li0.innerHTML = '<span class="brak">Brak lokalizacji dla tych filtrów.</span>'; lista.appendChild(li0); return; }
      var frag = document.createDocumentFragment();
      wynik.forEach(function (b) {
        var li = document.createElement('li');
        var n = document.createElement('span'); n.className = 'n'; n.textContent = b.n;
        var s = document.createElement('span'); s.className = 's ' + b.s; s.textContent = b.s === 'wolna' ? 'Wolna' : 'Wolna od ' + data(b.od);
        var ww = document.createElement('span'); ww.className = 'w'; ww.textContent = (b.w || 'wymiar w ofercie') ;
        var m = document.createElement('a'); m.className = 'm'; m.textContent = 'Na mapie'; m.target = '_blank'; m.rel = 'noopener';
        m.href = 'https://www.google.com/maps/search/?api=1&query=' + b.lat + ',' + b.lng;
        m.setAttribute('aria-label', 'Pokaż na mapie: ' + b.n);
        li.appendChild(n); li.appendChild(s); li.appendChild(ww); li.appendChild(m);
        frag.appendChild(li);
      });
      lista.appendChild(frag);
    }
    fetch('data/billboardy.json').then(function (r) { return r.json(); }).then(function (d) {
      dane = d;
      var wym = {};
      d.forEach(function (b) { if (b.w) wym[b.w] = (wym[b.w] || 0) + 1; });
      Object.keys(wym).sort(function (a, b) { return wym[b] - wym[a]; }).forEach(function (k) {
        var o = document.createElement('option'); o.value = k; o.textContent = k; fWymiar.appendChild(o);
      });
      var wolne = d.filter(function (b) { return b.s === 'wolna'; }).length;
      document.getElementById('bill-licznik').textContent = wolne + ' wolnych';
      document.getElementById('bill-wszystkie').textContent = d.length;
      rysuj();
    }).catch(function () { lista.innerHTML = '<li><span class="brak">Nie udało się wczytać listy.</span></li>'; });
    fSzukaj.addEventListener('input', rysuj);
    fWymiar.addEventListener('change', rysuj);
    fWolne.addEventListener('change', rysuj);
  }

  /* kalkulator wstępnej wyceny: dane i rysunki pojazdów z obecnej strony */
  var kSvg = document.getElementById('kalk-svg');
  if (kSvg) {
    var kPoj = document.getElementById('kalk-pojazdy'), kModel = document.getElementById('kalk-model'), kCena = document.getElementById('kalk-cena');
    var folie = [].slice.call(document.querySelectorAll('.folia'));
    var folia = folie[0], auta = [], auto = null, cache = {};
    var nazwy = { Bus: 'Bus', Van: 'Van', Dostawczy: 'Dostawczy', Suv: 'SUV', Combi: 'Kombi', Sedan: 'Sedan', Hatchback: 'Hatchback' };
    function zl(v) { return v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' zł'; }
    function przelicz() {
      var suma = 0;
      [].forEach.call(kSvg.querySelectorAll('.fil0.wyp'), function (el) {
        var cz = auto && auto.parts[el.id];
        if (cz) suma += cz * Number(el.getAttribute('data-cena'));
      });
      kCena.textContent = zl(suma);
    }
    folie.forEach(function (b) {
      b.addEventListener('click', function () {
        folia = b;
        folie.forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      });
    });
    function czysc(svgTxt) {
      var doc = new DOMParser().parseFromString(svgTxt, 'image/svg+xml');
      var svg = doc.documentElement;
      [].forEach.call(svg.querySelectorAll('script,foreignObject,metadata'), function (x) { x.remove(); });
      [].forEach.call(svg.querySelectorAll('*'), function (el) {
        [].slice.call(el.attributes).forEach(function (a) { if (/^on/i.test(a.name) || /href$/i.test(a.name)) el.removeAttribute(a.name); });
      });
      svg.removeAttribute('width'); svg.removeAttribute('height');
      return document.importNode(svg, true);
    }
    function pokazAuto(i) {
      auto = auta[i];
      [].forEach.call(kPoj.children, function (b, j) { b.setAttribute('aria-checked', String(j === i)); b.tabIndex = j === i ? 0 : -1; });
      kModel.textContent = auto.details.replace(/\s*-\s*skala/, ', skala').replace('- skala', ', skala');
      kSvg.innerHTML = '<span class="ladowanie">Wczytywanie rysunku…</span>';
      var gotowe = function (txt) {
        if (auto !== auta[i]) return;
        kSvg.textContent = '';
        var svg = czysc(txt);
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', 'Rysunek pojazdu ' + auto.details);
        kSvg.appendChild(svg);
        przelicz();
      };
      if (cache[auto.svg]) gotowe(cache[auto.svg]);
      else fetch('img/auta/' + auto.svg).then(function (r) { return r.text(); }).then(function (t) { cache[auto.svg] = t; gotowe(t); });
    }
    kSvg.addEventListener('click', function (e) {
      var el = e.target.closest('.fil0');
      if (!el || !auto || !(el.id in auto.parts)) return;
      var cena = Number(folia.getAttribute('data-cena'));
      if (!cena) { el.classList.remove('wyp'); el.style.removeProperty('--k'); el.removeAttribute('data-cena'); }
      else { el.classList.add('wyp'); el.style.setProperty('--k', folia.getAttribute('data-kolor')); el.setAttribute('data-cena', String(cena)); }
      przelicz();
    });
    document.getElementById('kalk-reset').addEventListener('click', function () {
      [].forEach.call(kSvg.querySelectorAll('.fil0.wyp'), function (el) { el.classList.remove('wyp'); el.removeAttribute('data-cena'); });
      przelicz();
    });
    fetch('data/pojazdy.json').then(function (r) { return r.json(); }).then(function (d) {
      auta = d;
      d.forEach(function (a, i) {
        var b = document.createElement('button');
        b.type = 'button'; b.setAttribute('role', 'radio'); b.textContent = nazwy[a.name] || a.name;
        b.addEventListener('click', function () { pokazAuto(i); });
        b.addEventListener('keydown', function (e) {
          var dd = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
          if (dd) { e.preventDefault(); var j = (i + dd + auta.length) % auta.length; pokazAuto(j); kPoj.children[j].focus(); }
        });
        kPoj.appendChild(b);
      });
      var start = function () { pokazAuto(0); };
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); start(); } }, { rootMargin: '400px' });
        io.observe(kSvg);
      } else start();
    });
  }

  /* formularz pokazowy */
  var form = document.getElementById('form'), info = document.getElementById('form-info');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(form.mail.value.trim()) || !form.uwagi.value.trim()) { info.className = 'form-info blad'; info.textContent = 'Podaj adres e-mail i treść wiadomości.'; return; }
    if (!form.zgoda.checked) { info.className = 'form-info blad'; info.textContent = 'Zaznacz zgodę na przetwarzanie danych w celach kontaktowych.'; return; }
    info.className = 'form-info ok';
    info.textContent = 'To wersja pokazowa, nic nie zostało wysłane. Na docelowej stronie wiadomość trafi na adres biura, jak w obecnym formularzu.';
    form.reset();
  });

  /* dolny pasek na telefonie po przewinięciu za przycisk w hero */
  var pasek = document.getElementById('mob-pasek'), cta = document.getElementById('hero-cta'), kontakt = document.getElementById('kontakt');
  if ('IntersectionObserver' in window && pasek && cta) {
    var zaCta = false, wKontakcie = false;
    function ustaw() {
      var w = zaCta && !wKontakcie;
      pasek.classList.toggle('widac', w);
      pasek.setAttribute('aria-hidden', String(!w));
      [].forEach.call(pasek.querySelectorAll('a'), function (a) { a.tabIndex = w ? 0 : -1; });
    }
    new IntersectionObserver(function (en) { zaCta = !en[0].isIntersecting && en[0].boundingClientRect.top < 0; ustaw(); }).observe(cta);
    new IntersectionObserver(function (en) { wKontakcie = en[0].isIntersecting; ustaw(); }, { threshold: 0.1 }).observe(kontakt);
  }
})();
