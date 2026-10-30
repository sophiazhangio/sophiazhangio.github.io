(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function write(key, value) {
    try { value == null ? localStorage.removeItem(key) : localStorage.setItem(key, value); } catch (e) {}
  }

  /* ---------- Theme + accent ---------- */
  var toggle = document.getElementById("theme-toggle");
  var themeRadios = document.querySelectorAll('input[name="theme"]');
  var accentRadios = document.querySelectorAll('input[name="accent"]');

  function syncControls() {
    var saved = read("theme") || "system";
    themeRadios.forEach(function (r) { r.checked = r.value === saved; });
    accentRadios.forEach(function (r) { r.checked = r.value === (root.dataset.accent || "slate"); });
    var next = root.dataset.theme === "dark" ? "light" : "dark";
    toggle.setAttribute("aria-label", "Switch to " + next + " theme");
    renderTokens();
  }

  // Run a visual change, with a circle reveal from (x, y) when supported.
  function withTransition(change, x, y) {
    if (!document.startViewTransition || reduceMotion.matches) { change(); syncControls(); return; }
    var r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    var t = document.startViewTransition(function () { change(); syncControls(); });
    t.ready.then(function () {
      root.animate(
        { clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + r + "px at " + x + "px " + y + "px)"] },
        { duration: 560, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" }
      );
    });
  }

  function setTheme(choice, x, y) {
    write("theme", choice === "system" ? null : choice);
    var theme = choice === "system" ? (systemDark.matches ? "dark" : "light") : choice;
    if (theme === root.dataset.theme) { syncControls(); return; }
    withTransition(function () { root.dataset.theme = theme; }, x, y);
  }

  function centerOf(el) {
    var b = el.getBoundingClientRect();
    return [b.left + b.width / 2, b.top + b.height / 2];
  }

  toggle.addEventListener("click", function () {
    var c = centerOf(toggle);
    setTheme(root.dataset.theme === "dark" ? "light" : "dark", c[0], c[1]);
  });

  themeRadios.forEach(function (r) {
    r.addEventListener("change", function () {
      var c = centerOf(r.parentElement);
      setTheme(r.value, c[0], c[1]);
    });
  });

  accentRadios.forEach(function (r) {
    r.addEventListener("change", function () {
      var c = centerOf(r.parentElement);
      write("accent", r.value === "slate" ? null : r.value);
      withTransition(function () { root.dataset.accent = r.value; }, c[0], c[1]);
    });
  });

  systemDark.addEventListener("change", function (e) {
    if (!read("theme")) { root.dataset.theme = e.matches ? "dark" : "light"; syncControls(); }
  });

  /* ---------- Live token readout ---------- */
  var probe = document.createElement("span");
  probe.style.display = "none";
  document.body.appendChild(probe);

  function toHex(color) {
    var m = color.match(/[\d.]+/g);
    if (!m || m.length < 3) return color;
    return "#" + m.slice(0, 3).map(function (v) { return Math.round(+v).toString(16).padStart(2, "0"); }).join("");
  }

  function renderTokens() {
    document.querySelectorAll("#token-colors li").forEach(function (li) {
      var name = li.dataset.token;
      probe.style.color = "var(" + name + ")";
      var hex = toHex(getComputedStyle(probe).color);
      if (!li.firstChild) {
        li.innerHTML = '<span class="sw" aria-hidden="true"></span><span><span class="name"></span><br><span class="val"></span></span>';
      }
      li.querySelector(".sw").style.background = "var(" + name + ")";
      li.querySelector(".name").textContent = name;
      li.querySelector(".val").textContent = hex;
    });
  }

  /* ---------- Sticky nav border ---------- */
  var nav = document.querySelector(".nav");
  var sentinel = document.createElement("div");
  sentinel.style.cssText = "position:absolute;top:0;height:1px;width:1px";
  document.body.prepend(sentinel);
  new IntersectionObserver(function (entries) {
    nav.classList.toggle("is-stuck", !entries[0].isIntersecting);
  }).observe(sentinel);

  /* ---------- Scroll reveal ---------- */
  var revealed = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    document.querySelectorAll(".bento > [data-reveal]").forEach(function (el, i) {
      el.style.setProperty("--i", i % 2);
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px 10% 0px", threshold: 0 });
    revealed.forEach(function (el) { io.observe(el); });
  } else {
    revealed.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Pointer effects (mouse only, no reduced motion) ---------- */
  if (finePointer.matches && !reduceMotion.matches) {
    var tilt = document.getElementById("tilt");
    var hero = document.querySelector(".hero");
    var frame = 0, ev = null;
    hero.addEventListener("pointermove", function (e) {
      ev = e;
      if (frame) return;
      frame = requestAnimationFrame(function () {
        frame = 0;
        var e = ev;
        var b = hero.getBoundingClientRect();
        tilt.style.setProperty("--tx", ((e.clientX - b.left) / b.width - 0.5).toFixed(3));
        tilt.style.setProperty("--ty", ((e.clientY - b.top) / b.height - 0.5).toFixed(3));
      });
    });
    hero.addEventListener("pointerleave", function () {
      tilt.style.setProperty("--tx", 0);
      tilt.style.setProperty("--ty", 0);
    });

    // Spotlight on bento tiles
    var spotFrame = 0, lastEvent = null;
    document.getElementById("bento").addEventListener("pointermove", function (e) {
      lastEvent = e;
      if (spotFrame) return;
      spotFrame = requestAnimationFrame(function () {
        spotFrame = 0;
        var tile = lastEvent.target.closest(".tile");
        if (!tile) return;
        var b = tile.getBoundingClientRect();
        tile.style.setProperty("--mx", lastEvent.clientX - b.left + "px");
        tile.style.setProperty("--my", lastEvent.clientY - b.top + "px");
      });
    });
  }

  syncControls();
})();
