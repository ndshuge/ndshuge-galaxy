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
    // Pattern B from the installed liquid-glass-web skill: WebKit/Gecko
    // refract a decorative COPY of the dock content, not arbitrary DOM behind it.
    // The six native buttons remain untouched and receive every tap and focus.
    let contentSurface = null;
    let contentOptics = null;
    if (engine !== 'blink') {
      contentSurface = document.createElement('div');
      contentSurface.className = 'xy-refract-copy';
      contentSurface.setAttribute('aria-hidden', 'true');
      for (const button of buttons) {
        const cell = document.createElement('span');
        cell.className = 'xy-refract-cell';
        // Trusted static navigation artwork only; clone the SVG icon as well as its text.
        // Use DOM cloning, not innerHTML, so the optical copy cannot parse user data.
        cell.append(...[...button.childNodes].map(node => node.cloneNode(true)));
        contentSurface.append(cell);
      }
      dock.insertBefore(contentSurface, buttons[0]);
      contentSurface.firstElementChild?.classList.add('is-selected');
    }
    let location = 0;
    let copyOffset = -5;
    let lastOpticalPosition = NaN;
    let lastOpticalUpdate = 0;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const reducedTransparency = matchMedia('(prefers-reduced-transparency: reduce)');
    const positionSpring = createSpring(0, (v, velocity) => {
      location = v;
      lens.style.transform = 'translate3d(' + v.toFixed(2) + 'px,0,0)';
      if (contentOptics && contentSurface) {
        // WebKit reissues a new filter id even when only x changes. Throttle
        // optical updates while the lightweight indicator still tracks 60 Hz.
        // Never force layout by reading DOM rects on every spring frame.
        const x = v + copyOffset;
        const now = performance.now();
        if (velocity === 0 || (now-lastOpticalUpdate >= 64 && Math.abs(x-lastOpticalPosition) >= 4)) {
          contentOptics.update({x});
          lastOpticalPosition=x;
          lastOpticalUpdate=now;
        }
      }
    });
    function updateIndicator(instant = false) {
      if (window.innerWidth > 790) return;
      const target = buttons.find(b => b.classList.contains('active')) || buttons[0];
      if (contentSurface) [...contentSurface.children].forEach((cell,i)=>cell.classList.toggle('is-selected',buttons[i]===target));
      if (!target) return;
      if (contentSurface) [...contentSurface.children].forEach((cell,i)=>cell.classList.toggle('is-selected',buttons[i]===target));
      const r = target.getBoundingClientRect();
      const parent = dock.getBoundingClientRect();
      lens.style.width = r.width + 'px';
      lens.style.height = r.height + 'px';
      lens.style.top = (r.top-parent.top) + 'px';
      const x = r.left-parent.left;
      if (contentOptics && contentSurface) {
        const c = contentSurface.getBoundingClientRect();
        copyOffset=parent.left-c.left;
        contentOptics.update({y:r.top-c.top, width:r.width, height:r.height, radius:Math.min(23,r.height/2)});
      }
      if (instant || reducedMotion.matches) {
        positionSpring.set(x, { immediate: true });
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
    // One-shot initialization: WebKit sometimes suppresses the first rAF while
    // the initial setup sheet overlays the document. Never leave the copy unfiltered.
    setTimeout(() => {
      updateIndicator(true);
      if (!reducedTransparency.matches) {
        try {
          if (engine === 'blink') {
            const opticalLens = createGlass(lens, {
              mode:'backdrop',fit:true,radius:23,refraction:16,bezel:.62,
              curvature:4,chroma:.08,specular:.64,specularWidth:1.4,
              fallback:'blur(7px) saturate(1.35)'
            });
            dock.dataset.glass = opticalLens ? 'refraction' : 'frosted-fallback';
          } else if (contentSurface) {
            // A real SVG displacement of the copied tab art works in WebKit.
            // This bends dock ICONS and LABELS, not live scrolling-page pixels.
            const c = contentSurface.getBoundingClientRect();
            const selected = buttons.find(b => b.classList.contains('active')) || buttons[0];
            const r = selected.getBoundingClientRect();
            copyOffset = dock.getBoundingClientRect().left-c.left;
            lastOpticalPosition = r.left-c.left;
            lastOpticalUpdate = performance.now();
            contentOptics = createGlass(contentSurface, {
              sync:true, clip:true, x:r.left-c.left, y:r.top-c.top,
              width:r.width, height:r.height, radius:23,
              refraction:7, bezel:.38, curvature:4, chroma:0,
              specular:.5,specularWidth:1.35
            });
            dock.dataset.glass = contentOptics ? 'content-refraction' : 'frosted-fallback';
            if (contentOptics) {
              let attempts=0;
              const reveal=()=>{
                if (!contentSurface.isConnected) return;
                if (getComputedStyle(contentSurface).filter.includes('url(')) dock.classList.add('has-content-refraction');
                else if (++attempts<180) requestAnimationFrame(reveal);
                else { contentOptics.destroy(); contentOptics=null; contentSurface.remove(); dock.dataset.glass='frosted-fallback'; }
              };
              requestAnimationFrame(reveal);
            }
          }
          dock.dataset.glassEngine = engine;
        } catch (e) {
          dock.dataset.glass='fallback';
          console.warn('Glass renderer fallback:',e.message);
        }
      } else dock.dataset.glass='reduced-transparency';
    });
  }
}
