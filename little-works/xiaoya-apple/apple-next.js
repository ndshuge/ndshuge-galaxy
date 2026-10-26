import { createGlass, createSpring, engine } from './glass/liquid-glass.js';

const body = document.body;
if (body.classList.contains('design-apple')) {
  body.classList.add('apple-next');
  const day = document.getElementById('view-today');
  const shell = day?.querySelector('.xy-cinema');
  const overview = shell?.querySelector('.overview-grid');
  if (shell && overview) {
    shell.querySelector('.xy-redesign-intro')?.remove();
    shell.querySelector('.xy-focus-marker')?.remove();
    shell.after(overview);
    overview.classList.add('xy-floating-panels');
    shell.setAttribute('aria-label','今日概览');
  }

  const h1 = shell?.querySelector('#hero-title');
  if (h1 && h1.textContent.replace(/\s/g,'').startsWith('今天，也在慢慢成长')) {
    const period = h1.querySelector('.hero-period');
    h1.textContent = '今天，';
    const rest = document.createElement('span');
    rest.className = 'xy-hero-continuation';
    rest.textContent = '也在慢慢成长';
    h1.append(rest);
    if (period) rest.append(period);
  }
  const dock = document.querySelector('.mobile-tabs');
  if (dock) {
    const lens = document.createElement('span');
    lens.className = 'xy-glass-indicator';
    lens.setAttribute('aria-hidden','true');
    dock.prepend(lens);
    const buttons = [...dock.querySelectorAll('button[data-view]')];
    let location = 0;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const reducedTransparency = matchMedia('(prefers-reduced-transparency: reduce)');
    const positionSpring = createSpring(0, v => {
      location = v;
      lens.style.transform = 'translate3d(' + v.toFixed(2) + 'px,0,0)';
    });
    function updateIndicator(instant = false) {
      if (window.innerWidth > 790) return;
      const target = buttons.find(b => b.classList.contains('active')) || buttons[0];
      if (!target) return;
      const r = target.getBoundingClientRect();
      const parent = dock.getBoundingClientRect();
      lens.style.width = r.width + 'px';
      lens.style.height = r.height + 'px';
      lens.style.top = (r.top-parent.top) + 'px';
      const x = r.left-parent.left;
      if (instant || reducedMotion.matches) {
        positionSpring.set(x, true);
        location = x;
        lens.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      } else {
        positionSpring.set(x);
      }
    }
    const observer = new MutationObserver(() => updateIndicator(false));
    buttons.forEach(b => observer.observe(b,{attributes:true,attributeFilter:['class']}));
    dock.addEventListener('pointerdown',e => {
      const b = e.target.closest('button[data-view]');
      if (b) lens.classList.add('is-pressed');
    });
    const release = () => lens.classList.remove('is-pressed');
    dock.addEventListener('pointerup',release);
    dock.addEventListener('pointercancel',release);
    dock.addEventListener('pointerleave',release);
    buttons.forEach(b=>b.addEventListener('focus',()=>updateIndicator(false)));
    window.addEventListener('resize',()=>updateIndicator(true),{passive:true});
    requestAnimationFrame(() => {
      updateIndicator(true);
      if (!reducedTransparency.matches) {
        try {
          const opticalLens = createGlass(lens, {
            mode:'backdrop',fit:true,radius:21,refraction:17,bezel:.68,
            curvature:4,chroma:.1,specular:.68,specularWidth:1.4,
            fallback:'blur(7px) saturate(1.35)'
          });
          dock.dataset.glass = engine === 'blink' && opticalLens ? 'refraction' : 'frosted-fallback';
          dock.dataset.glassEngine = engine;
        } catch (e) {
          dock.dataset.glass='fallback';
          console.warn('Glass renderer fallback:',e.message);
        }
      } else dock.dataset.glass='reduced-transparency';
    });
  }
}
