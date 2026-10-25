'use strict';
(() => {
  const items = {
    saturn: {
      title: '环的另一边',
      image: './assets/saturn-scene.webp',
      alt: '《环的另一边》使用的 NASA 卡西尼号土星背光影像',
      url: 'https://ndshuge.github.io/ndshuge-galaxy/little-works/saturn-atlas/',
      description: '从卡西尼号的真实影像，走进可以自己操作的土星环实验。'
    },
    zhixu: {
      title: '知序 AI 学院',
      image: './assets/zhixu.webp',
      alt: '知序 AI 学院网页实拍：先预测再验证的学习界面',
      url: 'https://ndshuge.github.io/zhixu-ai-academy/',
      description: '如果学习不只是答对，而是先猜测、再动手验证呢？'
    },
    shanhe: {
      title: '山河为证',
      image: './assets/shanhe.webp',
      alt: '山河为证网页实拍：历史地图和叙事主视觉',
      url: 'https://ndshuge.github.io/shanhe-preview/',
      description: '一段历史，也可以从不同的地图与行进路线重新走近。'
    }
  };
  const img = document.getElementById('heroProjectImage');
  const title = document.getElementById('heroProjectTitle');
  const description = document.getElementById('heroProjectDescription');
  const link = document.getElementById('heroProjectLink');
  const buttons = [...document.querySelectorAll('[data-show]')];
  if (!img || !title || !description || !link || !buttons.length) return;
  let current = 'saturn';
  let requestId = 0;
  function selectProject(id) {
    if (!(id in items)) return;
    const project = items[id];
    for (const button of buttons) {
      const active = button.dataset.show === id;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
    const next = ++requestId;
    current = id;
    if (img.getAttribute('src') === project.image) {
      title.textContent = project.title;
      description.textContent = project.description;
      link.href = project.url;
      link.setAttribute('aria-label', '打开' + project.title + '作品');
      return;
    }
    link.classList.add('image-changing');
    const preload = new Image();
    const commit = () => {
      if (next !== requestId) return;
      img.src = project.image;
      img.alt = project.alt;
      title.textContent = project.title;
      description.textContent = project.description;
      link.href = project.url;
      link.setAttribute('aria-label', '打开' + project.title + '作品');
      link.classList.remove('image-changing');
    };
    preload.onload = commit;
    preload.onerror = () => {
      if (next === requestId) {
        link.classList.remove('image-changing');
        buttons.find(b => b.dataset.show === id)?.setAttribute('aria-pressed','false');
      }
    };
    preload.src = project.image;
    if (preload.complete && preload.naturalWidth) commit();
  }
  for (const button of buttons) button.addEventListener('click', () => selectProject(button.dataset.show));
  const switchGroup = document.querySelector('.hero-switch');
  switchGroup?.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const active = buttons.indexOf(document.activeElement);
    if (active < 0) return;
    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const next = buttons[(active + delta + buttons.length) % buttons.length];
    next.focus();
    selectProject(next.dataset.show);
  });
  // Show an actual project as it enters view; never animate for reduced-motion users.
  if (window.IntersectionObserver && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('has-motion');
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        reveal.unobserve(entry.target);
      });
    }, {rootMargin:'0px 0px 25px 0px',threshold:0.08});
    document.querySelectorAll('.project').forEach(el => reveal.observe(el));
  }
})();
