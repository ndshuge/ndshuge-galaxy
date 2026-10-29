// GameVerse — faithful iOS/macOS presentation layer. Core game logic lives in app.js.
(() => {
  const root = document.getElementById('libraryPreview');
  if (!root || typeof GAMES === 'undefined') return;
  const ids = ['vocalon-chaos','belfry','motu','ghostslash','gravity-garden','ww2-frontline','still','lumen-siege'];
  root.innerHTML = ids.map(id => {
    const game = GAMES.find(g => g.id === id);
    if (!game) return '';
    return '<button type="button" class="preview-game" data-detail="' + game.id +
      '" aria-label="查看' + game.name + '的游戏详情"><span class="preview-art"><img src="' + art(game.id) +
      '" alt="" loading="lazy" decoding="async"></span><span title="' + game.name + '">' + game.name + '</span></button>';
  }).join('');
  // Material stays on the floating controls; the content images are unfiltered.
  // The carousel is intentionally user-driven, including touch swipe and keyboard dots.
  const hero = document.getElementById('featureHero');
  if (hero) hero.setAttribute('aria-roledescription','轮播精选游戏');
  // Give buttons a pressed state without moving their interactive hit areas.
  document.addEventListener('pointerdown', e => {
    const target = e.target.closest('.preview-game,.rail-card,.mobile-tab,.mobile-top-nav button');
    if (target) target.classList.add('is-pressed');
  }, {passive:true});
  for (const event of ['pointerup','pointercancel']) {
    document.addEventListener(event, () => {
      document.querySelectorAll('.is-pressed').forEach(el => el.classList.remove('is-pressed'));
    }, {passive:true});
  }
})();
