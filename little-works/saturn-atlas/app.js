/* 环的另一边 — interactive orbital geometry diagram.
   The photographic mosaic above is real Cassini imagery. This canvas is a schematic
   of ring projection as a function of line-of-sight elevation, not a physical simulation. */
(() => {
  'use strict';
  const canvas = document.getElementById('ringCanvas');
  const slider = document.getElementById('angleSlider');
  const angleValue = document.getElementById('angleValue');
  const angleNote = document.getElementById('angleNote');
  if (!canvas || !slider) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  let angle = Number(slider.value);
  let resizeObserver;
  const format = n => Number(n).toLocaleString('zh-CN');
  function noise(n) {
    const x = Math.sin(n * 91.317 + 1.447) * 9758.429;
    return x - Math.floor(x);
  }
  function drawEllipse(cx, cy, rx, ry, rotation, t0, t1) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, Math.max(1, ry), rotation, t0, t1);
  }
  function draw() {
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.round(rect.width * dpr), height = Math.round(rect.height * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width; canvas.height = height;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = rect.width, h = rect.height;
    ctx.clearRect(0, 0, w, h);
    for (let i = 1; i < 115; i++) {
      const x = noise(i * 7) * w, y = noise(i * 19) * h;
      ctx.fillStyle = 'rgba(215,224,217,' + (0.05 + noise(i * 29) * 0.32) + ')';
      ctx.fillRect(x, y, i % 11 ? .8 : 1.6, i % 11 ? .8 : 1.6);
    }
    const cx = w * .5, cy = h * .52;
    const r = Math.min(w * .124, h * .172, 98);
    const scale = Math.min(w * .37 / (r * 2.3), h * .42 / (r * 2.3), 1.36);
    const rr = r * scale;
    const tilt = Math.sin(angle * Math.PI / 180);
    const rotation = -0.075;
    // Three families of ice-rich ring particles with an implied Cassini Division.
    function ringPath(front) {
      const t0 = front ? 0 : Math.PI;
      const t1 = front ? Math.PI : Math.PI * 2;
      for (let n = 0; n < 100; n++) {
        const R = 1.35 + n / 99 * 1.06;
        const gap = R > 1.88 && R < 2.02;
        const speckle = noise(n * 13);
        const alpha = gap ? .035 : .11 + .24 * speckle;
        const tone = n < 38 ? '191,180,154' : n < 66 ? '218,196,151' : '173,160,145';
        ctx.strokeStyle = 'rgba(' + tone + ',' + alpha + ')';
        ctx.lineWidth = Math.max(.55, .70 * scale);
        drawEllipse(cx, cy, rr * R, rr * R * tilt, rotation, t0, t1);
        ctx.stroke();
      }
      for (const R of [1.36, 1.86, 2.05, 2.40]) {
        ctx.strokeStyle = R === 1.86 ? 'rgba(245,219,166,.45)' : 'rgba(194,179,157,.35)';
        ctx.lineWidth = .8;
        drawEllipse(cx, cy, rr * R, rr * R * tilt, rotation, t0, t1);
        ctx.stroke();
      }
    }
    // Rearward hemisphere of the ring is drawn behind the globe.
    ringPath(false);
    const halo = ctx.createRadialGradient(cx, cy, r * .2, cx, cy, r * 1.8);
    halo.addColorStop(0, 'rgba(222,174,109,.07)');
    halo.addColorStop(.7, 'rgba(222,174,109,.06)');
    halo.addColorStop(1, 'rgba(222,174,109,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.8, 0, Math.PI * 2); ctx.fill();

    const glow = ctx.createRadialGradient(cx - r * .30, cy - r * .18, r * .12, cx + r * .4, cy + r * .1, r * 1.25);
    glow.addColorStop(0, '#f5dda6'); glow.addColorStop(.39, '#ccb189'); glow.addColorStop(.73, '#a58e75');
    glow.addColorStop(1, '#394449');
    ctx.fillStyle = glow;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
    for (let i = 0; i < 16; i++) {
      const y = cy - r * .75 + i * r * .11;
      ctx.strokeStyle = 'rgba(76,82,78,' + (0.075 + .05 * noise(i * 13)) + ')';
      ctx.lineWidth = 1.5 + 5 * noise(i * 5);
      ctx.beginPath();ctx.moveTo(cx - r,y);ctx.bezierCurveTo(cx - r * .3,y-3,cx + r * .3,y+4,cx + r,y);ctx.stroke();
    }
    ctx.restore();
    // Draw near arc in front. Its front projection can cross the planet's silhouette.
    ringPath(true);
    // Neutral instrument crosshairs and non-measurement axis labels.
    ctx.strokeStyle='rgba(161,183,176,.18)';ctx.lineWidth=.75;
    ctx.beginPath();ctx.moveTo(cx,cy-r*2.7);ctx.lineTo(cx,cy-r*1.3);ctx.moveTo(cx,cy+r*1.3);ctx.lineTo(cx,cy+r*2.7);ctx.stroke();
  }
  function updateAngle(next) {
    angle = Math.max(0, Math.min(90, Number(next) || 0));
    slider.value = String(angle);
    angleValue.textContent = angle + '°';
    slider.style.setProperty('--progress', angle + '%');
    for (const btn of document.querySelectorAll('[data-angle]')) {
      const selected = Number(btn.dataset.angle) === angle;
      btn.classList.toggle('is-active', selected);
      btn.setAttribute('aria-pressed', String(selected));
    }
    angleNote.textContent = angle <= 3
      ? '正从环面侧方观察：宽阔的环在投影中几乎成了一条线。实际的主环仍有薄薄的厚度。'
      : angle >= 80
      ? '几乎俯看环面：同心的冰粒环带与空隙更加容易区分。'
      : angle <= 35
      ? '从较低角度看，宽阔的环面被压成狭长的椭圆。'
      : '随着视线抬高，投影中的环越来越展开，但真实的环并没有变形。';
    draw();
  }
  slider.addEventListener('input', e => updateAngle(e.target.value));
  for (const btn of document.querySelectorAll('[data-angle]')) {
    btn.addEventListener('click', () => updateAngle(btn.dataset.angle));
  }
  if ('ResizeObserver' in window) { resizeObserver = new ResizeObserver(draw); resizeObserver.observe(canvas); }
  else window.addEventListener('resize', draw, { passive: true });
  updateAngle(angle);

  // Sunlight travel-time comparison at average orbital distances.
  // Numbers are approximate, based on mean distances and c ~ 299,792 km/s.
  const objects = {
    earth: { label:'地球', name:'EARTH', minutes:8.3, show:'8.3', unit:'分钟', description:'太阳光平均约需 8 分 19 秒抵达地球。这也是我们看到的太阳稍早前的样子。' },
    mars: { label:'火星', name:'MARS', minutes:12.7, show:'12.7', unit:'分钟', description:'按平均日心距离估算，太阳光约需 12.7 分钟抵达火星；实际距离随公转改变。' },
    jupiter: { label:'木星', name:'JUPITER', minutes:43, show:'43', unit:'分钟', description:'从太阳到木星的平均光行时约 43 分钟。木星与地球之间的通信时延另行计算。' },
    saturn: { label:'土星', name:'SATURN', minutes:80, show:'80', unit:'分钟', description:'太阳至土星的平均距离约 9.5 AU；80 分钟是近似光行时。' }
  };
  const time = document.getElementById('lightTime');
  const target = document.getElementById('signalTarget');
  const progress = document.getElementById('signalProgress');
  const desc = document.getElementById('signalDesc');
  const end = document.getElementById('signalEnd');
  function selectWorld(name) {
    const body = objects[name]; if (!body) return;
    time.replaceChildren(document.createTextNode(body.show+' '));
    const unit = document.createElement('span'); unit.textContent = body.unit; time.appendChild(unit);
    target.textContent = '太阳光抵达' + body.label + '，平均约需';
    end.textContent = body.label + ' · 抵达';
    desc.textContent = body.description;
    progress.style.width = (body.minutes / 80 * 100).toFixed(1) + '%';
    for (const btn of document.querySelectorAll('[data-world]')) {
      const active = btn.dataset.world === name;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    }
  }
  for (const btn of document.querySelectorAll('[data-world]')) btn.addEventListener('click', () => selectWorld(btn.dataset.world));
  selectWorld('saturn');
})();
