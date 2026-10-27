"use strict";
(function () {
  const body = document.body;
  const stage = document.getElementById("stage");
  const orb = document.getElementById("orb");
  const status = document.getElementById("stageStatus");
  const hint = document.getElementById("orbHint");
  const ripples = document.getElementById("ripples");
  const slider = document.getElementById("softness");
  const value = document.getElementById("softnessValue");
  const countEl = document.getElementById("lightCount");
  const toast = document.getElementById("toast");
  const help = document.getElementById("helpDialog");
  const helpButton = document.getElementById("helpButton");
  const helpDone = document.getElementById("dialogDone");
  const notes = {
    solid: ["00 / SOLID", "清晰实体表面，优先保证对比与可读性。"],
    frost: ["01 / SOFT", "柔和的背景模糊，让内容与环境轻轻分离。"],
    refract: ["02 / REFRACT", "局部 SVG 位移滤镜，模拟光线穿过玻璃时的微小偏折。"]
  };
  const scenes = {
    morning: ["晨光", "☀"],
    sunset: ["落日", "◕"],
    midnight: ["星夜", "✦"]
  };
  const prefsKey = "shuge.interaction-lab.preferences.v1";
  const countKey = "shuge.interaction-lab.collected.v1";
  function readJSON(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (_) { return fallback; }
  }
  function saveJSON(key, obj) { try { localStorage.setItem(key, JSON.stringify(obj)); } catch (_) {} }
  const stored = readJSON(prefsKey, {});
  const prefs = {
    scene: scenes[stored.scene] ? stored.scene : "morning",
    material: notes[stored.material] ? stored.material : "frost",
    intensity: Number.isFinite(+stored.intensity) ? Math.min(100, Math.max(15, +stored.intensity)) : 64
  };
  let count = Math.max(0, Math.min(99999, Number(readJSON(countKey, 0)) || 0));
  countEl.textContent = String(count);
  const savePrefs = () => saveJSON(prefsKey, prefs);
  function setScene(scene) {
    if (!scenes[scene]) return;
    prefs.scene = scene;
    body.dataset.scene = scene;
    document.getElementById("weatherName").textContent = scenes[scene][0];
    document.getElementById("weatherSymbol").textContent = scenes[scene][1];
    document.querySelectorAll("[data-choice]").forEach(btn => {
      const isActive = btn.dataset.choice === scene;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });
    savePrefs();
  }
  function setMaterial(material) {
    if (!notes[material]) return;
    prefs.material = material;
    body.dataset.material = material;
    document.getElementById("glassLabel").textContent = notes[material][0];
    document.getElementById("materialNote").textContent = notes[material][1];
    document.querySelectorAll("[data-glass]").forEach(btn => {
      const isActive = btn.dataset.glass === material;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });
    savePrefs();
  }
  function setIntensity(input) {
    prefs.intensity = Math.max(15, Math.min(100, Number(input) || 15));
    slider.value = String(prefs.intensity);
    slider.style.setProperty("--track", prefs.intensity + "%");
    value.textContent = prefs.intensity + "%";
    stage.style.setProperty("--glowpx", Math.round(prefs.intensity * .7) + "px");
    const orbInner = orb.querySelector(".orb-inner");
    orbInner.style.filter = "saturate(" + (0.8 + prefs.intensity / 170).toFixed(2) + ") brightness(" + (0.88 + prefs.intensity / 530).toFixed(2) + ")";
    savePrefs();
  }
  document.querySelectorAll("[data-choice]").forEach(btn => btn.addEventListener("click", () => setScene(btn.dataset.choice)));
  document.querySelectorAll("[data-glass]").forEach(btn => btn.addEventListener("click", () => setMaterial(btn.dataset.glass)));
  slider.addEventListener("input", () => setIntensity(slider.value));
  setScene(prefs.scene); setMaterial(prefs.material); setIntensity(prefs.intensity);

  let interaction = null, raf = 0, toastTimer = 0;
  const HOLD = 550;
  const DRAG = 12;
  function moveOrb(x, y) {
    stage.style.setProperty("--orbX", Math.round(x) + "px");
    stage.style.setProperty("--orbY", Math.round(y) + "px");
  }
  function resetOrb() {
    orb.classList.remove("dragging", "held");
    stage.style.setProperty("--charge", "0");
    moveOrb(0,0);
    hint.textContent = "试着按住这束光";
    status.textContent = "TOUCH · HOLD · DRAG";
  }
  function animateHold() {
    if (!interaction || interaction.moved) return;
    const t = performance.now() - interaction.started;
    stage.style.setProperty("--charge", String(Math.min(100, Math.round(t / HOLD * 100))));
    if (t >= HOLD) {
      hint.textContent = "松开，收藏这束光";
      status.textContent = "READY TO COLLECT";
    }
    raf = requestAnimationFrame(animateHold);
  }
  function rippleAt(clientX, clientY) {
    const b = stage.getBoundingClientRect();
    const circle = document.createElement("span");
    circle.className = "ripple";
    circle.style.left = (clientX - b.left) + "px";
    circle.style.top = (clientY - b.top) + "px";
    ripples.appendChild(circle);
    circle.addEventListener("animationend", () => circle.remove(), { once:true });
    setTimeout(() => circle.remove(), 1400);
  }
  function flash(text) {
    clearTimeout(toastTimer);
    toast.classList.remove("show");
    toast.textContent = text;
    requestAnimationFrame(() => toast.classList.add("show"));
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2350);
  }
  function collect(cx, cy) {
    count = Math.min(count + 1, 99999);
    countEl.textContent = String(count);
    saveJSON(countKey, count);
    rippleAt(cx, cy);
    flash("✦  收集了一束光");
    status.textContent = "LIGHT COLLECTED";
    if (navigator.vibrate) { try { navigator.vibrate(16); } catch (_) {} }
  }
  function stopGesture(e, cancel) {
    if (!interaction) return;
    if (e && interaction.pointerId !== undefined && e.pointerId !== interaction.pointerId) return;
    const it = interaction;
    interaction = null;
    cancelAnimationFrame(raf);
    try { if (it.pointerId !== undefined && orb.hasPointerCapture(it.pointerId)) orb.releasePointerCapture(it.pointerId); } catch (_) {}
    if (!cancel && !it.moved) {
      const dx = it.clientX || orb.getBoundingClientRect().left + orb.offsetWidth / 2;
      const dy = it.clientY || orb.getBoundingClientRect().top + orb.offsetHeight / 2;
      if (performance.now() - it.started >= HOLD) collect(dx,dy);
      else rippleAt(dx,dy);
    }
    resetOrb();
  }
  orb.addEventListener("pointerdown", e => {
    if (e.button !== 0 || interaction) return;
    interaction = {pointerId:e.pointerId, started:performance.now(), x:e.clientX, y:e.clientY, clientX:e.clientX, clientY:e.clientY, moved:false};
    try {orb.setPointerCapture(e.pointerId);} catch (_) {}
    orb.classList.add("held");
    hint.textContent = "正在凝聚光…";
    status.textContent = "HOLD TO COLLECT";
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(animateHold);
  });
  orb.addEventListener("pointermove", e => {
    if (!interaction || e.pointerId !== interaction.pointerId) return;
    interaction.clientX = e.clientX; interaction.clientY = e.clientY;
    const dx = e.clientX - interaction.x, dy = e.clientY - interaction.y;
    if (Math.hypot(dx,dy) > DRAG) interaction.moved = true;
    if (interaction.moved) {
      cancelAnimationFrame(raf);
      orb.classList.remove("held");
      orb.classList.add("dragging");
      stage.style.setProperty("--charge", "0");
      moveOrb(Math.max(-125,Math.min(125,dx)),Math.max(-110,Math.min(110,dy)));
      hint.textContent = "松开，让光回到原点";
      status.textContent = "DRAG · RELEASE";
    }
  });
  orb.addEventListener("pointerup", e => stopGesture(e,false));
  orb.addEventListener("pointercancel", e => stopGesture(e,true));
  orb.addEventListener("lostpointercapture", e => {if(interaction && interaction.pointerId === e.pointerId)stopGesture(e,true);});
  orb.addEventListener("contextmenu", e => e.preventDefault());
  window.addEventListener("blur", () => stopGesture(null,true));
  // Keyboard alternative: Enter collects immediately. Holding Space reproduces the held state.
  orb.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault(); if (e.repeat) return;
      const r=orb.getBoundingClientRect(); collect(r.left + r.width/2,r.top + r.height/2); return;
    }
    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      if (interaction || e.repeat) return;
      const r=orb.getBoundingClientRect();
      interaction={started:performance.now(),moved:false,clientX:r.left+r.width/2,clientY:r.top+r.height/2};
      orb.classList.add("held");
      hint.textContent="正在凝聚光…";
      raf=requestAnimationFrame(animateHold);
    }
  });
  orb.addEventListener("keyup", e => {if (e.key === " " || e.code === "Space"){e.preventDefault(); if(interaction && interaction.pointerId===undefined)stopGesture(null,false);}});
  function closeHelp() {help.close();}
  helpButton.addEventListener("click", () => {help.showModal(); helpDone.focus();});
  helpDone.addEventListener("click", closeHelp);
  help.addEventListener("close", () => helpButton.focus());
  help.addEventListener("click", e => {if(e.target===help)closeHelp();});
})();