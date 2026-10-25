/* ATLAS — main.js (IIFE, sin módulos) */
(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var vw = window.innerWidth, vh = window.innerHeight;

  // Bucle único de animación: cada módulo registra su actualizador
  var updaters = [];
  var scrollDirty = true;
  window.addEventListener("scroll", function () { scrollDirty = true; }, { passive: true });
  window.addEventListener("resize", function () { vw = window.innerWidth; vh = window.innerHeight; scrollDirty = true; });
  function loop(t) {
    var sd = scrollDirty;
    scrollDirty = false;
    for (var i = 0; i < updaters.length; i++) {
      try { updaters[i](t, sd); } catch (e) { console.warn(e); updaters.splice(i--, 1); }
    }
    requestAnimationFrame(loop);
  }

  // Clases dirigidas por día (1 = lunes … 6 = sábado)
  var SCHEDULE = {
    1: [["07:00", "Fuerza funcional", "Irene"], ["09:30", "Movilidad", "Tomás"], ["13:30", "Remo indoor", "Irene"], ["18:30", "Boxeo", "Darío"], ["20:00", "Lucha y grappling", "Marta"]],
    2: [["07:00", "Remo indoor", "Irene"], ["10:00", "Movilidad", "Tomás"], ["14:00", "Fuerza funcional", "Irene"], ["19:00", "Lucha y grappling", "Marta"], ["20:30", "Boxeo", "Darío"]],
    3: [["07:00", "Fuerza funcional", "Irene"], ["09:30", "Movilidad", "Tomás"], ["13:30", "Boxeo", "Darío"], ["18:30", "Remo indoor", "Irene"], ["20:00", "Fuerza funcional", "Irene"]],
    4: [["07:00", "Remo indoor", "Irene"], ["10:00", "Movilidad", "Tomás"], ["14:00", "Boxeo", "Darío"], ["19:00", "Lucha y grappling", "Marta"], ["20:30", "Fuerza funcional", "Irene"]],
    5: [["07:00", "Fuerza funcional", "Irene"], ["13:30", "Remo indoor", "Irene"], ["18:00", "Boxeo", "Darío"], ["19:30", "Movilidad", "Tomás"]],
    6: [["09:30", "Fuerza funcional · por parejas", "Irene"], ["11:00", "Boxeo abierto", "Darío"], ["12:30", "Movilidad", "Tomás"]]
  };

  /* ───────── Split de letras (respeta <br> y <em>) ───────── */
  function splitChars(el) {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = "1";
    el.setAttribute("aria-label", el.textContent.replace(/­/g, "").trim().replace(/\s+/g, " "));
    var i = 0;
    function wrapText(text) {
      return text.split(/(\s+)/).map(function (w) {
        if (!w) return "";
        if (/^\s+$/.test(w)) return " ";
        var chars = Array.from(w).map(function (c) {
          if (c === "­") return "";
          return '<span class="char" style="--i:' + (i++) + '">' + esc(c) + "</span>";
        }).join("");
        return '<span class="char-mask" aria-hidden="true">' + chars + "</span>";
      }).join("");
    }
    el.innerHTML = Array.prototype.map.call(el.childNodes, function (n) {
      if (n.nodeType === 3) return wrapText(n.textContent);
      if (n.nodeName === "BR") return "<br>";
      if (n.nodeType === 1) { var tag = n.tagName.toLowerCase(); return "<" + tag + ">" + wrapText(n.textContent) + "</" + tag + ">"; }
      return "";
    }).join("");
  }

  function initSplit() {
    var heads = document.querySelectorAll("[data-split]:not(.hero-title)");
    heads.forEach(splitChars);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-split-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -8% 0px" });
    heads.forEach(function (h) { io.observe(h); });
    setTimeout(function () {
      heads.forEach(function (h) { if (h.getBoundingClientRect().top < vh) h.classList.add("is-split-visible"); });
    }, 6000);

    // Hero: se divide ya, pero se revela al abrirse el telón
    var t = document.querySelector(".hero-title");
    var w = document.querySelector("[data-chars]");
    if (t) splitChars(t);
    if (w) splitChars(w);
  }

  function revealHero() {
    document.querySelectorAll(".hero-title, [data-chars]").forEach(function (el) { el.classList.add("is-split-visible"); });
  }

  /* ───────── Telón de entrada ───────── */
  function initSplash() {
    var splash = document.querySelector("[data-splash]");
    if (!splash) { revealHero(); return; }
    var num = splash.querySelector("[data-splash-count]");
    var start = performance.now();
    var loaded = document.readyState === "complete";
    window.addEventListener("load", function () { loaded = true; });
    var done = false;

    function finish() {
      if (done) return;
      done = true;
      num.textContent = "100";
      splash.classList.add("is-out");
      setTimeout(revealHero, 350);
      setTimeout(function () { splash.classList.add("is-gone"); }, 1300);
    }
    function tick(t) {
      if (done) return;
      var el = t - start;
      // Avanza rápido hasta 85 y espera a la carga para completar
      var cap = loaded ? 100 : 85;
      var p = Math.min(cap, Math.round(100 * (1 - Math.pow(1 - Math.min(el / 1500, 1), 3))));
      num.textContent = String(p);
      if (p >= 100) setTimeout(finish, 180);
      else requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    setTimeout(finish, 3800); // red de seguridad
  }

  /* ───────── Reveal al hacer scroll ───────── */
  function initReveals() {
    var els = document.querySelectorAll(".reveal");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) {
      var sibs = el.parentElement ? el.parentElement.querySelectorAll(":scope > .reveal") : [];
      var idx = Array.prototype.indexOf.call(sibs, el);
      if (idx > 0) el.style.transitionDelay = Math.min(idx * 0.08, 0.4) + "s";
      io.observe(el);
    });
    setTimeout(function () {
      document.querySelectorAll(".reveal:not(.is-visible)").forEach(function (el) {
        if (el.getBoundingClientRect().top < vh) el.classList.add("is-visible");
      });
    }, 6000);
  }

  /* ───────── Portal: la pintura se abre en círculo ───────── */
  var portalProgress = 0;
  function initPortal() {
    var sec = document.querySelector("[data-portal]");
    if (!sec) return;
    var frame = sec.querySelector("[data-portal-frame]");
    var title = sec.querySelector("[data-portal-title]");
    var card = sec.querySelector("[data-portal-card]");
    updaters.push(function (t, sd) {
      if (!sd) return;
      var r = sec.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var p = clamp(-r.top / (r.height - vh), 0, 1);
      portalProgress = p;
      var open = clamp(p / 0.7, 0, 1);
      var e = open * open * (3 - 2 * open); // smoothstep
      var rMin = Math.min(vw, vh) * 0.16;
      var rMax = Math.hypot(vw, vh) / 2 + 4;
      frame.style.setProperty("--pr", lerp(rMin, rMax, e).toFixed(1) + "px");
      frame.style.setProperty("--ps", lerp(1.35, 1, e).toFixed(4));
      title.style.transform = "scale(" + lerp(1, 1.5, e).toFixed(3) + ")";
      title.style.opacity = String(clamp(1 - e * 1.4, 0, 1));
      card.classList.toggle("is-in", p > 0.74);
    });
  }

  /* ───────── Cabecera e indicador de sala ───────── */
  function initChrome() {
    var head = document.querySelector("[data-masthead]");
    var room = document.querySelector("[data-room-indicator]");
    var roomText = document.querySelector("[data-room-text]");
    var darkZones = document.querySelectorAll(".ink-room, .marquee, .painting-panel, [data-portal]");
    var rooms = document.querySelectorAll("[data-room]");
    var lastY = window.scrollY;
    var current = "";

    function isDarkAt(y) {
      for (var i = 0; i < darkZones.length; i++) {
        var z = darkZones[i];
        var r = z.getBoundingClientRect();
        if (r.top <= y && r.bottom >= y) {
          if (z.hasAttribute("data-portal")) return portalProgress > 0.4 && r.bottom > vh * 0.98;
          return true;
        }
      }
      return false;
    }

    updaters.push(function (t, sd) {
      if (!sd) return;
      if (head) {
        head.classList.toggle("is-dark", isDarkAt(30));
        var y = window.scrollY;
        head.classList.toggle("is-hidden", y > lastY + 2 && y > 300);
        if (y < lastY - 2) head.classList.remove("is-hidden");
        lastY = y;
      }
      if (room) {
        room.classList.toggle("is-dark", isDarkAt(vh - 26));
        var name = "";
        rooms.forEach(function (s) {
          var r = s.getBoundingClientRect();
          if (r.top <= vh * 0.5 && r.bottom > vh * 0.5) name = s.getAttribute("data-room");
        });
        if (name && name !== current) {
          current = name;
          roomText.classList.add("is-swapping");
          setTimeout(function () {
            roomText.textContent = "Sala " + current;
            roomText.classList.remove("is-swapping");
          }, 220);
        }
      }
    });
  }

  /* ───────── Parallax en pinturas y wordmark ───────── */
  function initParallax() {
    var imgs = document.querySelectorAll(".painting-panel > img");
    var wm = document.querySelector("[data-wordmark]");
    updaters.push(function (t, sd) {
      if (!sd) return;
      imgs.forEach(function (img) {
        var r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var p = (r.top + r.height / 2 - vh / 2) / (vh + r.height);
        img.style.transform = "translate3d(0," + (p * -10).toFixed(2) + "%,0)";
      });
      if (wm) {
        var y = Math.min(window.scrollY, vh);
        wm.style.transform = "translate3d(0," + (y * 0.22).toFixed(1) + "px,0)";
      }
    });
  }

  /* ───────── Lupa: la pintura aparece dentro de las letras ───────── */
  function initLens() {
    var wrap = document.querySelector("[data-lens]");
    var hero = document.querySelector(".hero");
    if (!wrap || !hero) return;
    var mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5, r = 0, tr = 0;
    var inside = false;

    if (canHover) {
      hero.addEventListener("pointermove", function (e) {
        var b = wrap.getBoundingClientRect();
        tx = (e.clientX - b.left) / b.width;
        ty = (e.clientY - b.top) / b.height;
        inside = true;
      });
      hero.addEventListener("pointerleave", function () { inside = false; });
    }

    updaters.push(function (t) {
      var b = wrap.getBoundingClientRect();
      if (b.bottom < 0 || b.top > vh) return;
      if (canHover) {
        tr = inside ? b.height * 0.42 : 0;
      } else {
        // En táctil, la lupa recorre las letras sola
        tx = 0.5 + Math.sin(t / 1600) * 0.38;
        ty = 0.5 + Math.sin(t / 1100) * 0.12;
        tr = b.height * 0.38;
      }
      mx = lerp(mx, tx, 0.14);
      my = lerp(my, ty, 0.14);
      r = lerp(r, tr, 0.09);
      wrap.style.setProperty("--mx", (mx * 100).toFixed(2) + "%");
      wrap.style.setProperty("--my", (my * 100).toFixed(2) + "%");
      wrap.style.setProperty("--r", r.toFixed(1) + "px");
    });
  }

  /* ───────── Cursor personalizado ───────── */
  function initCursor() {
    if (!canHover) return;
    var cur = document.querySelector("[data-cursor]");
    if (!cur) return;
    var label = cur.querySelector("[data-cursor-label]");
    var x = -100, y = -100, cx = -100, cy = -100, first = false;

    window.addEventListener("pointermove", function (e) {
      x = e.clientX; y = e.clientY;
      if (!first) { first = true; cx = x; cy = y; cur.classList.add("is-ready"); }
    });
    document.addEventListener("pointerleave", function () { cur.classList.remove("is-ready"); first = false; });

    document.addEventListener("mouseover", function (e) {
      var view = e.target.closest("[data-cursor-label]");
      var link = e.target.closest("a, button, select, input, [role='tab']");
      cur.classList.toggle("is-view", !!view && !link);
      cur.classList.toggle("is-link", !!link);
      if (view && !link) label.textContent = view.getAttribute("data-cursor-label");
    });

    updaters.push(function () {
      cx = lerp(cx, x, 0.22);
      cy = lerp(cy, y, 0.22);
      cur.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
    });
  }

  /* ───────── Botones magnéticos ───────── */
  function initMagnetic() {
    if (!canHover) return;
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var b = el.getBoundingClientRect();
        var dx = e.clientX - (b.left + b.width / 2);
        var dy = e.clientY - (b.top + b.height / 2);
        el.style.transform = "translate(" + (dx * 0.28).toFixed(1) + "px," + (dy * 0.36).toFixed(1) + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* ───────── Inclinación 3D ───────── */
  function initTilt() {
    if (!canHover) return;
    document.querySelectorAll("[data-tilt]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var b = el.getBoundingClientRect();
        var px = (e.clientX - b.left) / b.width - 0.5;
        var py = (e.clientY - b.top) / b.height - 0.5;
        el.classList.add("is-tilting");
        el.style.transform = "perspective(1100px) rotateY(" + (px * 7).toFixed(2) + "deg) rotateX(" + (-py * 7).toFixed(2) + "deg)";
      });
      el.addEventListener("pointerleave", function () { el.classList.remove("is-tilting"); el.style.transform = ""; });
    });
  }

  /* ───────── Marquesina que reacciona al scroll ───────── */
  function initMarquee() {
    var box = document.querySelector("[data-marquee]");
    var track = document.querySelector("[data-marquee-track]");
    if (!track) return;
    var x = 0, dir = -1, lastY = window.scrollY, boost = 0;
    updaters.push(function () {
      var y = window.scrollY;
      var dy = y - lastY;
      lastY = y;
      if (dy > 0) dir = -1; else if (dy < 0) dir = 1;
      boost = lerp(boost, Math.min(Math.abs(dy), 80), 0.1);
      var b = box.getBoundingClientRect();
      if (b.bottom < 0 || b.top > vh) return;
      var half = track.scrollWidth / 2;
      x += dir * (0.9 + boost * 0.35);
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      track.style.transform = "translate3d(" + x.toFixed(1) + "px,0,0)";
    });
  }

  /* ───────── Galería horizontal ───────── */
  function initGallery() {
    var sec = document.querySelector("[data-gallery]");
    var track = document.querySelector("[data-gallery-track]");
    if (!sec || !track) return;
    var bar = sec.querySelector("[data-gallery-bar]");
    var count = sec.querySelector("[data-gallery-count]");
    var exhibits = track.querySelectorAll(".exhibit");
    var introHead = track.querySelector(".gallery-intro [data-split]");
    // Desplazamiento horizontal en todos los tamaños (también móvil)
    var desktop = true, dist = 0;

    function measure() {
      dist = Math.max(0, track.scrollWidth - window.innerWidth);
      sec.style.height = (dist + window.innerHeight) + "px";
    }
    measure();
    // En móvil la barra del navegador cambia la altura al hacer scroll: solo
    // recalculamos si cambia el ancho, para evitar saltos.
    var lastW = window.innerWidth;
    window.addEventListener("resize", function () {
      if (window.innerWidth !== lastW) { lastW = window.innerWidth; measure(); }
    });
    window.addEventListener("load", measure);
    // Cuando llega la tipografía, el título cambia de ancho: se vuelve a medir
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    var lastIdx = -1;
    updaters.push(function (t, sd) {
      if (!sd) return;
      var r = sec.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      if (r.top < vh * 0.7 && introHead) introHead.classList.add("is-split-visible");
      if (desktop) {
        var p = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
        track.style.transform = "translate3d(" + (-p * dist).toFixed(1) + "px,0,0)";
        bar.style.setProperty("--gp", p.toFixed(4));
      }
      var idx = 0, best = Infinity;
      exhibits.forEach(function (ex, i) {
        var b = ex.getBoundingClientRect();
        if (b.left < vw * 0.9 && b.top < vh * 0.9 && b.bottom > 0) ex.classList.add("is-visible");
        var c = Math.abs(b.left + b.width / 2 - vw / 2) + (desktop ? 0 : Math.abs(b.top + b.height / 2 - vh / 2));
        if (c < best) { best = c; idx = i; }
        if (desktop) {
          var shift = (b.left + b.width / 2 - vw / 2) * -0.05;
          ex.style.setProperty("--shift", shift.toFixed(1) + "px");
        }
      });
      if (idx !== lastIdx) { lastIdx = idx; count.textContent = "0" + (idx + 1) + " / 0" + exhibits.length; }
    });
  }

  /* ───────── Manifiesto: palabras que se "tallan" ───────── */
  function initCarve() {
    var el = document.querySelector("[data-carve]");
    if (!el) return;
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = Array.prototype.map.call(el.childNodes, function (n) {
      var wrap = function (txt) {
        return txt.split(/(\s+)/).map(function (w) {
          return /^\s*$/.test(w) ? w : '<span class="w" aria-hidden="true">' + esc(w) + "</span>";
        }).join("");
      };
      if (n.nodeType === 3) return wrap(n.textContent);
      if (n.nodeType === 1) { var tag = n.tagName.toLowerCase(); return "<" + tag + ">" + wrap(n.textContent) + "</" + tag + ">"; }
      return "";
    }).join("");
    var words = el.querySelectorAll(".w");

    // Se talla sola: al aparecer en pantalla, las palabras se encienden una a una
    function carve() {
      words.forEach(function (w, i) {
        setTimeout(function () { w.classList.add("on"); }, 250 + i * 70);
      });
    }
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { io.disconnect(); carve(); }
    }, { threshold: 0.3 });
    io.observe(el);
  }

  /* ───────── Entrada automática en la sala ─────────
     Solo en "Entra en la sala" (el portal del remero): un gesto lo abre
     entero, sin tener que ir deslizando. Al subir, un gesto lo cierra.
     Hasta llegar al portal el scroll es 100 % normal: la animación solo
     arranca en el último momento, cuando tu gesto va a entrar en él.
     En el resto de la página no se toca ningún gesto. */
  function initStepper() {
    var html = document.documentElement;
    var portal = document.querySelector("[data-portal]");
    if (!portal) return;

    var stepping = false;    // la animación está en marcha
    var coolUntil = 0;       // tras la animación, filtra la inercia del trackpad…
    var coolHardStop = 0;    // …pero nunca más allá de este instante (evita bloqueos)
    var lastAbs = 0;

    // Inicio (sala cerrada) y final (sala abierta) del portal, en posición de scroll.
    // Se calculan en el momento, por si cambia el tamaño de la ventana.
    function bounds() {
      var start = portal.getBoundingClientRect().top + window.scrollY;
      return { start: start, end: start + portal.offsetHeight - vh };
    }

    // Destino para un gesto en dirección dir (1 abajo, -1 arriba) que movería la
    // página "delta" píxeles. Devuelve null = scroll normal.
    // Solo actúa si ya estás dentro del portal o si ESTE gesto va a cruzar su borde.
    function targetFor(dir, delta) {
      var y = window.scrollY;
      var b = bounds();
      delta = Math.max(0, delta || 0);
      if (dir > 0) {
        var inDown = y >= b.start - 2 && y < b.end - 4;
        var crossDown = y < b.start - 2 && y + delta >= b.start - 2;
        return inDown || crossDown ? Math.round(b.end) : null;   // bajando: se abre entera
      }
      var inUp = y <= b.end + 2 && y > b.start + 4;
      var crossUp = y > b.end + 2 && y - delta <= b.end + 2;
      return inUp || crossUp ? Math.round(b.start) : null;       // subiendo: se cierra entera
    }

    // Si el scroll se detiene a medio camino dentro del portal (inercia del móvil,
    // barra de scroll…), la animación se completa sola en la dirección en que ibas.
    function settle(dir) {
      if (stepping || held || !userActive()) return;
      var y = window.scrollY, b = bounds();
      if (y <= b.start + 4 || y >= b.end - 4) return;
      go(Math.round(dir > 0 ? b.end : b.start));
    }
    var held = false, lastScrollY = window.scrollY, scrollDir = 1, settleTimer;
    // Último gesto tuyo (rueda, dedo o tecla). El ajuste automático solo actúa si
    // acabas de hacer uno: así no interfiere con los enlaces del menú (#tarifas…),
    // que recorren la página solos.
    var lastInput = 0;
    function userActive() { return performance.now() - lastInput < 1500; }
    // Velocidad actual del scroll (px/ms), para que la animación la continúe sin frenazo
    var lastScrollT = performance.now(), vel = 0;
    function currentVel() { return performance.now() - lastScrollT > 150 ? 0 : vel; }
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      var now = performance.now();
      var dt = now - lastScrollT;
      if (!stepping) {
        var inst = dt > 0 ? (y - lastScrollY) / dt : 0;
        vel = dt < 120 ? vel * 0.4 + inst * 0.6 : inst;
      }
      lastScrollT = now;
      if (y !== lastScrollY) scrollDir = y > lastScrollY ? 1 : -1;
      lastScrollY = y;
      if (stepping) return;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(function () { settle(scrollDir); }, 160);
    }, { passive: true });
    // Mientras el dedo o el ratón estén pulsados (arrastrando la barra), no se completa nada
    window.addEventListener("mousedown", function (e) {
      held = true;
      // Arrastrar la barra de scroll cuenta como gesto tuyo; pulsar un enlace o botón, no
      if (!(e.target.closest && e.target.closest("a, button, input, select, label"))) lastInput = performance.now();
    });
    // Al pulsar un enlace del menú (#tarifas…), la página viaja sola: nada de ajustes
    document.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest('a[href^="#"]')) lastInput = 0;
    });
    window.addEventListener("mouseup", function () { held = false; settleTimer = setTimeout(function () { settle(scrollDir); }, 160); });
    window.addEventListener("touchend", function () { held = false; });
    window.addEventListener("touchcancel", function () { held = false; });

    // Curva de movimiento: arranca a la velocidad que ya llevabas (m0) y frena
    // suavemente hasta pararse en el destino. Así no hay tirón al empezar.
    //   m0 = 0 → arranca desde parado · m0 = 1 → velocidad media · m0 > 1 → arranque rápido
    function curve(k, m0) {
      var k2 = k * k, k3 = k2 * k;
      return (k3 - 2 * k2 + k) * m0 + (-2 * k3 + 3 * k2);
    }
    function go(y) {
      var from = window.scrollY;
      var d = y - from;
      if (Math.abs(d) < 2) return;
      var dist = Math.abs(d);
      // Duración proporcional a la distancia: un tramo corto dura poco; uno largo, más
      var dur = clamp(300 + (dist / vh) * 600, 300, 1700);
      // Si ya venías con velocidad, la duración se adapta para continuarla sin frenazo
      var v0 = currentVel();
      var aligned = v0 * d > 0 && Math.abs(v0) > 0.05;
      if (aligned) dur = clamp(Math.min(dur, (1.8 * dist) / Math.abs(v0)), 300, 1700);
      // Velocidad de arranque normalizada; con un mínimo para que nunca arranque "a tirones"
      var m0 = aligned ? (Math.abs(v0) * dur) / dist : 0;
      m0 = clamp(m0, 0.9, 2.6);
      var t0 = performance.now();
      var done = false;
      stepping = true;
      html.style.scrollBehavior = "auto";
      function finish() {
        if (done) return;
        done = true;
        clearTimeout(safety);
        window.scrollTo(0, y);
        html.style.scrollBehavior = "";
        stepping = false;
        vel = 0; // la velocidad de la animación no cuenta como velocidad tuya
        lastScrollY = window.scrollY;
        var now = performance.now();
        // Filtro de inercia: proporcional al salto (un ajuste corto apenas espera),
        // y como máximo 0,7 s
        var cool = Math.min(700, dur * 0.6);
        coolUntil = now + Math.min(250, cool);
        coolHardStop = now + cool;
      }
      function frame(now) {
        if (done) return;
        var k = clamp((now - t0) / dur, 0, 1);
        window.scrollTo(0, from + d * curve(k, m0));
        if (k < 1) requestAnimationFrame(frame);
        else finish();
      }
      // Red de seguridad: si el navegador pausa la animación, el salto se completa igual
      var safety = setTimeout(finish, dur + 400);
      requestAnimationFrame(frame);
    }

    // Rueda del ratón / trackpad
    window.addEventListener("wheel", function (e) {
      if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return; // zoom o gesto lateral
      var dir = e.deltaY > 0 ? 1 : -1;
      var abs = Math.abs(e.deltaY);
      // Distancia real que movería este gesto (algunas ruedas miden en líneas o páginas)
      var px = abs * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? vh : 1);
      var now = performance.now();
      lastInput = now;

      // Durante la animación (máx. 1,7 s, siempre dentro del portal) la rueda espera
      if (stepping) { e.preventDefault(); lastAbs = abs; return; }
      // Inercia del trackpad tras la animación: se filtra mientras va frenando,
      // con un tope fijo para que nunca se quede pillado
      if (now < coolHardStop && (now < coolUntil || abs <= lastAbs)) {
        if (targetFor(dir, px) !== null) {
          e.preventDefault();
          coolUntil = Math.min(now + 120, coolHardStop);
          lastAbs = abs;
          return;
        }
      }
      lastAbs = abs;
      if (abs < 2) return;
      var y = targetFor(dir, px);
      if (y === null) return; // fuera del portal: scroll normal
      e.preventDefault();
      go(y);
    }, { passive: false });

    // Dedo (móvil y tablet)
    var startY = 0, decided = null;
    window.addEventListener("touchstart", function (e) {
      startY = e.touches[0].clientY;
      decided = null;
      held = true;
      lastInput = performance.now();
    }, { passive: true });
    window.addEventListener("touchmove", function (e) {
      lastInput = performance.now();
      if (decided === false) return;
      if (decided === true || stepping) { e.preventDefault(); return; }
      var dy = startY - e.touches[0].clientY;
      if (Math.abs(dy) < 12) return;
      var y = targetFor(dy > 0 ? 1 : -1, Math.abs(dy));
      if (y === null) { decided = false; return; } // fuera del portal: scroll normal
      decided = true;
      e.preventDefault();
      go(y);
    }, { passive: false });

    // Teclado (flechas, AvPág/RePág, espacio)
    window.addEventListener("keydown", function (e) {
      var el = e.target;
      if (el.closest && el.closest("input, select, textarea, [contenteditable]")) return;
      var dir = 0;
      if (e.key === "ArrowDown" || e.key === "PageDown") dir = 1;
      else if (e.key === "ArrowUp" || e.key === "PageUp") dir = -1;
      else if (e.key === " " && !(el.closest && el.closest("button, a"))) dir = e.shiftKey ? -1 : 1;
      if (!dir) return;
      lastInput = performance.now();
      var y = targetFor(dir, e.key.indexOf("Arrow") === 0 ? 40 : vh * 0.9);
      if (y === null) return;
      e.preventDefault();
      if (!stepping) go(y);
    });
  }

  /* ───────── Cifras ───────── */
  function initStats() {
    var fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "."); };
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      var start = performance.now() + 1600;
      function tick(t) {
        var k = clamp((t - start) / 1800, 0, 1);
        el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });

    var aforo = document.querySelector("[data-aforo]");
    if (aforo) {
      var now = new Date();
      var h = now.getHours() + now.getMinutes() / 60;
      var day = now.getDay();
      var open = day === 0 || day === 6 ? (h >= 9 && h < 14) : (h >= 6.5 && h < 22.5);
      if (!open) { aforo.textContent = "CERRADO"; return; }
      var load = 18 + 40 * Math.exp(-Math.pow(h - 8, 2) / 2) + 62 * Math.exp(-Math.pow(h - 19, 2) / 3);
      aforo.textContent = Math.min(96, Math.round(load)) + "%";
    }
  }

  /* ───────── Horario por pestañas ───────── */
  function initSchedule() {
    var tabs = document.querySelector("[data-tabs]");
    var list = document.querySelector("[data-schedule]");
    if (!tabs || !list) return;
    var buttons = tabs.querySelectorAll("button");
    function show(day) {
      buttons.forEach(function (b) {
        var on = b.getAttribute("data-day") === String(day);
        b.setAttribute("aria-selected", on ? "true" : "false");
        b.tabIndex = on ? 0 : -1;
      });
      list.innerHTML = (SCHEDULE[day] || []).map(function (r) {
        return "<li><time>" + esc(r[0]) + '</time><span class="cls">' + esc(r[1]) + '</span><span class="coach">' + esc(r[2]) + "</span></li>";
      }).join("");
    }
    buttons.forEach(function (b) { b.addEventListener("click", function () { show(b.getAttribute("data-day")); }); });
    tabs.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var arr = Array.prototype.slice.call(buttons);
      var i = arr.indexOf(document.activeElement);
      if (i < 0) return;
      var next = arr[(i + (e.key === "ArrowRight" ? 1 : arr.length - 1)) % arr.length];
      next.focus(); next.click();
    });
    var today = new Date().getDay();
    show(today === 0 ? 1 : today);
  }

  /* ───────── Formulario de prueba ───────── */
  function initForm() {
    var form = document.querySelector("[data-form]");
    if (!form) return;
    var msg = form.querySelector("[data-form-msg]");
    var planField = form.querySelector("[data-plan-field]");
    var holdTimer, clearTimer;

    // Muestra el mensaje 6 s y luego lo desvanece poco a poco (2 s, ver .form-msg)
    function showMsg(text) {
      clearTimeout(holdTimer);
      clearTimeout(clearTimer);
      msg.classList.remove("is-fading");
      msg.textContent = text;
      holdTimer = setTimeout(function () {
        msg.classList.add("is-fading");
        clearTimer = setTimeout(function () {
          msg.textContent = "";
          msg.classList.remove("is-fading");
        }, 2000);
      }, 6000);
    }

    document.querySelectorAll("[data-plan]").forEach(function (a) {
      a.addEventListener("click", function () {
        planField.value = a.getAttribute("data-plan");
        showMsg("Plan seleccionado: " + planField.value + ". Empieza con un día de prueba.");
      });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (f) {
        var bad = !f.value.trim();
        f.setAttribute("aria-invalid", bad ? "true" : "false");
        if (bad) ok = false;
      });
      if (!ok) { showMsg("Faltan tu nombre y una forma de contactarte."); return; }

      // Envío a Web3Forms: todos los campos (incluida la access_key oculta) en formato JSON.
      // Web3Forms responde { success: true } si la reserva se ha recibido.
      if (form.access_key.value === "PEGA_AQUI_TU_ACCESS_KEY") {
        console.warn("[form] Falta la access_key de Web3Forms en index.html");
        showMsg("El formulario aún no está configurado. Llámanos al 600 000 000.");
        return;
      }
      var button = form.querySelector('button[type="submit"]');
      var name = form.nombre.value.trim().split(" ")[0];
      var disciplina = form.disciplina.value.toLowerCase();
      var data = {};
      new FormData(form).forEach(function (value, key) { data[key] = value; });
      button.disabled = true;
      showMsg("Enviando…");

      fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      }).then(function (res) {
        return res.json().then(function (json) {
          if (!res.ok || !json.success) throw new Error(json.message || "HTTP " + res.status);
        });
      }).then(function () {
        showMsg("Gracias, " + name + ". Te escribimos hoy mismo para cerrar tu día de " + disciplina + ".");
        form.reset();
        planField.value = "";
      }).catch(function (err) {
        console.warn("[form]", err);
        showMsg("No hemos podido enviar tu reserva. Inténtalo de nuevo o llámanos al 600 000 000.");
      }).then(function () {
        button.disabled = false;
      });
    });
  }

  function boot() {
    safe(initSplit, "initSplit");
    safe(initSplash, "initSplash");
    safe(initReveals, "initReveals");
    safe(initPortal, "initPortal");
    safe(initChrome, "initChrome");
    safe(initParallax, "initParallax");
    safe(initLens, "initLens");
    safe(initCursor, "initCursor");
    safe(initMagnetic, "initMagnetic");
    safe(initTilt, "initTilt");
    safe(initMarquee, "initMarquee");
    safe(initGallery, "initGallery");
    safe(initCarve, "initCarve");
    safe(initStepper, "initStepper");
    safe(initStats, "initStats");
    safe(initSchedule, "initSchedule");
    safe(initForm, "initForm");
    requestAnimationFrame(loop);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
