const tabs = [...document.querySelectorAll('[data-view]')];
const hero = document.querySelector('#heroImage');
const alternate = document.querySelector('#altImage');
const viewer = document.querySelector('#viewer');
const status = document.querySelector('#viewerStatus');
const caption = document.querySelector('#stageCaption');
const hint = document.querySelector('#stageHint');
const resetButton = document.querySelector('#resetView');

let currentView = 'hero';
let threeLoaded = false;
let initializing = null;
let restoreView = null;

const labels = {
  hero: ['01 / 03', '原照片机位重建 · Blender 渲染', '真实模型渲染 · 1536 × 1024'],
  alt: ['02 / 03', '从右侧进入空间 · 第二机位', '真实模型渲染 · 1280 × 854'],
  model: ['03 / 03', '自由探索 · 拖动旋转 · 滚轮或双指缩放', '可编辑三维几何 · 点击拖动观察空间']
};

function showView(view) {
  currentView = view;
  for (const tab of tabs) {
    const active = tab.dataset.view === view;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-pressed', String(active));
  }
  hero.classList.toggle('is-shown', view === 'hero');
  alternate.classList.toggle('is-shown', view === 'alt');
  viewer.hidden = view !== 'model';
  resetButton.hidden = view !== 'model' || !threeLoaded;
  caption.innerHTML = '<span class="caption-index">' + labels[view][0] + '</span>' + labels[view][1];
  hint.textContent = labels[view][2];
  if (view === 'model' && !initializing && !threeLoaded) {
    initializing = startViewer().catch(error => {
      console.error('Blender model viewer unavailable:', error);
      status.textContent = '3D 暂时不可用，可以继续查看两张真实渲染图或下载 GLB。';
      status.hidden = false;
    });
  }
}

tabs.forEach(tab => tab.addEventListener('click', () => showView(tab.dataset.view)));
resetButton.addEventListener('click', () => restoreView?.());

async function startViewer() {
  if (!('WebGL2RenderingContext' in window)) throw Error('WebGL2 not supported');
  status.hidden = false;
  status.textContent = '正在加载真正的三维场景…';

  const [{ Scene, PerspectiveCamera, WebGLRenderer, Color, HemisphereLight, DirectionalLight,
            Vector3, Box3, SRGBColorSpace, ACESFilmicToneMapping },
         { GLTFLoader },
         { OrbitControls }] = await Promise.all([
    import('./vendor/three.module.js'),
    import('./vendor/jsm/loaders/GLTFLoader.js'),
    import('./vendor/jsm/controls/OrbitControls.js')
  ]);

  const scene = new Scene();
  scene.background = new Color('#0b1d30');
  const camera = new PerspectiveCamera(55, 1, .05, 250);
  const renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.72;
  renderer.shadowMap.enabled = false;
  renderer.domElement.setAttribute('aria-label', '三维乐园，可用鼠标或手指旋转缩放');
  renderer.domElement.setAttribute('tabindex', '0');
  viewer.appendChild(renderer.domElement);

  const hemisphere = new HemisphereLight(0xe1f0ff, 0x55738a, 1.05);
  scene.add(hemisphere);
  const key = new DirectionalLight(0xffeddc, 0.65);
  key.position.set(-7, 15, 9);
  scene.add(key);
  const fill = new DirectionalLight(0x9ed6ff, 0.48);
  fill.position.set(10, 9, -8);
  scene.add(fill);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.minDistance = 1;
  controls.maxDistance = 80;
  controls.maxPolarAngle = Math.PI * .91;
  controls.zoomSpeed = .8;

  const model = await new Promise((resolve, reject) => {
    new GLTFLoader().load('./playground.glb',
      resolve,
      event => {
        if (event.lengthComputable && event.total > 0) {
          const percent = Math.min(99, Math.max(0, Math.round(event.loaded / event.total * 100)));
          status.textContent = '载入场景 ' + percent + '%';
        }
      },
      reject
    );
  });
  scene.add(model.scene);
  model.scene.updateWorldMatrix(true, true);

  const bounds = new Box3().setFromObject(model.scene);
  const center = bounds.getCenter(new Vector3());
  const extent = bounds.getSize(new Vector3());
  if (![center.x, center.y, center.z].every(Number.isFinite)) throw Error('Invalid GLB bounds');

  // The model was authored in Blender Z-up; glTF exports Y-up.
  // Prefer its embedded photo-matched camera instead of guessing from the bounding sphere.
  const originalCamera = model.cameras.find(c => /01|photo.matched/i.test(c.name));
  const savedPosition = new Vector3();
  const savedTarget = new Vector3();
  if (originalCamera) {
    originalCamera.getWorldPosition(savedPosition);
    originalCamera.getWorldDirection(savedTarget);
    savedTarget.multiplyScalar(17).add(savedPosition);
    if (originalCamera.isPerspectiveCamera) camera.fov = originalCamera.fov;
  } else {
    savedTarget.copy(center);
    const reach = Math.max(extent.x, extent.y, extent.z);
    savedPosition.copy(center).add(new Vector3(reach * .15, reach * .25, reach * 1.25));
  }
  if (savedPosition.distanceTo(savedTarget) < .5) savedPosition.add(new Vector3(0, 2, 9));

  function reset() {
    camera.position.copy(savedPosition);
    controls.target.copy(savedTarget);
    camera.updateProjectionMatrix();
    controls.update();
  }
  restoreView = reset;
  reset();

  let width = 0, height = 0;
  function resize() {
    const rect = viewer.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    if (w === width && h === height) return;
    width = w;
    height = h;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(viewer);
  resize();
  let raf = 0;
  function frame() {
    raf = requestAnimationFrame(frame);
    if (document.hidden || currentView !== 'model') return;
    resize();
    controls.update();
    renderer.render(scene, camera);
  }
  frame();
  window.addEventListener('pagehide', () => {
    cancelAnimationFrame(raf);
    resizeObserver.disconnect();
    controls.dispose();
    renderer.dispose();
  }, { once: true });

  threeLoaded = true;
  resetButton.hidden = currentView !== 'model';
  status.hidden = true;
}
